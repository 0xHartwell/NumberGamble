import { useEffect, useMemo, useState } from 'react';
import { createPublicClient, formatEther, http } from 'viem';
import { sepolia } from 'wagmi/chains';
import { useAccount, useWalletClient } from 'wagmi';
import { BrowserProvider, Contract } from 'ethers';
import { initSDK, createInstance, SepoliaConfig } from '@zama-fhe/relayer-sdk/bundle';
import { CONTRACT_ABI, CONTRACT_ADDRESS } from '../../config/numberGamble';

type GameTuple = readonly [string, number, number, bigint, `0x${string}`, string];
const ZeroHash = '0x0000000000000000000000000000000000000000000000000000000000000000';

const stateLabel = (s: number) => (s === 0 ? 'Waiting' : s === 1 ? 'Started' : s === 2 ? 'ReadyToOpen' : s === 3 ? 'Finished' : `${s}`);

export function MyGamesPage() {
  const { address } = useAccount();
  const { data: walletClient } = useWalletClient();
  const client = useMemo(() => createPublicClient({ chain: sepolia, transport: http() }), []);
  const [myIds, setMyIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [decrypted, setDecrypted] = useState<Record<number, number[]>>({});

  useEffect(() => { (async () => { try { await initSDK(); } catch {} })(); }, []);

  useEffect(() => {
    if (!address) { setMyIds([]); return; }
    (async () => {
      setLoading(true);
      try {
        const count = (await client.readContract({ address: CONTRACT_ADDRESS as `0x${string}`, abi: CONTRACT_ABI as any, functionName: 'gameCount', args: [] })) as bigint;
        const ids: number[] = [];
        for (let i = 1; i <= Number(count); i++) {
          const amIn = (await client.readContract({ address: CONTRACT_ADDRESS as `0x${string}`, abi: CONTRACT_ABI as any, functionName: 'isPlayer', args: [BigInt(i), address] })) as boolean;
          if (amIn) ids.push(i);
        }
        setMyIds(ids);
      } finally {
        setLoading(false);
      }
    })();
  }, [address, client]);

  const writeContract = async () => {
    if (!walletClient) throw new Error('No wallet');
    const provider = new BrowserProvider((window as any).ethereum);
    const signer = await provider.getSigner();
    return new Contract(CONTRACT_ADDRESS, CONTRACT_ABI as any, signer);
  };

  const onContinue = async (id: number) => {
    setBusyId(id);
    try {
      const c = await writeContract();
      const fee = await c.CONTINUE_FEE();
      const tx = await c.cont(id, { value: fee });
      await tx.wait();
    } finally { setBusyId(null); }
  };
  const onFold = async (id: number) => {
    setBusyId(id);
    try {
      const c = await writeContract();
      const tx = await c.fold(id);
      await tx.wait();
    } finally { setBusyId(null); }
  };

  const onDecrypt = async (id: number) => {
    if (!address) return;
    setBusyId(id);
    try {
      const enc = (await client.readContract({ address: CONTRACT_ADDRESS as `0x${string}`, abi: CONTRACT_ABI as any, functionName: 'getMyEncryptedRolls', args: [BigInt(id), address] })) as readonly `0x${string}`[];
      const allZero = enc.every((h) => h === ZeroHash);
      if (allZero) { return; }

      const config = { ...SepoliaConfig, network: (window as any).ethereum } as any;
      const instance = await createInstance(config);
      const keypair = instance.generateKeypair();
      const contractAddresses = [CONTRACT_ADDRESS];
      const startTimeStamp = Math.floor(Date.now() / 1000).toString();
      const durationDays = '7';

      const provider = new BrowserProvider((window as any).ethereum);
      const signer = await provider.getSigner();
      const eip712 = instance.createEIP712(keypair.publicKey, contractAddresses, startTimeStamp, durationDays);
      const signature = await (signer as any).signTypedData(
        eip712.domain,
        { UserDecryptRequestVerification: eip712.types.UserDecryptRequestVerification },
        eip712.message,
      );

      const pairs = enc.map((h) => ({ handle: h, contractAddress: CONTRACT_ADDRESS }));
      const result = await instance.userDecrypt(
        pairs,
        keypair.privateKey,
        keypair.publicKey,
        (signature as string).replace('0x', ''),
        contractAddresses,
        address,
        startTimeStamp,
        durationDays,
      );
      const numbers = enc.map((h) => Number(result[h as string]));
      setDecrypted((prev) => ({ ...prev, [id]: numbers }));
    } catch (e) {
      console.error(e);
    } finally { setBusyId(null); }
  };

  return (
    <section style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: 16 }}>
      <h3 style={{ marginTop: 0 }}>My Games</h3>
      {!address && <div>Connect wallet to see your games.</div>}
      {address && loading && <div>Loading…</div>}
      {address && !loading && myIds.length === 0 && <div>No joined games yet.</div>}
      <div style={{ display: 'grid', gap: 12 }}>
        {myIds.map((id) => (
          <MyGameRow key={id} id={id} client={client} me={address as `0x${string}`} busy={busyId === id} onContinue={onContinue} onFold={onFold} onDecrypt={onDecrypt} decrypted={decrypted[id]} />
        ))}
      </div>
    </section>
  );
}

function MyGameRow({ id, client, me, busy, onContinue, onFold, onDecrypt, decrypted }: { id: number; client: any; me: `0x${string}`; busy: boolean; onContinue: (id: number) => Promise<void>; onFold: (id: number) => Promise<void>; onDecrypt: (id: number) => Promise<void>; decrypted?: number[]; }) {
  const [g, setG] = useState<GameTuple | null>(null);
  const [action, setAction] = useState<number>(0);
  const [enc, setEnc] = useState<readonly `0x${string}`[] | null>(null);

  useEffect(() => {
    (async () => {
      const g = (await client.readContract({ address: CONTRACT_ADDRESS as `0x${string}`, abi: CONTRACT_ABI as any, functionName: 'games', args: [BigInt(id)] })) as GameTuple;
      const a = (await client.readContract({ address: CONTRACT_ADDRESS as `0x${string}`, abi: CONTRACT_ABI as any, functionName: 'getAction', args: [BigInt(id), me] })) as number;
      const enc = (await client.readContract({ address: CONTRACT_ADDRESS as `0x${string}`, abi: CONTRACT_ABI as any, functionName: 'getMyEncryptedRolls', args: [BigInt(id), me] })) as readonly `0x${string}`[];
      setG(g); setAction(Number(a)); setEnc(enc);
    })();
  }, [client, id, me]);

  if (!g) return null;
  const [creator, capacity, state, pot, , winner] = g;
  const showDecrypt = enc && enc.some((h) => h !== ZeroHash) && Number(state) === 1;
  const canAct = Number(state) === 1 && action === 0;
  const isCreator = creator.toLowerCase() === me.toLowerCase();

  return (
    <div style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontWeight: 600 }}>Game #{id} • {stateLabel(Number(state))}</div>
          <div style={{ fontSize: 12, color: '#6b7280' }}>Creator: {creator} • Capacity: {capacity} • Pot: {formatEther(pot)} ETH</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {Number(state) === 0 && isCreator && (
            <CreatorStart id={id} />
          )}
          {Number(state) === 2 && isCreator && (
            <CreatorOpen id={id} />
          )}
          {canAct && (
            <>
              <button disabled={busy} onClick={() => onContinue(id)}>{busy ? 'Continuing…' : 'Continue (0.0001 ETH)'}</button>
              <button disabled={busy} onClick={() => onFold(id)}>{busy ? 'Folding…' : 'Fold'}</button>
            </>
          )}
        </div>
      </div>

      <div style={{ marginTop: 8 }}>
        <div style={{ marginBottom: 6 }}>My Encrypted Rolls:</div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {(enc || []).map((h, i) => (
            <code key={i} style={{ fontSize: 11, background: '#f3f4f6', padding: '2px 6px', borderRadius: 4 }}>{h}</code>
          ))}
        </div>
        {Number(state) === 0 && (
          <div style={{ marginTop: 6, color: '#6b7280', fontSize: 12 }}>Cards are dealt after the creator starts the game.</div>
        )}
        {showDecrypt && (
          <div style={{ marginTop: 8 }}>
            <button disabled={busy} onClick={() => onDecrypt(id)}>{busy ? 'Decrypting…' : 'Decrypt My Rolls'}</button>
            {decrypted && (
              <div style={{ marginTop: 6 }}>Decrypted: {decrypted.join(', ')}</div>
            )}
          </div>
        )}
        {Number(state) === 3 && (
          <div style={{ marginTop: 6 }}>Winner: <span style={{ fontFamily: 'monospace' }}>{winner}</span></div>
        )}
      </div>
    </div>
  );
}

function CreatorStart({ id }: { id: number }) {
  const { data: walletClient } = useWalletClient();
  const [busy, setBusy] = useState(false);
  const onStart = async () => {
    if (!walletClient) return;
    setBusy(true);
    try {
      const provider = new BrowserProvider((window as any).ethereum);
      const signer = await provider.getSigner();
      const c = new Contract(CONTRACT_ADDRESS, CONTRACT_ABI as any, signer);
      const tx = await c.start(id);
      await tx.wait();
    } finally { setBusy(false); }
  };
  return <button disabled={busy} onClick={onStart}>{busy ? 'Starting…' : 'Start'}</button>;
}

function CreatorOpen({ id }: { id: number }) {
  const { data: walletClient } = useWalletClient();
  const [busy, setBusy] = useState(false);
  const onOpen = async () => {
    if (!walletClient) return;
    setBusy(true);
    try {
      const provider = new BrowserProvider((window as any).ethereum);
      const signer = await provider.getSigner();
      const c = new Contract(CONTRACT_ADDRESS, CONTRACT_ABI as any, signer);
      const tx = await c.open(id);
      await tx.wait();
    } finally { setBusy(false); }
  };
  return <button disabled={busy} onClick={onOpen}>{busy ? 'Opening…' : 'Open'}</button>;
}
