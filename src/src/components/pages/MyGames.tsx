import { useEffect, useMemo, useState } from 'react';
import { createPublicClient, formatEther, http } from 'viem';
import { sepolia } from 'wagmi/chains';
import { useAccount, useWalletClient } from 'wagmi';
import { BrowserProvider, Contract } from 'ethers';
import { initSDK, createInstance, SepoliaConfig } from '@zama-fhe/relayer-sdk/bundle';
import { CONTRACT_ABI, CONTRACT_ADDRESS } from '../../config/numberGamble';

type GameTuple = readonly [string, number, number, bigint, `0x${string}`, string];
const ZeroHash = '0x0000000000000000000000000000000000000000000000000000000000000000';


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
    <div className="card">
      <div className="card-header">
        <h3 className="card-title flex items-center gap-2">
          <span className="text-2xl">👤</span>
          My Games
        </h3>
      </div>

      {!address ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🔗</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Wallet Not Connected</h3>
          <p className="text-gray-500">Connect your wallet to see your games</p>
        </div>
      ) : loading ? (
        <div className="text-center py-12">
          <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-500">Loading your games...</p>
        </div>
      ) : myIds.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🎯</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No games joined yet</h3>
          <p className="text-gray-500">Join a game from the "All Games" tab to get started!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {myIds.map((id) => (
            <MyGameRow
              key={id}
              id={id}
              client={client}
              me={address as `0x${string}`}
              busy={busyId === id}
              onContinue={onContinue}
              onFold={onFold}
              onDecrypt={onDecrypt}
              decrypted={decrypted[id]}
            />
          ))}
        </div>
      )}
    </div>
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

  const getStatusBadge = (state: number) => {
    const stateInfo = {
      0: { label: 'Waiting', class: 'status-badge status-waiting', icon: '⏳' },
      1: { label: 'Started', class: 'status-badge status-started', icon: '🎲' },
      2: { label: 'Ready', class: 'status-badge status-ready', icon: '🔓' },
      3: { label: 'Finished', class: 'status-badge status-finished', icon: '✅' }
    };
    const info = stateInfo[state as keyof typeof stateInfo] || stateInfo[0];
    return (
      <span className={info.class}>
        {info.icon} {info.label}
      </span>
    );
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
      <div className="flex justify-between items-start mb-6">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h4 className="text-lg font-semibold text-gray-900">Game #{id}</h4>
            {getStatusBadge(Number(state))}
            {isCreator && (
              <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs font-medium rounded-md">
                👑 Creator
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-gray-500">👤</span>
              <span className="text-gray-600">
                Creator: <span className="font-mono text-xs">{creator.slice(0, 6)}...{creator.slice(-4)}</span>
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-500">👥</span>
              <span className="text-gray-600">Capacity: {capacity}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-500">💰</span>
              <span className="text-gray-600">Pot: <span className="font-semibold text-green-600">{formatEther(pot)} ETH</span></span>
            </div>
          </div>
        </div>

        <div className="flex gap-2 ml-4">
          {Number(state) === 0 && isCreator && (
            <CreatorStart id={id} />
          )}
          {Number(state) === 2 && isCreator && (
            <CreatorOpen id={id} />
          )}
          {canAct && (
            <>
              <button
                disabled={busy}
                onClick={() => onContinue(id)}
                className="btn-success px-4 py-2 text-sm"
              >
                {busy ? 'Processing...' : '💎 Continue (0.0001 ETH)'}
              </button>
              <button
                disabled={busy}
                onClick={() => onFold(id)}
                className="btn-secondary px-4 py-2 text-sm"
              >
                {busy ? 'Processing...' : '🏃 Fold'}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Encrypted Rolls Section */}
      <div className="border-t pt-4">
        <div className="mb-4">
          <h5 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
            🔐 My Encrypted Rolls
          </h5>

          {Number(state) === 0 ? (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <p className="text-sm text-yellow-700">
                🎯 Cards will be dealt after the creator starts the game
              </p>
            </div>
          ) : enc && enc.length > 0 ? (
            <div className="space-y-3">
              <div className="grid grid-cols-1 gap-2">
                {enc.map((hash, i) => (
                  <div key={i} className="flex items-center gap-3 bg-gray-50 rounded-lg p-3">
                    <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-medium">
                      {i + 1}
                    </span>
                    <code className="flex-1 text-xs font-mono text-gray-600 bg-white px-2 py-1 rounded border overflow-hidden">
                      {hash}
                    </code>
                  </div>
                ))}
              </div>

              {showDecrypt && (
                <div className="flex items-center gap-4 mt-4">
                  <button
                    disabled={busy}
                    onClick={() => onDecrypt(id)}
                    className="btn-primary px-4 py-2 text-sm"
                  >
                    {busy ? 'Decrypting...' : '🔓 Decrypt My Rolls'}
                  </button>
                  {decrypted && (
                    <div className="bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                      <span className="text-sm text-green-700">
                        🎲 <strong>Your rolls:</strong> {decrypted.join(', ')}
                        <span className="ml-2 text-green-600">
                          (Max: {Math.max(...decrypted)})
                        </span>
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
              <p className="text-sm text-gray-500">No encrypted rolls available</p>
            </div>
          )}
        </div>

        {Number(state) === 3 && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mt-4">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🏆</span>
              <div>
                <h6 className="font-medium text-green-900">Game Finished!</h6>
                <p className="text-sm text-green-700">
                  Winner: <span className="font-mono font-medium">{winner.slice(0, 6)}...{winner.slice(-4)}</span>
                  {winner.toLowerCase() === me.toLowerCase() && (
                    <span className="ml-2 px-2 py-1 bg-green-200 text-green-800 text-xs rounded-md font-medium">
                      🎉 You won!
                    </span>
                  )}
                </p>
              </div>
            </div>
          </div>
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
  return (
    <button
      disabled={busy}
      onClick={onStart}
      className="btn-success px-4 py-2 text-sm"
    >
      {busy ? 'Starting...' : '🚀 Start Game'}
    </button>
  );
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
  return (
    <button
      disabled={busy}
      onClick={onOpen}
      className="btn-warning px-4 py-2 text-sm"
    >
      {busy ? 'Opening...' : '🔓 Open Game'}
    </button>
  );
}
