import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { ScreenHero, SectionHeader, StatTile } from '../components/WebUI'
import { useGameStore, useAuthStore } from '../context/store'
import { useNakama } from '../hooks/useNakama'
import { useTimer } from '../hooks/useTimer'
import { usePreferences } from '../hooks/usePreferences'
import GameBoard from '../components/GameBoard'
import PlayerCard from '../components/PlayerCard'
import TimerRing from '../components/TimerRing'
import GameOverOverlay from '../components/GameOverOverlay'
import StatusScreen from '../components/StatusScreen'
import { getErrorMessage } from '../lib/client-utils'
import { celebrateWin, playUiTone, triggerHaptic } from '../lib/feedback'

type VoiceStatus = 'idle' | 'connecting' | 'connected' | 'error'

function formatModeLabel(mode: string) {
  return mode.replace(/_/g, ' ')
}

function describeBoardStatus(
  phase: string,
  isConnected: boolean,
  isMatchPaused: boolean | undefined,
  isMyTurn: boolean | undefined,
  isQuantumArmed: boolean,
  selectedCount: number,
  winnerIsMe: boolean,
  opponentName?: string,
) {
  if (!isConnected) {
    return {
      eyebrow: 'Connection',
      title: 'Realtime updates paused',
      detail: 'Reconnect to get back to a live board feed before committing your next move.',
      tone: 'warning',
    } as const
  }

  if (phase === 'lobby') {
    return {
      eyebrow: 'Match status',
      title: 'Waiting for opponent',
      detail: 'The board is reserved and ready. Play will begin the moment the second player joins.',
      tone: 'neutral',
    } as const
  }

  if (phase === 'game_over') {
    return {
      eyebrow: 'Result',
      title: winnerIsMe ? 'You closed it out' : opponentName ? `${opponentName} took the win` : 'Board complete',
      detail: 'Request a rematch or open the replay to review every move.',
      tone: winnerIsMe ? 'success' : 'neutral',
    } as const
  }

  if (isMatchPaused) {
    return {
      eyebrow: 'Paused',
      title: `${opponentName || 'Opponent'} reconnecting`,
      detail: 'Move input is locked until both players are back in sync.',
      tone: 'warning',
    } as const
  }

  if (isQuantumArmed) {
    return {
      eyebrow: 'Quantum move',
      title: selectedCount === 0 ? 'Pick your first open cell' : 'Pick one more open cell',
      detail: `Quantum move armed. ${selectedCount}/2 cells selected.`,
      tone: 'accent',
    } as const
  }

  if (isMyTurn) {
    return {
      eyebrow: 'Your turn',
      title: 'Place your next mark',
      detail: 'Playable cells are highlighted so you can act without second-guessing the board state.',
      tone: 'accent',
    } as const
  }

  return {
    eyebrow: 'Opponent turn',
    title: `${opponentName || 'Opponent'} is thinking`,
    detail: 'The board is live and will update as soon as their move lands on the server.',
    tone: 'neutral',
  } as const
}

export default function GamePage() {
  const { matchId } = useParams<{ matchId: string }>()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { gameState, matchId: currentMatchId, isConnected, lastVoiceSignal } = useGameStore()
  const { connect, joinMatch, leaveMatch, makeMove, makeQuantumMove, requestRematch, sendVoiceSignal } = useNakama()
  const { formattedTime, isLowTime } = useTimer()
  const { soundEnabled, hapticsEnabled, voiceEnabled } = usePreferences()

  const [isLoading, setIsLoading] = useState(true)
  const [joinError, setJoinError] = useState<string | null>(null)
  const [isQuantumArmed, setIsQuantumArmed] = useState(false)
  const [quantumSelection, setQuantumSelection] = useState<number[]>([])
  const [voiceStatus, setVoiceStatus] = useState<VoiceStatus>('idle')
  const [isMuted, setIsMuted] = useState(false)

  const remoteAudioRef = useRef<HTMLAudioElement | null>(null)
  const localStreamRef = useRef<MediaStream | null>(null)
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null)
  const celebratedMatchRef = useRef<string | null>(null)
  const handledVoiceSignalAtRef = useRef<number>(0)

  const attemptJoinMatch = useCallback(async () => {
    if (!matchId) {
      navigate('/lobby')
      return
    }

    try {
      setIsLoading(true)
      setJoinError(null)
      await joinMatch(matchId)
    } catch (error) {
      setJoinError(getErrorMessage(error, 'Unable to join the match right now.'))
    } finally {
      setIsLoading(false)
    }
  }, [joinMatch, matchId, navigate])

  useEffect(() => {
    if (!matchId) {
      navigate('/lobby')
      return
    }

    if (matchId !== currentMatchId) {
      void attemptJoinMatch()
    } else {
      setIsLoading(false)
    }
  }, [attemptJoinMatch, currentMatchId, matchId, navigate])

  useEffect(() => {
    return () => {
      void leaveMatch()
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close()
        peerConnectionRef.current = null
      }
      if (localStreamRef.current) {
        for (const track of localStreamRef.current.getTracks()) {
          track.stop()
        }
        localStreamRef.current = null
      }
    }
  }, [leaveMatch])

  const currentPlayer = useMemo(() => gameState?.players.find((player) => player.userId === user?.userId), [gameState, user?.userId])
  const opponent = useMemo(() => gameState?.players.find((player) => player.userId !== user?.userId), [gameState, user?.userId])
  const isMatchPaused = gameState?.phase === 'playing' && gameState.players.some((player) => !player.connected)
  const isMyTurn = gameState?.currentTurn === user?.userId && !isMatchPaused
  const quantumUsedByMe = Boolean(gameState && user?.userId && gameState.quantumUsed?.[user.userId])
  const moves = useMemo(() => gameState?.moves ?? [], [gameState?.moves])
  const lastMove = moves[moves.length - 1] ?? null
  const recentMoves = useMemo(() => moves.slice(-6).reverse(), [moves])

  const teardownVoice = useCallback(() => {
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close()
      peerConnectionRef.current = null
    }
    if (localStreamRef.current) {
      for (const track of localStreamRef.current.getTracks()) {
        track.stop()
      }
      localStreamRef.current = null
    }
    setVoiceStatus('idle')
    setIsMuted(false)
  }, [])

  const ensurePeerConnection = useCallback(async () => {
    if (peerConnectionRef.current) {
      return peerConnectionRef.current
    }

    const connection = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
    })

    connection.onicecandidate = (event) => {
      if (event.candidate && opponent?.userId) {
        void sendVoiceSignal('ice-candidate', event.candidate, opponent.userId)
      }
    }

    connection.ontrack = (event) => {
      const stream = event.streams[0]
      if (remoteAudioRef.current && stream) {
        remoteAudioRef.current.srcObject = stream
      }
    }

    connection.onconnectionstatechange = () => {
      if (!connection.connectionState) return
      if (connection.connectionState === 'connected') setVoiceStatus('connected')
      if (connection.connectionState === 'failed' || connection.connectionState === 'disconnected') setVoiceStatus('error')
    }

    if (!localStreamRef.current) {
      localStreamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true })
      for (const track of localStreamRef.current.getTracks()) {
        connection.addTrack(track, localStreamRef.current)
      }
    }

    peerConnectionRef.current = connection
    return connection
  }, [opponent?.userId, sendVoiceSignal])

  const handleStartVoiceChat = useCallback(async () => {
    if (!voiceEnabled || !opponent || opponent.userId === 'ai_bot') return
    if (voiceStatus === 'connected' || voiceStatus === 'connecting') return

    try {
      setVoiceStatus('connecting')
      const connection = await ensurePeerConnection()
      const shouldInitiate = Boolean(user?.userId && opponent.userId && user.userId < opponent.userId)
      if (shouldInitiate) {
        const offer = await connection.createOffer()
        await connection.setLocalDescription(offer)
        await sendVoiceSignal('offer', offer, opponent.userId)
      }
      playUiTone('click', soundEnabled)
    } catch (error) {
      console.error('Voice chat start failed:', error)
      setVoiceStatus('error')
      toast.error('Voice chat connection failed')
    }
  }, [voiceEnabled, opponent, voiceStatus, ensurePeerConnection, user?.userId, sendVoiceSignal, soundEnabled])

  const handleToggleMute = useCallback(async () => {
    if (!localStreamRef.current) return
    const nextMuted = !isMuted
    for (const track of localStreamRef.current.getAudioTracks()) {
      track.enabled = !nextMuted
    }
    setIsMuted(nextMuted)
    if (opponent?.userId) {
      await sendVoiceSignal('mute-state', { muted: nextMuted }, opponent.userId)
    }
  }, [isMuted, opponent?.userId, sendVoiceSignal])

  useEffect(() => {
    if (!lastVoiceSignal || !user?.userId || !opponent?.userId) return
    if (lastVoiceSignal.at <= handledVoiceSignalAtRef.current) return
    if (lastVoiceSignal.fromUserId === user.userId) return
    if (lastVoiceSignal.targetUserId && lastVoiceSignal.targetUserId !== user.userId) return

    handledVoiceSignalAtRef.current = lastVoiceSignal.at

    const processSignal = async () => {
      if (!voiceEnabled) return
      try {
        const connection = await ensurePeerConnection()
        if (lastVoiceSignal.signalType === 'offer') {
          const offer = lastVoiceSignal.payload as RTCSessionDescriptionInit
          await connection.setRemoteDescription(new RTCSessionDescription(offer))
          const answer = await connection.createAnswer()
          await connection.setLocalDescription(answer)
          await sendVoiceSignal('answer', answer, opponent.userId)
          return
        }

        if (lastVoiceSignal.signalType === 'answer') {
          const answer = lastVoiceSignal.payload as RTCSessionDescriptionInit
          await connection.setRemoteDescription(new RTCSessionDescription(answer))
          return
        }

        if (lastVoiceSignal.signalType === 'ice-candidate') {
          const candidate = lastVoiceSignal.payload as RTCIceCandidateInit
          await connection.addIceCandidate(new RTCIceCandidate(candidate))
          return
        }

        if (lastVoiceSignal.signalType === 'mute-state') {
          const payload = lastVoiceSignal.payload as { muted?: boolean }
          toast(payload?.muted ? `${opponent.username} muted` : `${opponent.username} unmuted`)
        }
      } catch (error) {
        console.error('Failed to process voice signal:', error)
        setVoiceStatus('error')
      }
    }

    void processSignal()
  }, [lastVoiceSignal, user?.userId, opponent?.userId, opponent?.username, ensurePeerConnection, sendVoiceSignal, voiceEnabled])

  useEffect(() => {
    if (!gameState || !user?.userId) return
    if (gameState.phase !== 'game_over') {
      if (gameState.matchId) {
        celebratedMatchRef.current = null
      }
      return
    }

    if (gameState.winner === user.userId && gameState.matchId && celebratedMatchRef.current !== gameState.matchId) {
      celebratedMatchRef.current = gameState.matchId
      celebrateWin(soundEnabled)
      playUiTone('success', soundEnabled)
      triggerHaptic([60, 30, 60], hapticsEnabled)
    }
  }, [gameState, user?.userId, soundEnabled, hapticsEnabled])

  const handleCellClick = useCallback((position: number) => {
    if (
      !gameState ||
      gameState.phase !== 'playing' ||
      gameState.currentTurn !== user?.userId ||
      gameState.players.some((player) => !player.connected)
    ) {
      return
    }

    if (gameState.board[position] !== null) {
      return
    }

    if (isQuantumArmed && !quantumUsedByMe) {
      const alreadySelected = quantumSelection.includes(position)
      const updatedSelection = alreadySelected
        ? quantumSelection.filter((value) => value !== position)
        : [...quantumSelection, position].slice(0, 2)
      setQuantumSelection(updatedSelection)
      playUiTone('click', soundEnabled)
      triggerHaptic(10, hapticsEnabled)

      if (updatedSelection.length === 2) {
        void makeQuantumMove(updatedSelection)
        setQuantumSelection([])
        setIsQuantumArmed(false)
        playUiTone('success', soundEnabled)
      }
      return
    }

    void makeMove(position)
    playUiTone('click', soundEnabled)
    triggerHaptic(10, hapticsEnabled)
  }, [
    gameState,
    user?.userId,
    isQuantumArmed,
    quantumUsedByMe,
    quantumSelection,
    soundEnabled,
    hapticsEnabled,
    makeMove,
    makeQuantumMove,
  ])

  useEffect(() => {
    if (!gameState || gameState.phase !== 'playing') return

    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null
      const tagName = target?.tagName
      if (tagName === 'INPUT' || tagName === 'TEXTAREA' || tagName === 'SELECT') {
        return
      }

      if (event.key.toLowerCase() === 'q' && isMyTurn && !quantumUsedByMe) {
        event.preventDefault()
        setIsQuantumArmed((value) => !value)
        setQuantumSelection([])
        return
      }

      if (event.key === 'Escape' && isQuantumArmed) {
        event.preventDefault()
        setIsQuantumArmed(false)
        setQuantumSelection([])
        return
      }

      const match = event.code.match(/^(Digit|Numpad)([1-9])$/)
      if (!match || !isMyTurn) return

      event.preventDefault()
      handleCellClick(Number(match[2]) - 1)
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [gameState, handleCellClick, isMyTurn, isQuantumArmed, quantumUsedByMe])

  const handleLeaveGame = () => {
    teardownVoice()
    void leaveMatch()
    navigate('/lobby')
  }

  const handleRequestRematch = () => {
    void requestRematch()
  }

  const handleRetryJoin = () => {
    void attemptJoinMatch()
  }

  const handleReconnect = useCallback(async () => {
    try {
      await connect()
      if (matchId && currentMatchId !== matchId) {
        await joinMatch(matchId)
      }
      setJoinError(null)
    } catch (error) {
      setJoinError(getErrorMessage(error, 'Unable to reconnect to the match.'))
    }
  }, [connect, currentMatchId, joinMatch, matchId])

  const handleShareToDiscord = useCallback(async () => {
    if (!gameState || !user?.userId) return
    const didWin = gameState.winner === user.userId
    const statusText = didWin
      ? `I just won in LILA (${gameState.mode}) in ${gameState.moveCount} moves.`
      : `I just played a ${gameState.mode} LILA match.`

    try {
      await navigator.clipboard.writeText(statusText)
      window.open('https://discord.com/app', '_blank', 'noopener,noreferrer')
      toast.success('Status copied. Paste into Discord to share!')
    } catch {
      toast.error('Could not copy Discord status')
    }
  }, [gameState, user?.userId])

  if (isLoading) {
    return <StatusScreen title="Joining Match" message="Connecting to the server and synchronizing the current game state." isLoading />
  }

  if (joinError) {
    return (
      <StatusScreen
        title="Unable to Join Match"
        message={joinError}
        primaryActionLabel="Retry Join"
        onPrimaryAction={handleRetryJoin}
        secondaryActionLabel="Back to Lobby"
        onSecondaryAction={handleLeaveGame}
      />
    )
  }

  if (!gameState && currentMatchId === matchId) {
    return (
      <StatusScreen
        title="Waiting for Match State"
        message="The server accepted the match join, but the game state has not arrived yet."
        isLoading
        secondaryActionLabel="Back to Lobby"
        onSecondaryAction={handleLeaveGame}
      />
    )
  }

  if (!gameState) {
    return (
      <StatusScreen
        title="Game Not Found"
        message="This match is unavailable or has already ended."
        primaryActionLabel="Back to Lobby"
        onPrimaryAction={() => navigate('/lobby')}
      />
    )
  }

  const boardHeadline = gameState.phase === 'lobby'
    ? 'Waiting for opponent'
    : gameState.phase === 'game_over'
    ? gameState.winner
      ? gameState.winner === user?.userId
        ? 'You won the board'
        : `${opponent?.username || 'Opponent'} won`
      : 'Draw game'
    : isMatchPaused
    ? `${opponent?.username || 'Opponent'} disconnected`
    : isMyTurn
    ? isQuantumArmed
      ? 'Choose two cells'
      : 'Your turn'
    : `${opponent?.username || 'Opponent'} is thinking`
  const boardStatus = describeBoardStatus(
    gameState.phase,
    isConnected,
    isMatchPaused,
    isMyTurn,
    isQuantumArmed,
    quantumSelection.length,
    gameState.winner === user?.userId,
    opponent?.username,
  )
  const quantumStepLabel = quantumSelection.length === 0
    ? 'Select your first open cell.'
    : quantumSelection.length === 1
    ? 'Great. One more open cell will commit the move.'
    : 'Quantum move ready.'

  return (
    <div className="min-h-screen px-4 py-6">
      <div className="stage-shell--narrow">
        <audio ref={remoteAudioRef} autoPlay playsInline />

        {!isConnected && (
          <div className="premium-card mb-6 flex flex-col gap-3 p-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="font-semibold text-[var(--ink)]">Realtime connection lost.</p>
              <p className="text-sm text-[var(--ink-soft)]">The match view may be stale until you reconnect.</p>
            </div>
            <button onClick={() => void handleReconnect()} className="premium-btn premium-btn-primary">
              Reconnect
            </button>
          </div>
        )}

        <div className="mb-6">
          <ScreenHero
            tag={formatModeLabel(gameState.mode)}
            title="Focused board, live pressure."
            description="Every move is validated on the server while the board stays centered and calm."
            dark
          />
        </div>

        <section className="premium-status-strip sticky top-4 z-10 mb-6" data-tone={boardStatus.tone} aria-live="polite">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-[var(--ink-muted)]">{boardStatus.eyebrow}</p>
              <h2 className="mt-2 font-[var(--font-display)] text-2xl font-bold tracking-[-0.05em] text-[var(--ink)]">
                {boardStatus.title}
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-7 text-[var(--ink-soft)]">{boardStatus.detail}</p>
            </div>

            <div className="flex flex-wrap gap-2">
              <span className="premium-pill-light">{formatModeLabel(gameState.mode)}</span>
              <span className="premium-pill-light">{currentPlayer?.symbol || 'X'} to {opponent?.symbol || 'O'}</span>
              {gameState.mode === 'timed' && gameState.phase === 'playing' ? (
                <span className="premium-pill-light">{formattedTime || '0:00'} left</span>
              ) : null}
            </div>
          </div>
        </section>

        <div className="mb-6 grid gap-4 md:grid-cols-2">
          <PlayerCard
            player={currentPlayer}
            isCurrentTurn={Boolean(isMyTurn)}
            isWinner={gameState.winner === currentPlayer?.userId}
            gamePhase={gameState.phase}
          />

          <PlayerCard
            player={opponent}
            isCurrentTurn={!isMyTurn && gameState.phase === 'playing'}
            isWinner={gameState.winner === opponent?.userId}
            gamePhase={gameState.phase}
          />
        </div>

        <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
          <section className="premium-card p-6 md:p-8" data-testid="game-board-card">
            <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
              <SectionHeader
                eyebrow="Board state"
                title={boardHeadline}
                subtitle={
                  gameState.phase === 'playing' && isQuantumArmed
                    ? 'Quantum move is armed. Select two open cells to commit the play.'
                    : 'The live board stays in sync with the server-authoritative match state.'
                }
              />

              {gameState.mode === 'timed' && gameState.phase === 'playing' ? (
                <TimerRing
                  timeLeft={formattedTime || '0:00'}
                  isLowTime={isLowTime}
                  isActive={Boolean(isMyTurn)}
                />
              ) : null}
            </div>

            {gameState.phase === 'playing' && isQuantumArmed && (
              <div className="premium-banner mb-5">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--o)]">Quantum sequence</p>
                  <h3 className="mt-2 font-[var(--font-display)] text-xl font-bold tracking-[-0.04em] text-[var(--ink)]">
                    {boardHeadline}
                  </h3>
                  <p className="mt-2 text-sm text-[var(--ink-soft)]">{quantumStepLabel}</p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-2">
                    <span className={`premium-step ${quantumSelection.length >= 1 ? 'is-complete' : ''}`}>1</span>
                    <span className={`premium-step ${quantumSelection.length >= 2 ? 'is-complete' : ''}`}>2</span>
                  </div>

                  {quantumSelection.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {quantumSelection.map((cellIndex) => (
                        <span key={cellIndex} className="premium-pill-light">
                          Cell {cellIndex + 1}
                        </span>
                      ))}
                    </div>
                  ) : null}
                </div>
              </div>
            )}

            <div className="flex justify-center" aria-live="polite" data-testid="game-board-wrap">
              <GameBoard
                board={gameState.board}
                onCellClick={handleCellClick}
                disabled={gameState.phase !== 'playing' || !isMyTurn || Boolean(isMatchPaused)}
                winLine={gameState.winLine}
                selectedCells={isQuantumArmed ? quantumSelection : []}
                highlightPlayable={gameState.phase === 'playing' && isMyTurn && !isMatchPaused}
                lastMoveCells={lastMove?.positions ?? []}
              />
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <button onClick={handleLeaveGame} className="premium-btn premium-btn-danger">
                Leave Game
              </button>

              {gameState.phase === 'playing' && isMyTurn && !quantumUsedByMe && (
                <button
                  onClick={() => {
                    setIsQuantumArmed(!isQuantumArmed)
                    setQuantumSelection([])
                  }}
                  className={`premium-btn ${isQuantumArmed ? 'premium-btn-warm' : 'premium-btn-secondary'}`}
                >
                  {isQuantumArmed ? 'Cancel Quantum' : 'Quantum Move'}
                </button>
              )}

              {gameState.phase === 'game_over' && (
                <button onClick={handleRequestRematch} className="premium-btn premium-btn-primary">
                  Request Rematch
                </button>
              )}

              <button onClick={handleShareToDiscord} className="premium-btn premium-btn-secondary">
                Share to Discord
              </button>

              {gameState.phase === 'game_over' && gameState.matchId && (
                <button onClick={() => navigate(`/replay/${gameState.matchId}`)} className="premium-btn premium-btn-secondary">
                  Watch Replay
                </button>
              )}
            </div>
          </section>

          <div className="space-y-6">
            <section className="premium-card p-6" data-testid="game-details-card">
              <SectionHeader eyebrow="Match details" title="At a glance" />
              <div className="mt-2 grid gap-3 sm:grid-cols-2">
                <StatTile label="Moves played" value={gameState.moveCount} />
                <StatTile
                  label="Status"
                  value={gameState.phase === 'game_over' ? 'Final' : isMatchPaused ? 'Paused' : isMyTurn ? 'Live' : 'Wait'}
                  tone="var(--o)"
                />
                <StatTile label="Turn" value={isMyTurn ? 'Yours' : opponent?.username || 'Opponent'} />
                <StatTile label="Quantum" value={quantumUsedByMe ? 'Used' : isQuantumArmed ? 'Armed' : 'Ready'} tone="var(--x)" />
                <StatTile
                  label="Latest move"
                  value={lastMove ? `${lastMove.symbol} • ${lastMove.positions.map((position) => position + 1).join(', ')}` : 'Opening'}
                />
                <StatTile
                  label="Input"
                  value={gameState.phase === 'playing' ? 'Mouse + keys' : 'Read only'}
                  tone="var(--success)"
                />
              </div>
            </section>

            <section className="premium-card p-6" data-testid="game-timeline-card">
              <SectionHeader
                eyebrow="Move feed"
                title="Recent sequence"
                subtitle="Latest actions, board context, and faster control hints."
              />

              <div className="mb-5 premium-list">
                {recentMoves.length === 0 ? (
                  <div className="premium-list-item text-sm text-[var(--ink-soft)]">No moves committed yet. The opening turn is still live.</div>
                ) : (
                  recentMoves.map((move, index) => (
                    <div
                      key={`${move.timestamp}-${index}`}
                      className="premium-list-item"
                      style={{
                        borderColor: lastMove?.timestamp === move.timestamp ? 'rgba(74, 141, 255, 0.22)' : undefined,
                        background: lastMove?.timestamp === move.timestamp ? 'rgba(74, 141, 255, 0.08)' : undefined,
                      }}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <div className="font-semibold text-[var(--ink)]">
                            {gameState.players.find((player) => player.userId === move.userId)?.username || move.userId}
                          </div>
                          <div className="mt-1 text-sm text-[var(--ink-soft)]">
                            {move.type === 'quantum' ? 'Quantum move' : 'Normal move'} on cells {move.positions.map((position) => position + 1).join(', ')}
                          </div>
                        </div>
                        <span className="premium-badge">{move.symbol}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="premium-keyline">
                <div className="premium-keyline-item">
                  <span className="premium-keycap">1-9</span>
                  <span>Play cells by keyboard</span>
                </div>
                <div className="premium-keyline-item">
                  <span className="premium-keycap">Q</span>
                  <span>Toggle quantum mode</span>
                </div>
                <div className="premium-keyline-item">
                  <span className="premium-keycap">Esc</span>
                  <span>Cancel quantum selection</span>
                </div>
              </div>
            </section>

            {opponent?.userId !== 'ai_bot' && (
              <section className="premium-card p-6" data-testid="game-voice-card">
                <SectionHeader
                  eyebrow="Voice chat"
                  title="Talk while you play"
                  subtitle="Start a lightweight peer connection when voice chat is enabled in your preferences."
                />

                <div className="mt-5 flex flex-wrap gap-3">
                  <button
                    onClick={() => void handleStartVoiceChat()}
                    disabled={!voiceEnabled || voiceStatus === 'connecting' || voiceStatus === 'connected'}
                    className="premium-btn premium-btn-primary"
                  >
                    {voiceStatus === 'connected' ? 'Voice Connected' : voiceStatus === 'connecting' ? 'Connecting...' : 'Start Voice'}
                  </button>

                  <button
                    onClick={() => void handleToggleMute()}
                    disabled={voiceStatus !== 'connected'}
                    className="premium-btn premium-btn-secondary"
                  >
                    {isMuted ? 'Unmute' : 'Mute'}
                  </button>

                  <button
                    onClick={teardownVoice}
                    disabled={voiceStatus === 'idle'}
                    className="premium-btn premium-btn-secondary"
                  >
                    End Voice
                  </button>
                </div>

                <div className="mt-5 premium-stat">
                  <div className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--ink-muted)]">Connection state</div>
                  <div className="mt-2 font-semibold capitalize text-[var(--ink)]">{voiceStatus}</div>
                </div>
              </section>
            )}
          </div>
        </div>

        {gameState.phase === 'game_over' && (
          <GameOverOverlay
            winner={gameState.winner}
            currentUserId={user?.userId}
            opponentName={opponent?.username}
            onRematch={handleRequestRematch}
            onLeave={handleLeaveGame}
            rematchVotes={gameState.rematchVotes}
            players={gameState.players}
          />
        )}
      </div>
    </div>
  )
}
