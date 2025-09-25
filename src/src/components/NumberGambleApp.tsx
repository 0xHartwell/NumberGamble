import { useState } from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { CreateGamePage } from './pages/CreateGame';
import { GamesListPage } from './pages/GamesList';
import { MyGamesPage } from './pages/MyGames';

export function NumberGambleApp() {
  const [tab, setTab] = useState<'create' | 'games' | 'my'>('create');

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="bg-white shadow-md border-b">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-lg">🎲</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Number Gamble</h1>
                <p className="text-sm text-gray-500">Encrypted Dice Gaming on Ethereum</p>
              </div>
            </div>
            <ConnectButton />
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* Game Rules Card */}
        <div className="card mb-8">
          <div className="card-header">
            <h2 className="card-title flex items-center gap-2">
              <span className="text-2xl">📋</span>
              Game Rules
            </h2>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                Setup & Joining
              </h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 mt-1">•</span>
                  Anyone can create a game with a capacity of 2–5 players
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 mt-1">•</span>
                  Joining a game costs <span className="font-semibold text-gray-900">0.0001 ETH</span> (added to the pot)
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 mt-1">•</span>
                  Once full, creator clicks Start to deal 3 encrypted numbers (1–6)
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                Gameplay & Winning
              </h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-1">•</span>
                  Players decrypt their numbers and choose Continue (0.0001 ETH) or Fold
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-1">•</span>
                  Highest maximum among continuing players wins the entire pot
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-1">•</span>
                  If everyone folds, pot returns to creator
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white rounded-xl shadow-sm border p-2 mb-8">
          <nav className="flex gap-2">
            <TabButton
              active={tab === 'create'}
              onClick={() => setTab('create')}
              icon="➕"
              label="Create Game"
            />
            <TabButton
              active={tab === 'games'}
              onClick={() => setTab('games')}
              icon="🎮"
              label="All Games"
            />
            <TabButton
              active={tab === 'my'}
              onClick={() => setTab('my')}
              icon="👤"
              label="My Games"
            />
          </nav>
        </div>

        {/* Tab Content */}
        <div className="transition-all duration-300">
          {tab === 'create' && <CreateGamePage />}
          {tab === 'games' && <GamesListPage />}
          {tab === 'my' && <MyGamesPage />}
        </div>
      </main>
    </div>
  );
}

function TabButton({ active, onClick, icon, label }: {
  active: boolean;
  onClick: () => void;
  icon: string;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
        active
          ? 'bg-blue-500 text-white shadow-md'
          : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
      }`}
    >
      <span>{icon}</span>
      {label}
    </button>
  );
}
