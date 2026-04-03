import { motion } from 'framer-motion'
import { GameMode } from '../../types'

interface LobbyPlayHubMobileProps {
  activeSurface: 'quick' | 'ai' | 'private'
  onSurfaceChange: (surface: 'quick' | 'ai' | 'private') => void
  selectedMode: GameMode
  onModeChange: (mode: GameMode) => void
  isFindingMatch: boolean
  isCreatingPrivate: boolean
  isJoiningPrivate: boolean
  isConnected: boolean
  privateCode: string
  onPrivateCodeChange: (code: string) => void
  elapsedSearchSeconds: number
  onFindMatch: () => void
  onCancelMatchmaking: () => void
  onCreatePrivate: (mode?: GameMode) => void
  onJoinPrivate: () => void
}

const GAME_MODES: GameMode[] = ['classic', 'timed']
const AI_MODES: GameMode[] = ['vs_ai_easy', 'vs_ai_medium', 'vs_ai_hard']

function formatModeLabel(mode: GameMode) {
  return mode.replace(/vs_ai_/g, 'AI ').replace(/_/g, ' ')
}

export default function LobbyPlayHubMobile({
  activeSurface,
  onSurfaceChange,
  selectedMode,
  onModeChange,
  isFindingMatch,
  isCreatingPrivate,
  isJoiningPrivate,
  isConnected,
  privateCode,
  onPrivateCodeChange,
  elapsedSearchSeconds,
  onFindMatch,
  onCancelMatchmaking,
  onCreatePrivate,
  onJoinPrivate,
}: LobbyPlayHubMobileProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.3 }}
      className="space-y-4 rounded-xl border border-cyan-900/20 bg-gradient-to-br from-slate-950 to-slate-900 p-4"
    >
      {/* Surface Selector - Full Width Stack */}
      <div className="space-y-2">
        <p className="text-xs font-medium uppercase tracking-widest text-cyan-400/60">
          Play Mode
        </p>
        <div className="space-y-2">
          {(['quick', 'ai', 'private'] as const).map((surface) => (
            <motion.button
              key={surface}
              onClick={() => onSurfaceChange(surface)}
              className={`w-full rounded-lg px-4 py-4 font-bold transition-all text-base ${
                activeSurface === surface
                  ? 'bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/50'
                  : 'border border-cyan-500/30 bg-transparent text-cyan-400 hover:border-cyan-500/60 hover:bg-cyan-500/10'
              }`}
              whileTap={{ scale: 0.97 }}
            >
              {surface === 'quick' && '⚡ Quick Match'}
              {surface === 'ai' && '🤖 AI Practice'}
              {surface === 'private' && '🔒 Private Room'}
            </motion.button>
          ))}
        </div>
      </div>

      {/* Mode Selector */}
      <div className="space-y-2 border-t border-cyan-900/20 pt-4">
        <p className="text-xs font-medium uppercase tracking-widest text-cyan-400/60">
          Game Mode
        </p>
        <div className="space-y-2">
          {(activeSurface === 'quick' ? GAME_MODES : AI_MODES).map((mode) => (
            <motion.button
              key={mode}
              onClick={() => onModeChange(mode)}
              className={`w-full rounded-lg px-4 py-3 font-semibold transition-all ${
                selectedMode === mode
                  ? 'bg-cyan-500 text-slate-950'
                  : 'border border-cyan-500/30 bg-transparent text-cyan-400 hover:border-cyan-500/60'
              }`}
              whileTap={{ scale: 0.97 }}
            >
              {formatModeLabel(mode)}
            </motion.button>
          ))}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="space-y-2 border-t border-cyan-900/20 pt-4">
        {activeSurface === 'quick' && (
          <motion.button
            onClick={isFindingMatch ? onCancelMatchmaking : onFindMatch}
            disabled={!isConnected}
            className={`w-full rounded-lg px-6 py-4 font-bold text-base transition-all ${
              isFindingMatch
                ? 'bg-red-600 hover:bg-red-700'
                : 'bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 shadow-lg shadow-cyan-500/30'
            } text-white disabled:opacity-50`}
            whileTap={{ scale: 0.97 }}
          >
            {isFindingMatch ? `Searching... ${elapsedSearchSeconds}s` : '⚡ Find Match Now'}
          </motion.button>
        )}

        {activeSurface === 'private' && (
          <>
            <input
              type="text"
              value={privateCode}
              onChange={(e) => onPrivateCodeChange(e.target.value)}
              placeholder="Game Code"
              className="w-full rounded-lg border border-cyan-500/30 bg-slate-950 px-4 py-3 text-white placeholder-cyan-500/40 focus:border-cyan-500 focus:outline-none"
            />
            <div className="grid grid-cols-2 gap-2">
              <motion.button
                onClick={() => onCreatePrivate(selectedMode)}
                disabled={isCreatingPrivate || !isConnected}
                className="rounded-lg bg-gradient-to-r from-cyan-500 to-blue-500 px-4 py-3 font-bold text-white hover:from-cyan-400 hover:to-blue-400 disabled:opacity-50"
                whileTap={{ scale: 0.97 }}
              >
                Create
              </motion.button>
              <motion.button
                onClick={onJoinPrivate}
                disabled={isJoiningPrivate || !privateCode || !isConnected}
                className="rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 px-4 py-3 font-bold text-white hover:from-purple-500 hover:to-pink-500 disabled:opacity-50"
                whileTap={{ scale: 0.97 }}
              >
                Join
              </motion.button>
            </div>
          </>
        )}

        {activeSurface === 'ai' && (
          <motion.button
            onClick={() => onCreatePrivate(selectedMode)}
            className="w-full rounded-lg bg-gradient-to-r from-orange-500 to-red-500 px-6 py-4 font-bold text-white hover:from-orange-400 hover:to-red-400"
            whileTap={{ scale: 0.97 }}
          >
            🤖 Challenge AI
          </motion.button>
        )}
      </div>
    </motion.div>
  )
}
