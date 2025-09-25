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
