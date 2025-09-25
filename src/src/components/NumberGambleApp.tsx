import { useState } from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { CreateGamePage } from './pages/CreateGame';
import { GamesListPage } from './pages/GamesList';
import { MyGamesPage } from './pages/MyGames';

export function NumberGambleApp() {
  const [tab, setTab] = useState<'create' | 'games' | 'my'>('create');
  return (
    <div style={{ padding: '16px', maxWidth: 960, margin: '0 auto' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2 style={{ margin: 0 }}>Number Gamble</h2>
        <ConnectButton />
      </header>
      <section style={{ marginBottom: 16, border: '1px solid #e5e7eb', borderRadius: 8, padding: 16, background: '#fafafa' }}>
        <h3 style={{ marginTop: 0, marginBottom: 8 }}>Game Rules</h3>
        <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.5 }}>
          <li>Anyone can create a game with a capacity of 2–5 players.</li>
          <li>Joining a game costs 0.0001 ETH (added to the pot).</li>
          <li>Once the game is full, the creator must click Start to deal 3 encrypted numbers (1–6) to each player.</li>
          <li>Each player may decrypt only their own numbers using the relayer and decide to Continue (0.0001 ETH) or Fold.</li>
          <li>After all players act, the creator can Open the game.</li>
          <li>The highest maximum among the three rolls of the players who Continued wins the entire pot. Ties break by address.</li>
          <li>If everyone folds, the pot goes back to the creator.</li>
        </ul>
      </section>
      <nav style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <button onClick={() => setTab('create')} style={{ fontWeight: tab==='create'?700:500 }}>Create</button>
        <button onClick={() => setTab('games')} style={{ fontWeight: tab==='games'?700:500 }}>Games</button>
        <button onClick={() => setTab('my')} style={{ fontWeight: tab==='my'?700:500 }}>My Games</button>
      </nav>
      {tab === 'create' && <CreateGamePage />}
      {tab === 'games' && <GamesListPage />}
      {tab === 'my' && <MyGamesPage />}
    </div>
  );
}
