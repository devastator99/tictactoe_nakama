import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'

interface ReplayNotFoundProps {
  matchId?: string
  reason?: 'not-found' | 'deleted' | 'error'
}

const reasonMessages: Record<string, { title: string; body: string; icon: string; tone: string }> = {
  'not-found': {
    title: 'Replay not found',
    body: 'The match you are looking for does not exist in our database. Check the match ID and try again.',
    icon: '⚙️',
    tone: 'neutral',
  },
  deleted: {
    title: 'Replay deleted',
    body: 'This match replay was archived or removed. Recent matches are available in the replay browser.',
    icon: '🗑️',
    tone: 'warm',
  },
  error: {
    title: 'Failed to load replay',
    body: 'Something went wrong while loading the match data. Try refreshing or come back later.',
    icon: '⚠️',
    tone: 'error',
  },
}

export default function ReplayNotFound({ matchId, reason = 'not-found' }: ReplayNotFoundProps) {
  const navigate = useNavigate()
  const message = reasonMessages[reason] ?? reasonMessages['not-found']

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-[var(--bg)] to-[var(--bg-secondary)] p-4">
      <motion.div
        className="w-full max-w-md text-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        {/* Icon */}
        <div className="mb-6 text-6xl" aria-hidden>
          {message.icon}
        </div>

        {/* Title */}
        <h1 className="font-[var(--font-display)] text-3xl font-bold tracking-[-0.04em] text-[var(--ink)] sm:text-4xl">
          {message.title}
        </h1>

        {/* Body */}
        <p className="mt-4 text-base leading-7 text-[var(--ink-soft)]">{message.body}</p>

        {/* Match ID if provided */}
        {matchId && (
          <div className="mt-6 rounded-lg bg-[var(--bg-secondary)] p-3 font-mono text-sm text-[var(--ink-soft)]">
            Match ID: <span className="text-[var(--ink)]">{matchId}</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <button
            onClick={() => navigate('/replay')}
            className="premium-btn premium-btn-primary flex-1 sm:flex-initial"
          >
            Browse replays
          </button>
          <button
            onClick={() => navigate('/lobby')}
            className="premium-btn premium-btn-secondary flex-1 sm:flex-initial"
          >
            Back to lobby
          </button>
        </div>

        {/* Help text */}
        <p className="mt-6 text-xs text-[var(--ink-softer)]">
          Replays are stored for 30 days after match completion.
        </p>
      </motion.div>
    </div>
  )
}
