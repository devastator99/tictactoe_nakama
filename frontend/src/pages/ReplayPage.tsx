import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ScreenHero, SectionHeader } from '../components/WebUI'
import { ReplayRecord } from '../types'
import { nakamaService } from '../services/nakama.service'
import StatusScreen from '../components/StatusScreen'
import ReplayNotFound from '../components/ReplayNotFound'
import { logger } from '../lib/logger'

function buildBoard(replay: ReplayRecord, moveCount: number): Array<'X' | 'O' | null> {
  const board: Array<'X' | 'O' | null> = Array(9).fill(null)
  const capped = replay.moves.slice(0, moveCount)
  for (const move of capped) {
    for (const position of move.positions) {
      board[position] = move.symbol
    }
  }
  return board
}

function renderCellSymbol(cell: 'X' | 'O' | null) {
  if (cell === 'X') return <span className="symbol-x font-[var(--font-display)] text-4xl font-bold tracking-[-0.08em]">X</span>
  if (cell === 'O') return <span className="symbol-o font-[var(--font-display)] text-4xl font-bold tracking-[-0.08em]">O</span>
  return <span className="text-xl text-[rgba(110,126,143,0.3)]">+</span>
}

function getReplayPlayerName(replay: ReplayRecord, userId: string) {
  return replay.players.find((player) => player.userId === userId)?.username || userId
}

export default function ReplayPage() {
  const { matchId } = useParams<{ matchId: string }>()
  const navigate = useNavigate()
  const [replay, setReplay] = useState<ReplayRecord | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<'not-found' | 'deleted' | 'error' | null>(null)
  const [step, setStep] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [speed, setSpeed] = useState(1)

  useEffect(() => {
    if (!matchId) {
      navigate('/lobby')
      return
    }

    const loadReplay = async () => {
      try {
        setIsLoading(true)
        setLoadError(null)
        const result = await nakamaService.getReplay(matchId)
        setReplay(result)
      } catch (error) {
        const errorStr = String(error)
        logger.error({ matchId, error: errorStr }, 'Failed to load replay')
        setReplay(null)
        setLoadError(errorStr.includes('404') || errorStr.includes('not found') ? 'not-found' : 'error')
      } finally {
        setIsLoading(false)
      }
    }

    void loadReplay()
  }, [matchId, navigate])

  useEffect(() => {
    if (!isPlaying || !replay) return
    if (step >= replay.moves.length) {
      setIsPlaying(false)
      return
    }
    const timeoutMs = Math.max(250, Math.floor(900 / speed))
    const timer = window.setTimeout(() => {
      setStep((prev) => Math.min(prev + 1, replay.moves.length))
    }, timeoutMs)
    return () => window.clearTimeout(timer)
  }, [isPlaying, replay, speed, step])

  useEffect(() => {
    if (!replay) return

    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null
      const tagName = target?.tagName
      if (tagName === 'INPUT' || tagName === 'TEXTAREA' || tagName === 'SELECT') {
        return
      }

      if (event.key === 'ArrowRight') {
        event.preventDefault()
        setIsPlaying(false)
        setStep((current) => Math.min(current + 1, replay.moves.length))
      }

      if (event.key === 'ArrowLeft') {
        event.preventDefault()
        setIsPlaying(false)
        setStep((current) => Math.max(current - 1, 0))
      }

      if (event.code === 'Space') {
        event.preventDefault()
        setIsPlaying((current) => !current)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [replay])

  const board = useMemo(() => (replay ? buildBoard(replay, step) : Array(9).fill(null)), [replay, step])
  const currentMove = replay && step > 0 ? replay.moves[step - 1] : null
  const nextMove = replay && step < replay.moves.length ? replay.moves[step] : null

  if (isLoading) {
    return <StatusScreen title="Loading Replay" message="Fetching the recorded move timeline from the server." isLoading />
  }

  if (!replay) {
    return <ReplayNotFound matchId={matchId} reason={loadError ?? 'error'} />
  }

  return (
    <div className="min-h-screen px-4 py-6">
      <div className="stage-shell--narrow">
        <div className="mb-6">
          <ScreenHero
            tag="Replay"
            title="Move through the match frame by frame."
            description={`${replay.mode.replace(/_/g, ' ')} • ${Math.round(replay.durationMs / 1000)}s • ${replay.players.map((player) => player.username).join(' vs ')}`}
            dark
          />
        </div>

        <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
          <section className="premium-card p-6 md:p-8">
            <SectionHeader
              eyebrow="Board"
              title="Current state"
              action={<span className="premium-pill-light">Move {step}/{replay.moves.length}</span>}
            />

            <div className="premium-card-muted p-4 sm:p-6">
              <div className="grid grid-cols-3 gap-3">
                {board.map((cell, index) => (
                  <div
                    key={index}
                    className={[
                      'flex h-20 items-center justify-center rounded-[26px] border border-[rgba(107,122,140,0.12)] bg-white/70 shadow-[var(--shadow-chip)] sm:h-24',
                      currentMove?.positions.includes(index) ? 'board-cell-last-move' : '',
                    ].join(' ')}
                  >
                    {renderCellSymbol(cell)}
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-5 space-y-4">
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => {
                    setIsPlaying(false)
                    setStep((current) => Math.max(current - 1, 0))
                  }}
                  disabled={step === 0}
                  className="premium-btn premium-btn-secondary"
                >
                  Previous
                </button>
                <button onClick={() => setIsPlaying((value) => !value)} className="premium-btn premium-btn-primary">
                  {isPlaying ? 'Pause' : 'Play'}
                </button>
                <button
                  onClick={() => {
                    setIsPlaying(false)
                    setStep((current) => Math.min(current + 1, replay.moves.length))
                  }}
                  disabled={step === replay.moves.length}
                  className="premium-btn premium-btn-secondary"
                >
                  Next
                </button>
                <button
                  onClick={() => {
                    setIsPlaying(false)
                    setStep(0)
                  }}
                  className="premium-btn premium-btn-secondary"
                >
                  Reset
                </button>
                <select value={speed} onChange={(event) => setSpeed(Number(event.target.value))} className="premium-select max-w-[140px]">
                  <option value={0.5}>0.5x</option>
                  <option value={1}>1x</option>
                  <option value={2}>2x</option>
                </select>
              </div>

              <input
                type="range"
                min={0}
                max={replay.moves.length}
                value={step}
                onChange={(event) => {
                  setStep(Number(event.target.value))
                  setIsPlaying(false)
                }}
                className="w-full"
              />

              <div className="premium-keyline">
                <div className="premium-keyline-item">
                  <span className="premium-keycap">←</span>
                  <span>Previous move</span>
                </div>
                <div className="premium-keyline-item">
                  <span className="premium-keycap">→</span>
                  <span>Next move</span>
                </div>
                <div className="premium-keyline-item">
                  <span className="premium-keycap">Space</span>
                  <span>Play or pause</span>
                </div>
              </div>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <div className="premium-list-item">
                <div className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--ink-muted)]">Current move</div>
                <div className="mt-2 font-semibold text-[var(--ink)]">
                  {currentMove ? `${getReplayPlayerName(replay, currentMove.userId)} • ${currentMove.symbol}` : 'Opening board'}
                </div>
                <div className="mt-1 text-sm text-[var(--ink-soft)]">
                  {currentMove ? `${currentMove.type === 'quantum' ? 'Quantum' : 'Normal'} on cells ${currentMove.positions.map((position) => position + 1).join(', ')}` : 'No marks have been placed yet.'}
                </div>
              </div>
              <div className="premium-list-item">
                <div className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--ink-muted)]">Up next</div>
                <div className="mt-2 font-semibold text-[var(--ink)]">
                  {nextMove ? `${getReplayPlayerName(replay, nextMove.userId)} • ${nextMove.symbol}` : 'Replay complete'}
                </div>
                <div className="mt-1 text-sm text-[var(--ink-soft)]">
                  {nextMove ? `${nextMove.type === 'quantum' ? 'Quantum' : 'Normal'} on cells ${nextMove.positions.map((position) => position + 1).join(', ')}` : 'You are at the end of the recorded timeline.'}
                </div>
              </div>
            </div>
          </section>

          <section className="premium-card p-6 md:p-8">
            <SectionHeader
              eyebrow="Timeline"
              title="Every move"
              action={
                <button onClick={() => navigate('/analytics')} className="premium-btn premium-btn-secondary px-4 py-2">
                  Analytics
                </button>
              }
            />

            <div className="premium-list">
              {replay.moves.map((move, index) => (
                <button
                  key={`${move.timestamp}-${index}`}
                  onClick={() => {
                    setStep(index + 1)
                    setIsPlaying(false)
                  }}
                  className="premium-list-item w-full text-left"
                  style={{
                    borderColor: step === index + 1 ? 'rgba(74, 141, 255, 0.22)' : undefined,
                    background: step === index + 1 ? 'rgba(74, 141, 255, 0.08)' : undefined,
                  }}
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <div className="font-semibold text-[var(--ink)]">
                        #{index + 1} • {getReplayPlayerName(replay, move.userId)}
                      </div>
                      <div className="mt-1 text-sm text-[var(--ink-soft)]">
                        {move.type === 'quantum' ? 'Quantum move' : 'Normal move'} • cells {move.positions.map((position) => position + 1).join(', ')}
                      </div>
                    </div>
                    <span className="premium-badge">{move.symbol}</span>
                  </div>
                </button>
              ))}
            </div>
          </section>
        </div>

        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <button onClick={() => navigate('/lobby')} className="premium-btn premium-btn-secondary">
            Back to Lobby
          </button>
          <button onClick={() => navigate('/analytics')} className="premium-btn premium-btn-primary">
            Open Analytics
          </button>
        </div>
      </div>
    </div>
  )
}
