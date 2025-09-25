import { useEffect, useMemo, useState } from 'react';
import { createPublicClient, formatEther, http } from 'viem';
import { sepolia } from 'wagmi/chains';
import { useAccount, useWalletClient } from 'wagmi';
import { BrowserProvider, Contract } from 'ethers';
import { CONTRACT_ABI, CONTRACT_ADDRESS } from '../../config/numberGamble';

type GameTuple = readonly [string, number, number, bigint, `0x${string}`, string];

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
    <div className="card">
      <div className="card-header">
        <h3 className="card-title flex items-center gap-2">
          <span className="text-2xl">🎮</span>
          Available Games
        </h3>
      </div>

      {ids.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🎲</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No games available</h3>
          <p className="text-gray-500">Be the first to create a game!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {ids.map((id) => (
            <GameRow key={id} id={id} client={client} me={address as `0x${string}` | undefined} onJoin={onJoin} onStart={onStart} />
          ))}
        </div>
      )}
    </div>
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
    <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h4 className="text-lg font-semibold text-gray-900">Game #{id}</h4>
            {getStatusBadge(Number(state))}
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
              <span className="text-gray-600">Players: {players.length}/{capacity}</span>
              {full && <span className="text-green-600 font-medium">Full!</span>}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-500">💰</span>
              <span className="text-gray-600">Pot: <span className="font-semibold text-green-600">{formatEther(pot)} ETH</span></span>
            </div>
          </div>
        </div>

        <div className="flex gap-2 ml-4">
          {Number(state) === 0 && !full && !amPlayer && me && (
            <button
              onClick={() => onJoin(id)}
              className="btn-primary px-4 py-2 text-sm"
            >
              Join 💎 0.0001 ETH
            </button>
          )}
          {Number(state) === 0 && full && isCreator && (
            <button
              onClick={() => onStart(id)}
              className="btn-success px-4 py-2 text-sm"
            >
              🚀 Start Game
            </button>
          )}
          {Number(state) === 0 && amPlayer && (
            <div className="px-3 py-2 bg-blue-50 text-blue-700 rounded-md text-sm font-medium">
              ✓ Joined
            </div>
          )}
        </div>
      </div>

      {/* Player list */}
      {players.length > 0 && (
        <div className="border-t pt-3">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm font-medium text-gray-700">Players:</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {players.map((player, index) => (
              <span
                key={index}
                className={`px-2 py-1 rounded-md text-xs font-mono ${
                  me && player.toLowerCase() === me.toLowerCase()
                    ? 'bg-blue-100 text-blue-800 border border-blue-200'
                    : 'bg-gray-100 text-gray-600'
                }`}
              >
                {me && player.toLowerCase() === me.toLowerCase() ? '👤 You' : `${player.slice(0, 6)}...${player.slice(-4)}`}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
