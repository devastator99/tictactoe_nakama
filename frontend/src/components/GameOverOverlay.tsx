import { motion } from 'framer-motion'
import BrandMark from './BrandMark'
import { PlayerInfo } from '../types'

interface GameOverOverlayProps {
  winner: string | null
  currentUserId?: string
  opponentName?: string
  onRematch: () => void
  onLeave: () => void
  rematchVotes?: Record<string, boolean>
  players: PlayerInfo[]
}

export default function GameOverOverlay({
  winner,
  currentUserId,
  opponentName,
  onRematch,
  onLeave,
  rematchVotes = {},
  players,
}: GameOverOverlayProps) {
  const isWinner = winner === currentUserId
  const isDraw = !winner
  const currentPlayerVoted = currentUserId ? rematchVotes[currentUserId] : false
  const opponentId = players.find((player) => player.userId !== currentUserId)?.userId
  const opponentVoted = opponentId ? rematchVotes[opponentId] : false

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(13,20,27,0.48)] px-4 backdrop-blur-md"
    >
      <motion.div
        initial={{ scale: 0.92, opacity: 0, y: 14 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        className="premium-card w-full max-w-md p-8"
      >
        <div className="mb-5 flex justify-center">
          <BrandMark size="sm" />
        </div>

        <div className="mb-7 text-center">
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.22em] text-[var(--ink-muted)]">Match Complete</p>
          <h2 className="font-[var(--font-display)] text-3xl font-bold tracking-[-0.05em] text-[var(--ink)]">
            {isDraw ? 'Draw game' : isWinner ? 'You won' : `${opponentName || 'Opponent'} won`}
          </h2>
          <p className="mt-3 text-sm leading-6 text-[var(--ink-soft)]">
            {isDraw ? 'Clean finish from both sides.' : isWinner ? 'Sharp work. Ready for another round?' : 'The board is reset whenever you are.'}
          </p>
        </div>

        <div className="mb-6 grid grid-cols-2 gap-3">
          <div className="premium-stat text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--ink-muted)]">You</p>
            <p className="mt-2 text-sm font-semibold text-[var(--ink)]">{currentPlayerVoted ? 'Rematch ready' : 'Waiting'}</p>
          </div>
          <div className="premium-stat text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--ink-muted)]">{opponentName || 'Opponent'}</p>
            <p className="mt-2 text-sm font-semibold text-[var(--ink)]">{opponentVoted ? 'Rematch ready' : 'Waiting'}</p>
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <button onClick={onLeave} className="premium-btn premium-btn-secondary flex-1">
            Leave
          </button>
          <button onClick={onRematch} disabled={Boolean(currentPlayerVoted)} className="premium-btn premium-btn-primary flex-1">
            {currentPlayerVoted ? 'Requested' : 'Rematch'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}
