import React from 'react'
import { useContractRead } from 'wagmi'
import { numberGambleABI } from '../contracts/NumberGambleABI'
import { formatEther } from 'viem'

const CONTRACT_ADDRESS = '0x...' // TODO: Update after deployment

interface GameListProps {
  totalGames: number
  onSelectGame: (gameId: number) => void
  refreshTrigger: number
}

interface GameInfo {
  creator: string
  players: string[]
  maxPlayers: number
  state: number
  totalPrize: bigint
  winner: string
}

const GameStateLabels = {
  0: 'Waiting for Players',
  1: 'Playing',
  2: 'Decision Phase',
  3: 'Finished'
}

const GameStateClasses = {
  0: 'state-waiting',
  1: 'state-playing', 
  2: 'state-decision',
  3: 'state-finished'
}

export function GameList({ totalGames, onSelectGame, refreshTrigger }: GameListProps) {
  const gameIds = Array.from({ length: totalGames }, (_, i) => i)

  return (
    <div className="game-grid">
      {gameIds.map(gameId => (
        <GameCard 
          key={`${gameId}-${refreshTrigger}`}
          gameId={gameId} 
          onSelectGame={onSelectGame} 
        />
      ))}
    </div>
  )
}

interface GameCardProps {
  gameId: number
  onSelectGame: (gameId: number) => void
}

function GameCard({ gameId, onSelectGame }: GameCardProps) {
  const { data: gameInfo, isLoading, error } = useContractRead({
    address: CONTRACT_ADDRESS,
    abi: numberGambleABI,
    functionName: 'getGameInfo',
    args: [BigInt(gameId)],
  }) as { data: GameInfo | undefined, isLoading: boolean, error: any }

  if (isLoading) {
    return (
      <div className="game-card">
        <div className="loading">
          <div className="spinner"></div>
          Loading game #{gameId}...
        </div>
      </div>
    )
  }

  if (error || !gameInfo) {
    return (
      <div className="game-card">
        <div className="error">
          Failed to load game #{gameId}
        </div>
      </div>
    )
  }

  const stateLabel = GameStateLabels[gameInfo.state as keyof typeof GameStateLabels] || 'Unknown'
  const stateClass = GameStateClasses[gameInfo.state as keyof typeof GameStateClasses] || ''

  return (
    <div className="game-card" onClick={() => onSelectGame(gameId)}>
      <div className="mb-4">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <h3>Game #{gameId}</h3>
          <div className={`game-state ${stateClass}`}>
            {stateLabel}
          </div>
        </div>
        
        <div style={{ marginBottom: '10px', color: '#6b7280', fontSize: '0.875rem' }}>
          Creator: {gameInfo.creator.slice(0, 6)}...{gameInfo.creator.slice(-4)}
        </div>
        
        <div style={{ marginBottom: '15px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Players:</span>
            <span>{gameInfo.players.length}/{gameInfo.maxPlayers}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Prize Pool:</span>
            <span>{formatEther(gameInfo.totalPrize)} ETH</span>
          </div>
          {gameInfo.state === 3 && gameInfo.winner !== '0x0000000000000000000000000000000000000000' && (
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#059669', fontWeight: 'bold' }}>
              <span>Winner:</span>
              <span>{gameInfo.winner.slice(0, 6)}...{gameInfo.winner.slice(-4)}</span>
            </div>
          )}
        </div>
        
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {gameInfo.players.slice(0, 3).map((player, index) => (
            <div key={player} style={{ 
              fontSize: '0.75rem', 
              padding: '2px 6px', 
              background: '#f3f4f6', 
              borderRadius: '4px',
              color: '#6b7280'
            }}>
              {player.slice(0, 6)}...{player.slice(-4)}
            </div>
          ))}
          {gameInfo.players.length > 3 && (
            <div style={{ 
              fontSize: '0.75rem', 
              padding: '2px 6px', 
              background: '#f3f4f6', 
              borderRadius: '4px',
              color: '#6b7280'
            }}>
              +{gameInfo.players.length - 3} more
            </div>
          )}
        </div>
      </div>
      
      <button className="btn btn-primary" style={{ width: '100%' }}>
        View Details
      </button>
    </div>
  )
}