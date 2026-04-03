import { motion } from 'framer-motion'

interface FirstMatchOnboardingProps {
  playerName: string
  onStartQuickMatch: () => void
  onStartAiMatch: () => void
  isConnected: boolean
}

export default function FirstMatchOnboarding({
  playerName,
  onStartQuickMatch,
  onStartAiMatch,
  isConnected,
}: FirstMatchOnboardingProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="rounded-xl border border-cyan-900/30 bg-gradient-to-br from-slate-900 via-cyan-900/20 to-slate-900 p-8 text-center"
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.1, duration: 0.3 }}
        className="mb-6"
      >
        <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center">
          <span className="text-2xl">🎯</span>
        </div>
      </motion.div>

      <h2 className="mb-2 text-2xl font-bold text-cyan-300">
        Welcome, {playerName}!
      </h2>
      <p className="mb-6 text-cyan-500/60">
        Your rating journey starts now. Pick a match type to get your first win recorded.
      </p>

      <div className="space-y-3">
        {/* Quick Match Button */}
        <motion.button
          onClick={onStartQuickMatch}
          disabled={!isConnected}
          className={`w-full rounded-lg px-6 py-4 font-bold transition-all ${
            isConnected
              ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white hover:from-cyan-400 hover:to-blue-400'
              : 'bg-slate-700 text-slate-500'
          }`}
          whileHover={isConnected ? { scale: 1.02 } : {}}
          whileTap={isConnected ? { scale: 0.98 } : {}}
        >
          ⚡ Play Quick Match
          <p className="text-xs font-normal text-cyan-100/60 mt-1">
            Ranked against real players
          </p>
        </motion.button>

        {/* AI Match Button */}
        <motion.button
          onClick={onStartAiMatch}
          disabled={!isConnected}
          className={`w-full rounded-lg px-6 py-4 font-bold transition-all ${
            isConnected
              ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white hover:from-orange-400 hover:to-red-400'
              : 'bg-slate-700 text-slate-500'
          }`}
          whileHover={isConnected ? { scale: 1.02 } : {}}
          whileTap={isConnected ? { scale: 0.98 } : {}}
        >
          🤖 Practice with AI
          <p className="text-xs font-normal text-orange-100/60 mt-1">
            No rating impact, build confidence
          </p>
        </motion.button>
      </div>

      {!isConnected && (
        <p className="mt-4 text-sm text-red-400">
          ⚠️ Reconnecting to server...
        </p>
      )}

      <p className="mt-6 text-xs text-cyan-500/40">
        Tip: Start with AI if you're new to the game!
      </p>
    </motion.div>
  )
}
