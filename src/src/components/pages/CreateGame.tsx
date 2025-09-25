import { useState } from 'react';
import { useAccount, useWalletClient } from 'wagmi';
import { BrowserProvider, Contract } from 'ethers';
import { CONTRACT_ABI, CONTRACT_ADDRESS } from '../../config/numberGamble';

export function CreateGamePage() {
  const { address } = useAccount();
  const { data: walletClient } = useWalletClient();
  const [capacity, setCapacity] = useState(2);
  const [busy, setBusy] = useState(false);

  const onCreate = async () => {
    if (!walletClient) return;
    setBusy(true);
    try {
      const provider = new BrowserProvider((window as any).ethereum);
      const signer = await provider.getSigner();
      const c = new Contract(CONTRACT_ADDRESS, CONTRACT_ABI as any, signer);
      const tx = await c.createGame(capacity);
      await tx.wait();
    } catch (e) {
      console.error(e);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="card">
      <div className="card-header">
        <h3 className="card-title flex items-center gap-2">
          <span className="text-2xl">🎯</span>
          Create New Game
        </h3>
      </div>

      <div className="space-y-6">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-blue-600">ℹ️</span>
            <span className="font-medium text-blue-900">Game Setup</span>
          </div>
          <p className="text-sm text-blue-700">
            Creating a game is free, but players pay 0.0001 ETH to join and continue playing.
          </p>
        </div>

        <div className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Player Capacity
            </label>
            <div className="flex items-center gap-4">
              <input
                type="number"
                min={2}
                max={5}
                value={capacity}
                onChange={(e) => setCapacity(Math.max(2, Math.min(5, Number(e.target.value))))}
                className="w-20 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <span className="text-sm text-gray-500">players (2-5)</span>
            </div>
          </div>

          <div className="flex justify-between items-center pt-4 border-t">
            <div>
              <p className="text-sm text-gray-600">
                {!address ? 'Connect wallet to create a game' : 'Ready to create your game'}
              </p>
            </div>
            <button
              onClick={onCreate}
              disabled={!address || busy}
              className={`px-6 py-2 rounded-lg font-medium transition-all duration-200 ${
                !address || busy
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-lg hover:-translate-y-0.5'
              }`}
            >
              {busy ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Creating...
                </span>
              ) : (
                'Create Game 🚀'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

