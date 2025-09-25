import { useEffect, useMemo, useState } from 'react';
import { createPublicClient, formatEther, http } from 'viem';
import { sepolia } from 'wagmi/chains';
import { useAccount, useWalletClient } from 'wagmi';
import { BrowserProvider, Contract } from 'ethers';
import { CONTRACT_ABI, CONTRACT_ADDRESS } from '../../config/numberGamble';

type GameTuple = readonly [string, number, number, bigint, `0x${string}`, string];
const stateLabel = (s: number) => (s === 0 ? 'Waiting' : s === 1 ? 'Started' : s === 2 ? 'ReadyToOpen' : s === 3 ? 'Finished' : `${s}`);

export function GamesListPage() {
  const { address } = useAccount();
  const { data: walletClient } = useWalletClient();
  const client = useMemo(() => createPublicClient({ chain: sepolia, transport: http() }), []);
  const [ids, setIds] = useState<number[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    (async () => {
      const count = (await client.readContract({ address: CONTRACT_ADDRESS as `0x${string}`, abi: CONTRACT_ABI as any, functionName: 'gameCount', args: [] })) as bigint;
      setIds(Array.from({ length: Number(count) }, (_, i) => i + 1));
    })();
  }, [client, refreshKey]);

  const writeContract = async () => {
    if (!walletClient) throw new Error('No wallet');
    const provider = new BrowserProvider((window as any).ethereum);
    const signer = await provider.getSigner();
    return new Contract(CONTRACT_ADDRESS, CONTRACT_ABI as any, signer);
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

  return (
    <section style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: 16 }}>
      <h3 style={{ marginTop: 0 }}>Games</h3>
      {ids.length === 0 && <div>No games yet.</div>}
      <div style={{ display: 'grid', gap: 12 }}>
        {ids.map((id) => (
          <GameRow key={id} id={id} client={client} me={address as `0x${string}` | undefined} onJoin={onJoin} onStart={onStart} />
        ))}
      </div>
    </section>
  );
}

function GameRow({ id, client, me, onJoin, onStart }: { id: number; client: any; me?: `0x${string}`; onJoin: (id: number) => Promise<void>; onStart: (id: number) => Promise<void>; }) {
  const [g, setG] = useState<GameTuple | null>(null);
  const [players, setPlayers] = useState<readonly `0x${string}`[]>([]);

  useEffect(() => {
    (async () => {
      const g = (await client.readContract({ address: CONTRACT_ADDRESS as `0x${string}`, abi: CONTRACT_ABI as any, functionName: 'games', args: [BigInt(id)] })) as GameTuple;
      const players = (await client.readContract({ address: CONTRACT_ADDRESS as `0x${string}`, abi: CONTRACT_ABI as any, functionName: 'getPlayers', args: [BigInt(id)] })) as readonly `0x${string}`[];
      setG(g); setPlayers(players);
    })();
  }, [client, id]);

  if (!g) return null;
  const [creator, capacity, state, pot] = g;
  const full = players.length >= capacity;
  const isCreator = me && creator.toLowerCase() === me.toLowerCase();
  const amPlayer = me ? players.map((p) => p.toLowerCase()).includes(me.toLowerCase()) : false;

  return (
    <div style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontWeight: 600 }}>Game #{id} • {stateLabel(Number(state))}</div>
          <div style={{ fontSize: 12, color: '#6b7280' }}>Creator: {creator} • Players: {players.length}/{capacity} • Pot: {formatEther(pot)} ETH</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {Number(state) === 0 && !full && !amPlayer && me && (
            <button onClick={() => onJoin(id)}>Join (0.0001 ETH)</button>
          )}
          {Number(state) === 0 && full && isCreator && (
            <button onClick={() => onStart(id)}>Start</button>
          )}
        </div>
      </div>
    </div>
  );
}

