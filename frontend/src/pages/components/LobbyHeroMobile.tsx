import { motion } from 'framer-motion'
import AnimatedCounter from './AnimatedCounter'

interface LobbyHeroMobileProps {
  displayName: string
  rating: number
  wins: number
  losses: number
  bestStreak: number
  isConnected: boolean
  onNavigateProfile?: () => void
}

export default function LobbyHeroMobile({
  displayName,
  rating,
  wins,
  losses,
  bestStreak,
  isConnected,
  onNavigateProfile,
}: LobbyHeroMobileProps) {
  const winRate = wins + losses > 0 ? ((wins / (wins + losses)) * 100).toFixed(1) : 'N/A'

  return (
    <motion.div
      initial={{ opacity: 0, y: -16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-4 rounded-xl border border-cyan-900/20 bg-gradient-to-br from-slate-950 to-slate-900 p-6"
    >
      {/* Player Identity */}
      <div className="space-y-3 text-center">
        <div className="flex justify-center">
          <div className="h-16 w-16 rounded-full bg-gradient-to-br from-cyan-500 to-blue-500 ring-2 ring-cyan-500/30" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-cyan-300">{displayName}</h1>
          <div className="flex items-center justify-center gap-2 text-sm">
            <span
              className={`inline-block h-2 w-2 rounded-full ${
                isConnected ? 'bg-green-500' : 'bg-red-500'
              }`}
            />
            <p className="text-cyan-500/60">
              {isConnected ? 'Online' : 'Offline'}
            </p>
          </div>
        </div>
      </div>

      {/* Rating Card */}
      <motion.div
        className="rounded-lg bg-gradient-to-r from-cyan-500/10 to-blue-500/10 p-4 text-center"
        whileHover={{ scale: 1.02 }}
      >
        <p className="text-xs uppercase tracking-widest text-cyan-400/60">
          Current Rating
        </p>
        <p className="mt-1 text-3xl font-bold text-cyan-300">
          <AnimatedCounter value={rating} suffix="" reduceMotion={false} />
        </p>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        {/* Wins */}
        <motion.div
          className="rounded-lg border border-cyan-500/20 bg-cyan-500/5 p-3 text-center"
          whileHover={{ scale: 1.02 }}
        >
          <p className="text-xs uppercase tracking-widest text-cyan-400/60">
            Wins
          </p>
          <p className="mt-1 text-2xl font-bold text-green-400">
            <AnimatedCounter value={wins} suffix="" reduceMotion={false} />
          </p>
        </motion.div>

        {/* Losses */}
        <motion.div
          className="rounded-lg border border-cyan-500/20 bg-cyan-500/5 p-3 text-center"
          whileHover={{ scale: 1.02 }}
        >
          <p className="text-xs uppercase tracking-widest text-cyan-400/60">
            Losses
          </p>
          <p className="mt-1 text-2xl font-bold text-red-400">
            <AnimatedCounter value={losses} suffix="" reduceMotion={false} />
          </p>
        </motion.div>

        {/* Win Rate */}
        <motion.div
          className="rounded-lg border border-cyan-500/20 bg-cyan-500/5 p-3 text-center"
          whileHover={{ scale: 1.02 }}
        >
          <p className="text-xs uppercase tracking-widest text-cyan-400/60">
            Win Rate
          </p>
          <p className="mt-1 text-xl font-bold text-cyan-300">{winRate}%</p>
        </motion.div>

        {/* Best Streak */}
        {bestStreak !== undefined && (
          <motion.div
            className="rounded-lg border border-cyan-500/20 bg-cyan-500/5 p-3 text-center"
            whileHover={{ scale: 1.02 }}
          >
            <p className="text-xs uppercase tracking-widest text-cyan-400/60">
              Best Streak
            </p>
            <p className="mt-1 text-xl font-bold text-purple-300">
              <AnimatedCounter value={bestStreak} suffix="" reduceMotion={false} />
            </p>
          </motion.div>
        )}
      </div>

      {/* Profile Button */}
      {onNavigateProfile && (
        <motion.button
          onClick={onNavigateProfile}
          className="w-full rounded-lg bg-gradient-to-r from-cyan-500/20 to-blue-500/20 px-4 py-2 font-semibold text-cyan-300 hover:from-cyan-500/30 hover:to-blue-500/30"
          whileTap={{ scale: 0.97 }}
        >
          View Full Profile
        </motion.button>
      )}
    </motion.div>
  )
}
