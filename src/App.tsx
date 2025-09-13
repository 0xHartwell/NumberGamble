import React, { useState, useEffect } from 'react'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { useAccount, useContractRead, useContractWrite, usePrepareContractWrite } from 'wagmi'
import { parseEther, formatEther } from 'viem'
import { GameList } from './components/GameList'
import { CreateGameModal } from './components/CreateGameModal'
import { GameDetails } from './components/GameDetails'
import { numberGambleABI } from './contracts/NumberGambleABI'

// Replace with your deployed contract address
const CONTRACT_ADDRESS = '0x...' // TODO: Update after deployment

function App() {
  const { address, isConnected } = useAccount()
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedGameId, setSelectedGameId] = useState<number | null>(null)
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  // Get total games count
  const { data: totalGames, refetch: refetchTotalGames } = useContractRead({
    address: CONTRACT_ADDRESS,
    abi: numberGambleABI,
    functionName: 'getTotalGames',
  })

  const refreshData = () => {
    setRefreshTrigger(prev => prev + 1)
    refetchTotalGames()
  }

  if (!isConnected) {
    return (
      <div className="container">
        <div className="header">
          <h1>Number Gamble</h1>
          <ConnectButton />
        </div>
        <div className="card text-center">
          <h2>Welcome to Number Gamble</h2>
          <p style={{ margin: '20px 0', color: '#6b7280' }}>
            A confidential number guessing game built on FHEVM. 
            Connect your wallet to start playing!
          </p>
          <div style={{ margin: '30px 0' }}>
            <h3>How to Play:</h3>
            <ul style={{ textAlign: 'left', maxWidth: '600px', margin: '20px auto' }}>
              <li>• Create or join a game (2-5 players) with 0.0001 ETH entry fee</li>
              <li>• Get 3 encrypted random numbers (1-6) when game starts</li>
              <li>• Decide to continue (pay 0.0001 ETH) or give up</li>
              <li>• Player with highest sum of numbers wins all ETH!</li>
            </ul>
          </div>
          <ConnectButton />
        </div>
      </div>
    )
  }

  return (
    <div className="container">
      <div className="header">
        <h1>Number Gamble</h1>
        <ConnectButton />
      </div>

      {selectedGameId !== null ? (
        <GameDetails 
          gameId={selectedGameId}
          onBack={() => setSelectedGameId(null)}
          onRefresh={refreshData}
        />
      ) : (
        <>
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2>Games</h2>
              <button 
                className="btn btn-primary"
                onClick={() => setShowCreateModal(true)}
              >
                Create New Game
              </button>
            </div>
            
            {totalGames && Number(totalGames) > 0 ? (
              <GameList 
                totalGames={Number(totalGames)}
                onSelectGame={setSelectedGameId}
                refreshTrigger={refreshTrigger}
              />
            ) : (
              <div className="text-center" style={{ padding: '40px 0', color: '#6b7280' }}>
                <p>No games created yet. Be the first to create a game!</p>
              </div>
            )}
          </div>
        </>
      )}

      {showCreateModal && (
        <CreateGameModal
          onClose={() => setShowCreateModal(false)}
          onGameCreated={() => {
            setShowCreateModal(false)
            refreshData()
          }}
        />
      )}
    </div>
  )
}

export default App