import { motion } from 'framer-motion'
import { GamePhase, PlayerInfo } from '../types'

interface PlayerCardProps {
  player?: PlayerInfo
  isCurrentTurn: boolean
  isWinner: boolean
  gamePhase: GamePhase
}

function getStatus(player: PlayerInfo, isCurrentTurn: boolean, isWinner: boolean, gamePhase: GamePhase) {
  if (!player.connected) return { label: 'Disconnected', tone: 'text-[var(--danger)]' }
  if (isWinner) return { label: 'Winner', tone: 'text-[var(--success)]' }
  if (gamePhase === 'game_over') return { label: 'Finished', tone: 'text-[var(--ink-muted)]' }
  if (gamePhase === 'lobby') return { label: 'Ready', tone: 'text-[var(--warning)]' }
  if (isCurrentTurn) return { label: 'Turn live', tone: 'text-[var(--x)]' }
  return { label: 'Waiting', tone: 'text-[var(--ink-muted)]' }
}

export default function PlayerCard({ player, isCurrentTurn, isWinner, gamePhase }: PlayerCardProps) {
  if (!player) {
    return (
      <div className="premium-card-muted p-5 md:p-6">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-[22px] bg-[rgba(255,255,255,0.7)] text-2xl font-bold text-[var(--ink-muted)] shadow-[var(--shadow-chip)]">
            ?
          </div>
          <div>
            <p className="font-[var(--font-display)] text-lg font-bold text-[var(--ink)]">Awaiting Opponent</p>
            <p className="text-sm text-[var(--ink-soft)]">The match is reserved and ready for the second player.</p>
          </div>
        </div>
      </div>
    )
  }

  const status = getStatus(player, isCurrentTurn, isWinner, gamePhase)
  const symbolTone = player.symbol === 'X' ? 'var(--x)' : 'var(--o)'
  const symbolBackground = player.symbol === 'X' ? 'rgba(74,141,255,0.12)' : 'rgba(255,154,61,0.14)'

  return (
    <motion.div
      className="premium-card-muted p-5 md:p-6"
      animate={isCurrentTurn && gamePhase === 'playing' ? { y: -3 } : { y: 0 }}
      transition={{ duration: 0.2 }}
      style={{
        borderColor: isWinner
          ? 'rgba(51,179,124,0.24)'
          : isCurrentTurn && gamePhase === 'playing'
          ? 'rgba(74,141,255,0.28)'
          : undefined,
      }}
    >
      <div className="flex items-center gap-4">
        <div
          className="flex h-16 w-16 items-center justify-center rounded-[22px] border text-3xl font-[var(--font-display)] font-bold shadow-[var(--shadow-chip)]"
          style={{
            color: symbolTone,
            background: symbolBackground,
            borderColor: player.symbol === 'X' ? 'rgba(74,141,255,0.2)' : 'rgba(255,154,61,0.2)',
          }}
        >
          {player.symbol}
        </div>

        <div className="min-w-0 flex-1">
          <div className="mb-1 flex flex-wrap items-center gap-2">
            <h3 className="truncate font-[var(--font-display)] text-xl font-bold tracking-[-0.04em] text-[var(--ink)]">
              {player.username}
            </h3>
            {isCurrentTurn && gamePhase === 'playing' && (
              <span className="premium-badge" style={{ color: 'var(--x)' }}>
                Turn
              </span>
            )}
          </div>
          <p className={`text-sm font-semibold ${status.tone}`}>{status.label}</p>
        </div>
      </div>
    </motion.div>
  )
}
