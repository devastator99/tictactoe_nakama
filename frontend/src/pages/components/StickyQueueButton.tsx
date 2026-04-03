import { motion, AnimatePresence } from 'framer-motion'

interface StickyQueueButtonProps {
  isVisible: boolean
  isFindingMatch: boolean
  isConnected: boolean
  elapsedSeconds: number
  selectedMode: string
  onFindMatch: () => void
  onCancel: () => void
}

export default function StickyQueueButton({
  isVisible,
  isFindingMatch,
  isConnected,
  elapsedSeconds,
  selectedMode,
  onFindMatch,
  onCancel,
}: StickyQueueButtonProps) {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed bottom-0 left-0 right-0 border-t border-cyan-900/30 bg-gradient-to-t from-slate-950 to-slate-900 p-4 safe-area-padding-bottom md:hidden"
        >
          {isFindingMatch ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between rounded-lg bg-cyan-500/20 p-3">
                <div>
                  <p className="text-xs text-cyan-400/60">Searching...</p>
                  <p className="text-sm font-semibold text-cyan-300">
                    {elapsedSeconds}s{' '}
                    <span className="text-xs text-cyan-400/60">
                      {selectedMode.replace(/vs_ai_/g, 'AI ').replace(/_/g, ' ')}
                    </span>
                  </p>
                </div>
                <div className="flex gap-2">
                  <span className="inline-block h-2 w-2 rounded-full bg-cyan-400 animate-pulse" />
                  <span
                    className="inline-block h-2 w-2 rounded-full bg-cyan-400 animate-pulse"
                    style={{ animationDelay: '0.2s' }}
                  />
                  <span
                    className="inline-block h-2 w-2 rounded-full bg-cyan-400 animate-pulse"
                    style={{ animationDelay: '0.4s' }}
                  />
                </div>
              </div>
              <motion.button
                onClick={onCancel}
                className="w-full rounded-lg bg-red-600 px-4 py-3 font-bold text-white hover:bg-red-700"
                whileTap={{ scale: 0.97 }}
              >
                Cancel Match
              </motion.button>
            </div>
          ) : (
            <motion.button
              onClick={onFindMatch}
              disabled={!isConnected}
              className={`w-full rounded-lg px-6 py-4 font-bold transition-all ${
                isConnected
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white hover:from-cyan-400 hover:to-blue-400 shadow-lg shadow-cyan-500/50'
                  : 'bg-slate-700 text-slate-500'
              }`}
              whileTap={isConnected ? { scale: 0.97 } : {}}
            >
              🎮 Find Match Now
            </motion.button>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
