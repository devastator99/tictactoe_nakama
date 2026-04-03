import { motion } from 'framer-motion'

interface PlayerSnapshotProps {
  onlineCount: number
  totalMatches: number
  topStreak: number
  onViewLeaderboard: () => void
}

export default function PlayerSnapshot({
  onlineCount,
  totalMatches,
  topStreak,
  onViewLeaderboard,
}: PlayerSnapshotProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="rounded-lg border border-cyan-900/20 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 p-4"
    >
      <div className="grid grid-cols-3 gap-4 text-center">
        {/* Online Count */}
        <div>
          <p className="text-2xl font-bold text-green-400">
            {onlineCount.toLocaleString()}
          </p>
          <p className="text-xs text-cyan-400/60">Online now</p>
        </div>

        {/* Total Matches */}
        <div>
          <p className="text-2xl font-bold text-cyan-300">
            {totalMatches.toLocaleString()}
          </p>
          <p className="text-xs text-cyan-400/60">Total played</p>
        </div>

        {/* Top Streak */}
        <div>
          <p className="text-2xl font-bold text-purple-400">
            {topStreak}
          </p>
          <p className="text-xs text-cyan-400/60">Best streak</p>
        </div>
      </div>

      <motion.button
        onClick={onViewLeaderboard}
        className="mt-4 w-full rounded-lg bg-cyan-500/20 px-4 py-2 text-sm font-semibold text-cyan-300 hover:bg-cyan-500/30"
        whileTap={{ scale: 0.97 }}
      >
        View all rankings
      </motion.button>
    </motion.div>
  )
}
