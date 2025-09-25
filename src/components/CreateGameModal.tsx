import React, { useState } from 'react'
import { useContractWrite, usePrepareContractWrite, useWaitForTransaction } from 'wagmi'
import { parseEther } from 'viem'
import { numberGambleABI } from '../contracts/NumberGambleABI'

const CONTRACT_ADDRESS = '0x...' // TODO: Update after deployment
const ENTRY_FEE = '0.0001'

interface CreateGameModalProps {
  onClose: () => void
  onGameCreated: () => void
}

export function CreateGameModal({ onClose, onGameCreated }: CreateGameModalProps) {
  const [maxPlayers, setMaxPlayers] = useState(3)
  const [isCreating, setIsCreating] = useState(false)
  const [error, setError] = useState('')

  const { config } = usePrepareContractWrite({
    address: CONTRACT_ADDRESS,
    abi: numberGambleABI,
    functionName: 'createGame',
    args: [maxPlayers],
    value: parseEther(ENTRY_FEE),
  })

  const { data, write } = useContractWrite(config)

  const { isLoading: isWaitingForTransaction, isSuccess } = useWaitForTransaction({
    hash: data?.hash,
    onSuccess: () => {
      setIsCreating(false)
      onGameCreated()
    },
    onError: (error) => {
      setIsCreating(false)
      setError('Transaction failed: ' + error.message)
    }
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    
    if (!write) {
      setError('Unable to prepare transaction')
      return
    }

    try {
      setIsCreating(true)
      write()
    } catch (err: any) {
      setIsCreating(false)
      setError('Failed to create game: ' + err.message)
    }
  }

  const isLoading = isCreating || isWaitingForTransaction

  return (
    <div className="modal-overlay">
      <div className="modal">
        <h2>Create New Game</h2>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="maxPlayers">Maximum Players (2-5):</label>
            <select
              id="maxPlayers"
              value={maxPlayers}
              onChange={(e) => setMaxPlayers(parseInt(e.target.value))}
              disabled={isLoading}
            >
              <option value={2}>2 Players</option>
              <option value={3}>3 Players</option>
              <option value={4}>4 Players</option>
              <option value={5}>5 Players</option>
            </select>
          </div>

          <div style={{ 
            background: '#f8fafc', 
            padding: '15px', 
            borderRadius: '8px', 
            marginBottom: '20px',
            border: '1px solid #e2e8f0'
          }}>
            <h4 style={{ marginBottom: '10px', color: '#374151' }}>Game Details:</h4>
            <ul style={{ margin: 0, paddingLeft: '20px', color: '#6b7280' }}>
              <li>Entry Fee: {ENTRY_FEE} ETH</li>
              <li>Continue Fee: {ENTRY_FEE} ETH (if you decide to continue)</li>
              <li>Winner takes all ETH from the prize pool</li>
              <li>Each player gets 3 encrypted random numbers (1-6)</li>
              <li>Highest sum wins after reveal</li>
            </ul>
          </div>

          {error && (
            <div className="error">
              {error}
            </div>
          )}

          {isSuccess && (
            <div className="success">
              Game created successfully!
            </div>
          )}

          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isLoading || !write}
            >
              {isLoading ? (
                <div className="loading">
                  <div className="spinner"></div>
                  Creating Game...
                </div>
              ) : (
                `Create Game (${ENTRY_FEE} ETH)`
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}