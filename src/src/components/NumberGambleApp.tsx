import { useEffect, useMemo, useState } from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount, useWalletClient } from 'wagmi';
import { createPublicClient, http, formatEther } from 'viem';
import { sepolia } from 'wagmi/chains';
import { BrowserProvider, Contract } from 'ethers';
import { initSDK, createInstance, SepoliaConfig } from '@zama-fhe/relayer-sdk/bundle';
import { CONTRACT_ABI, CONTRACT_ADDRESS } from '../config/numberGamble';

type GameTuple = readonly [string, number, number, bigint, `0x${string}`, string];

const stateLabel = (s: number) =>
  s === 0 ? 'Waiting' : s === 1 ? 'Started' : s === 2 ? 'ReadyToOpen' : s === 3 ? 'Finished' : `${s}`;

export function NumberGambleApp() {
  const { address } = useAccount();
  const { data: walletClient } = useWalletClient();
  const [creating, setCreating] = useState(false);
  const [capacity, setCapacity] = useState(2);
  const [games, setGames] = useState<number[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [myRolls, setMyRolls] = useState<number[] | null>(null);
  const [busy, setBusy] = useState(false);

  const client = useMemo(() => createPublicClient({ chain: sepolia, transport: http() }), []);

  useEffect(() => {
    (async () => {
      try { await initSDK(); } catch {}
    })();
  }, []);

  useEffect(() => {
    (async () => {
      const count = (await client.readContract({
        address: CONTRACT_ADDRESS as `0x${string}`,
        abi: CONTRACT_ABI as any,
        functionName: 'gameCount',
        args: [],
      })) as bigint;
      const ids: number[] = [];
      for (let i = 1; i <= Number(count); i++) ids.push(i);
      setGames(ids);
    })();
  }, [client, refreshKey]);

  const readGame = async (id: number) => {
    const g = (await client.readContract({
      address: CONTRACT_ADDRESS as `0x${string}`,
      abi: CONTRACT_ABI as any,
      functionName: 'games',
      args: [BigInt(id)],
    })) as GameTuple;
    const players = (await client.readContract({
      address: CONTRACT_ADDRESS as `0x${string}`,
      abi: CONTRACT_ABI as any,
      functionName: 'getPlayers',
      args: [BigInt(id)],
    })) as readonly `0x${string}`[];
    return { g, players };
  };

  const writeContract = async () => {
    if (!walletClient) throw new Error('No wallet');
    const provider = new BrowserProvider((window as any).ethereum);
    const signer = await provider.getSigner();
    return new Contract(CONTRACT_ADDRESS, CONTRACT_ABI as any, signer);
  };

  const onCreate = async () => {
    if (!address) return;
    setCreating(true);
    try {
      const c = await writeContract();
      const tx = await c.createGame(capacity);
      await tx.wait();
      setRefreshKey((k) => k + 1);
    } finally {
      setCreating(false);
    }
  };

  const onJoin = async (id: number) => {
    const c = await writeContract();
    const fee = await c.JOIN_FEE();
    const tx = await c.join(id, { value: fee });
    await tx.wait();
    setRefreshKey((k) => k + 1);
  };

  const onStart = async (id: number) => {
    const c = await writeContract();
    const tx = await c.start(id);
    await tx.wait();
    setRefreshKey((k) => k + 1);
  };

  const onContinue = async (id: number) => {
    const c = await writeContract();
    const fee = await c.CONTINUE_FEE();
    const tx = await c.cont(id, { value: fee });
    await tx.wait();
    setRefreshKey((k) => k + 1);
  };

  const onFold = async (id: number) => {
    const c = await writeContract();
    const tx = await c.fold(id);
    await tx.wait();
    setRefreshKey((k) => k + 1);
  };

  const onOpen = async (id: number) => {
    const c = await writeContract();
    const tx = await c.open(id);
    await tx.wait();
    setRefreshKey((k) => k + 1);
  };

  const onDecryptMyRolls = async (id: number) => {
    if (!address) return;
    setBusy(true);
    try {
      // Read encrypted rolls
      const enc = (await client.readContract({
        address: CONTRACT_ADDRESS as `0x${string}`,
        abi: CONTRACT_ABI as any,
        functionName: 'getMyEncryptedRolls',
        args: [BigInt(id)],
      })) as readonly `0x${string}`[];

      // Prepare relayer instance
      const config = { ...SepoliaConfig, network: (window as any).ethereum } as any;
      const instance = await createInstance(config);
      const keypair = instance.generateKeypair();
      const contractAddresses = [CONTRACT_ADDRESS];
      const startTimeStamp = Math.floor(Date.now() / 1000).toString();
      const durationDays = '7';

      // Sign EIP712
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
      setMyRolls(numbers);
    } catch (e) {
      console.error(e);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ padding: '16px', maxWidth: 960, margin: '0 auto' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2 style={{ margin: 0 }}>Number Gamble</h2>
        <ConnectButton />
      </header>

      <section style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: 16, marginBottom: 16 }}>
        <h3 style={{ marginTop: 0 }}>Create Game</h3>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <label>Capacity (2-5)</label>
          <input
            type="number"
            min={2}
            max={5}
            value={capacity}
            onChange={(e) => setCapacity(Math.max(2, Math.min(5, Number(e.target.value))))}
            style={{ width: 80 }}
          />
          <button onClick={onCreate} disabled={creating || !address}>Create</button>
        </div>
      </section>

      <section style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: 16 }}>
        <h3 style={{ marginTop: 0 }}>Games</h3>
        {games.length === 0 && <div>No games yet.</div>}
        <div style={{ display: 'grid', gap: 12 }}>
          {games.map((id) => (
            <GameRow
              key={id}
              id={id}
              readGame={readGame}
              me={address as `0x${string}` | undefined}
              onJoin={onJoin}
              onStart={onStart}
              onContinue={onContinue}
              onFold={onFold}
              onOpen={onOpen}
              selected={selected === id}
              setSelected={setSelected}
              onDecrypt={onDecryptMyRolls}
              myRolls={selected === id ? myRolls : null}
              busy={busy}
            />
          ))}
        </div>
      </section>
    </div>
  );
}

function GameRow(props: {
  id: number;
  readGame: (id: number) => Promise<{ g: GameTuple; players: readonly `0x${string}`[] }>;
  me?: `0x${string}`;
  onJoin: (id: number) => Promise<void>;
  onStart: (id: number) => Promise<void>;
  onContinue: (id: number) => Promise<void>;
  onFold: (id: number) => Promise<void>;
  onOpen: (id: number) => Promise<void>;
  selected: boolean;
  setSelected: (id: number | null) => void;
  onDecrypt: (id: number) => Promise<void>;
  myRolls: number[] | null;
  busy: boolean;
}) {
  const { id, readGame, me } = props;
  const [g, setG] = useState<GameTuple | null>(null);
  const [players, setPlayers] = useState<readonly `0x${string}`[]>([]);

  useEffect(() => {
    (async () => {
      const { g, players } = await readGame(id);
      setG(g); setPlayers(players);
    })();
  }, [id, readGame, props.selected]);

  if (!g) return null;
  const [creator, capacity, state, pot, , winner] = g;
  const full = players.length >= capacity;
  const isCreator = me && creator.toLowerCase() === me.toLowerCase();
  const amPlayer = me ? players.map((p) => p.toLowerCase()).includes(me.toLowerCase()) : false;

  return (
    <div style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontWeight: 600 }}>Game #{id} • {stateLabel(Number(state))}</div>
          <div style={{ fontSize: 12, color: '#6b7280' }}>
            Creator: {creator} • Players: {players.length}/{capacity} • Pot: {formatEther(pot)} ETH
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {Number(state) === 0 && !full && !amPlayer && me && (
            <button onClick={() => props.onJoin(id)}>Join (0.0001 ETH)</button>
          )}
          {Number(state) === 0 && full && isCreator && (
            <button onClick={() => props.onStart(id)}>Start</button>
          )}
          {Number(state) === 1 && amPlayer && (
            <>
              <button onClick={() => props.onContinue(id)}>Continue (0.0001 ETH)</button>
              <button onClick={() => props.onFold(id)}>Fold</button>
            </>
          )}
          {Number(state) === 2 && isCreator && (
            <button onClick={() => props.onOpen(id)}>Open</button>
          )}
          <button onClick={() => props.setSelected(props.selected ? null : id)}>
            {props.selected ? 'Hide' : 'Details'}
          </button>
        </div>
      </div>

      {props.selected && (
        <div style={{ marginTop: 12 }}>
          <div style={{ marginBottom: 8 }}>Players:</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
            {players.map((p) => (
              <span key={p} style={{ fontFamily: 'monospace', fontSize: 12, background: '#f3f4f6', padding: '2px 6px', borderRadius: 4 }}>{p}</span>
            ))}
          </div>

          {Number(state) === 1 && amPlayer && (
            <div>
              <button disabled={props.busy} onClick={() => props.onDecrypt(id)}>
                {props.busy ? 'Decrypting...' : 'Decrypt My Rolls'}
              </button>
              {props.myRolls && (
                <div style={{ marginTop: 8 }}>Your rolls: {props.myRolls.join(', ')}</div>
              )}
            </div>
          )}

          {Number(state) === 3 && (
            <div style={{ marginTop: 8 }}>Winner: <span style={{ fontFamily: 'monospace' }}>{winner}</span></div>
          )}
        </div>
      )}
    </div>
  );
}
