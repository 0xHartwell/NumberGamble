import React, { useState, useEffect } from 'react'
import { useAccount, useContractRead, useContractWrite, usePrepareContractWrite, useWaitForTransaction } from 'wagmi'
import { parseEther, formatEther } from 'viem'
import { numberGambleABI } from '../contracts/NumberGambleABI'
// import { createInstance, SepoliaConfig } from '@zama-fhe/relayer-sdk'

const CONTRACT_ADDRESS = '0x...' // TODO: Update after deployment
const ENTRY_FEE = '0.0001'
const CONTINUE_FEE = '0.0001'

interface GameDetailsProps {
  gameId: number
  onBack: () => void
  onRefresh: () => void
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

const PlayerDecisionLabels = {
  0: 'Waiting',
  1: 'Continue',
  2: 'Give Up'
}

export function GameDetails({ gameId, onBack, onRefresh }: GameDetailsProps) {
  const { address } = useAccount()
  const [fhevmInstance, setFhevmInstance] = useState<any>(null)
  const [decryptedNumbers, setDecryptedNumbers] = useState<number[]>([])
  const [isDecrypting, setIsDecrypting] = useState(false)
  const [error, setError] = useState('')

  // Initialize FHEVM instance (commented out for now)
  // useEffect(() => {
  //   const initFHEVM = async () => {
  //     try {
  //       const instance = await createInstance(SepoliaConfig)
  //       setFhevmInstance(instance)
  //     } catch (err) {
  //       console.error('Failed to initialize FHEVM:', err)
  //     }
  //   }
  //   initFHEVM()
  // }, [])

  const { data: gameInfo, refetch: refetchGameInfo } = useContractRead({
    address: CONTRACT_ADDRESS,
    abi: numberGambleABI,
    functionName: 'getGameInfo',
    args: [BigInt(gameId)],
  }) as { data: GameInfo | undefined, refetch: () => void }

  const { data: playerNumbers, refetch: refetchPlayerNumbers } = useContractRead({
    address: CONTRACT_ADDRESS,
    abi: numberGambleABI,
    functionName: 'getPlayerNumbers',
    args: [BigInt(gameId)],
    enabled: gameInfo?.state !== 0 && gameInfo?.players.includes(address || ''),
  })

  const { data: playerDecision, refetch: refetchPlayerDecision } = useContractRead({
    address: CONTRACT_ADDRESS,
    abi: numberGambleABI,
    functionName: 'getPlayerDecision',
    args: [BigInt(gameId), address || '0x0'],
    enabled: !!address,
  })

  // Join game preparation
  const { config: joinConfig } = usePrepareContractWrite({
    address: CONTRACT_ADDRESS,
    abi: numberGambleABI,
    functionName: 'joinGame',
    args: [BigInt(gameId)],
    value: parseEther(ENTRY_FEE),
    enabled: gameInfo?.state === 0 && !gameInfo?.players.includes(address || ''),
  })

  const { data: joinData, write: joinWrite } = useContractWrite(joinConfig)
  const { isLoading: isJoining } = useWaitForTransaction({
    hash: joinData?.hash,
    onSuccess: () => {
      refetchGameInfo()
      onRefresh()
    },
  })

  // Start game preparation
  const { config: startConfig } = usePrepareContractWrite({
    address: CONTRACT_ADDRESS,
    abi: numberGambleABI,
    functionName: 'startGame',
    args: [BigInt(gameId)],
    enabled: gameInfo?.creator === address && gameInfo?.state === 0 && gameInfo?.players.length === gameInfo?.maxPlayers,
  })

  const { data: startData, write: startWrite } = useContractWrite(startConfig)
  const { isLoading: isStarting } = useWaitForTransaction({
    hash: startData?.hash,
    onSuccess: () => {
      refetchGameInfo()
      refetchPlayerNumbers()
    },
  })

  // Continue game preparation
  const { config: continueConfig } = usePrepareContractWrite({
    address: CONTRACT_ADDRESS,
    abi: numberGambleABI,
    functionName: 'makeDecision',
    args: [BigInt(gameId), true],
    value: parseEther(CONTINUE_FEE),
    enabled: gameInfo?.state === 2 && playerDecision === 0,
  })

  const { data: continueData, write: continueWrite } = useContractWrite(continueConfig)
  const { isLoading: isContinuing } = useWaitForTransaction({
    hash: continueData?.hash,
    onSuccess: () => {
      refetchGameInfo()
      refetchPlayerDecision()
      onRefresh()
    },
  })

  // Give up preparation
  const { config: giveUpConfig } = usePrepareContractWrite({
    address: CONTRACT_ADDRESS,
    abi: numberGambleABI,
    functionName: 'makeDecision',
    args: [BigInt(gameId), false],
    value: 0n,
    enabled: gameInfo?.state === 2 && playerDecision === 0,
  })

  const { data: giveUpData, write: giveUpWrite } = useContractWrite(giveUpConfig)
  const { isLoading: isGivingUp } = useWaitForTransaction({
    hash: giveUpData?.hash,
    onSuccess: () => {
      refetchGameInfo()
      refetchPlayerDecision()
      onRefresh()
    },
  })

  // Reveal and finish preparation
  const { config: revealConfig } = usePrepareContractWrite({
    address: CONTRACT_ADDRESS,
    abi: numberGambleABI,
    functionName: 'revealAndFinish',
    args: [BigInt(gameId)],
    enabled: gameInfo?.creator === address && gameInfo?.state === 2,
  })

  const { data: revealData, write: revealWrite } = useContractWrite(revealConfig)
  const { isLoading: isRevealing } = useWaitForTransaction({
    hash: revealData?.hash,
    onSuccess: () => {
      refetchGameInfo()
      onRefresh()
    },
  })

  const decryptNumbers = async () => {
    if (!fhevmInstance || !playerNumbers || !address) return

    setIsDecrypting(true)
    setError('')

    try {
      // This is a simplified version - in a real implementation, you'd need to
      // properly handle the FHE decryption process with keypairs and signatures
      // For now, we'll simulate the decryption
      const mockDecryptedNumbers = [
        Math.floor(Math.random() * 6) + 1,
        Math.floor(Math.random() * 6) + 1,
        Math.floor(Math.random() * 6) + 1,
      ]
      
      setDecryptedNumbers(mockDecryptedNumbers)
    } catch (err: any) {
      setError('Failed to decrypt numbers: ' + err.message)
    } finally {
      setIsDecrypting(false)
    }
  }

  if (!gameInfo) {
    return (
      <div className="card">
        <div className="loading">
          <div className="spinner"></div>
          Loading game details...
        </div>
      </div>
    )
  }

  const isPlayer = gameInfo.players.includes(address || '')
  const canJoin = gameInfo.state === 0 && !isPlayer && gameInfo.players.length < gameInfo.maxPlayers
  const canStart = gameInfo.creator === address && gameInfo.state === 0 && gameInfo.players.length === gameInfo.maxPlayers
  const canMakeDecision = gameInfo.state === 2 && isPlayer && playerDecision === 0
  const canReveal = gameInfo.creator === address && gameInfo.state === 2

  return (
    <div className="card">
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
        <button className="btn btn-secondary" onClick={onBack} style={{ marginRight: '15px' }}>
          ← Back
        </button>
        <h2>Game #{gameId}</h2>
        <div className={`game-state ${gameInfo.state === 0 ? 'state-waiting' : gameInfo.state === 1 ? 'state-playing' : gameInfo.state === 2 ? 'state-decision' : 'state-finished'}`} style={{ marginLeft: 'auto' }}>
          {GameStateLabels[gameInfo.state as keyof typeof GameStateLabels]}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
        {/* Game Info */}
        <div>
          <h3>Game Information</h3>
          <div style={{ marginBottom: '15px' }}>
            <div><strong>Creator:</strong> {gameInfo.creator}</div>
            <div><strong>Players:</strong> {gameInfo.players.length}/{gameInfo.maxPlayers}</div>
            <div><strong>Prize Pool:</strong> {formatEther(gameInfo.totalPrize)} ETH</div>
            {gameInfo.winner !== '0x0000000000000000000000000000000000000000' && (
              <div><strong>Winner:</strong> {gameInfo.winner}</div>
            )}
          </div>

          <div className="players-list">
            <h4>Players</h4>
            {gameInfo.players.map((player, index) => (
              <div key={player} className="player-item">
                <span>
                  {index + 1}. {player}
                  {player === address && <span style={{ color: '#059669' }}> (You)</span>}
                  {player === gameInfo.creator && <span style={{ color: '#d97706' }}> (Creator)</span>}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div>
          <h3>Actions</h3>
          
          {error && <div className="error">{error}</div>}

          {canJoin && (
            <button 
              className="btn btn-primary"
              onClick={() => joinWrite?.()}
              disabled={isJoining || !joinWrite}
            >
              {isJoining ? 'Joining...' : `Join Game (${ENTRY_FEE} ETH)`}
            </button>
          )}

          {canStart && (
            <button 
              className="btn btn-success"
              onClick={() => startWrite?.()}
              disabled={isStarting || !startWrite}
            >
              {isStarting ? 'Starting...' : 'Start Game'}
            </button>
          )}

          {/* Player Numbers */}
          {isPlayer && gameInfo.state >= 1 && (
            <div style={{ marginTop: '20px' }}>
              <h4>Your Numbers</h4>
              {decryptedNumbers.length > 0 ? (
                <div>
                  <div className="numbers-display">
                    {decryptedNumbers.map((num, index) => (
                      <div key={index} className="number-box">{num}</div>
                    ))}
                  </div>
                  <div style={{ marginTop: '10px', color: '#6b7280' }}>
                    Total: {decryptedNumbers.reduce((sum, num) => sum + num, 0)}
                  </div>
                </div>
              ) : playerNumbers ? (
                <div>
                  <div style={{ marginBottom: '10px', color: '#6b7280' }}>
                    You have encrypted numbers. Click to decrypt them:
                  </div>
                  <button 
                    className="btn btn-secondary"
                    onClick={decryptNumbers}
                    disabled={isDecrypting}
                  >
                    {isDecrypting ? 'Decrypting...' : 'Decrypt My Numbers'}
                  </button>
                </div>
              ) : (
                <div style={{ color: '#6b7280' }}>
                  Numbers will be available after game starts
                </div>
              )}
            </div>
          )}

          {/* Decision Making */}
          {canMakeDecision && (
            <div style={{ marginTop: '20px' }}>
              <h4>Make Your Decision</h4>
              <div style={{ marginBottom: '15px', color: '#6b7280' }}>
                Do you want to continue playing? You need to pay {CONTINUE_FEE} ETH to continue.
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button 
                  className="btn btn-success"
                  onClick={() => continueWrite?.()}
                  disabled={isContinuing || !continueWrite}
                >
                  {isContinuing ? 'Processing...' : `Continue (${CONTINUE_FEE} ETH)`}
                </button>
                <button 
                  className="btn btn-danger"
                  onClick={() => giveUpWrite?.()}
                  disabled={isGivingUp || !giveUpWrite}
                >
                  {isGivingUp ? 'Processing...' : 'Give Up'}
                </button>
              </div>
            </div>
          )}

          {canReveal && (
            <div style={{ marginTop: '20px' }}>
              <button 
                className="btn btn-primary"
                onClick={() => revealWrite?.()}
                disabled={isRevealing || !revealWrite}
              >
                {isRevealing ? 'Revealing...' : 'Reveal Results & Finish Game'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}