import { motion } from 'framer-motion'
import LobbyPlayHub from './LobbyPlayHub'
import LobbyPlayHubMobile from './LobbyPlayHubMobile'
import { GameMode } from '../../types'

interface PlayHubSectionProps {
  // State
  activeSurface: 'quick' | 'ai' | 'private'
  selectedMode: GameMode
  isFindingMatch: boolean
  isCreatingPrivate: boolean
  isJoiningPrivate: boolean
  isConnected: boolean
  privateCode: string
  elapsedSearchSeconds: number
  isMobile: boolean
  reduceMotion: boolean
  
  // Handlers
  onSurfaceChange: (surface: 'quick' | 'ai' | 'private') => void
  onModeChange: (mode: GameMode) => void
  onFindMatch: () => void
  onCancelMatchmaking: () => void
  onPrivateCodeChange: (code: string) => void
  onCreatePrivate: (mode?: GameMode) => void
  onJoinPrivate: () => void
}

function getRevealProps(reduceMotion: boolean) {
  if (reduceMotion) return {}
  return {
    initial: { opacity: 0, y: 20 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, amount: 0.3 },
    transition: { duration: 0.34 },
  }
}

export default function PlayHubSection({
  activeSurface,
  selectedMode,
  isFindingMatch,
  isCreatingPrivate,
  isJoiningPrivate,
  isConnected,
  privateCode,
  elapsedSearchSeconds,
  isMobile,
  reduceMotion,
  onSurfaceChange,
  onModeChange,
  onFindMatch,
  onCancelMatchmaking,
  onPrivateCodeChange,
  onCreatePrivate,
  onJoinPrivate,
}: PlayHubSectionProps) {
  return (
    <motion.section {...getRevealProps(reduceMotion)} className="mt-6">
      {isMobile ? (
        <LobbyPlayHubMobile
          activeSurface={activeSurface}
          onSurfaceChange={onSurfaceChange}
          selectedMode={selectedMode}
          onModeChange={onModeChange}
          isFindingMatch={isFindingMatch}
          isCreatingPrivate={isCreatingPrivate}
          isJoiningPrivate={isJoiningPrivate}
          isConnected={isConnected}
          privateCode={privateCode}
          onPrivateCodeChange={onPrivateCodeChange}
          elapsedSearchSeconds={elapsedSearchSeconds}
          onFindMatch={onFindMatch}
          onCancelMatchmaking={onCancelMatchmaking}
          onCreatePrivate={onCreatePrivate}
          onJoinPrivate={onJoinPrivate}
        />
      ) : (
        <div className="rounded-xl border border-cyan-900/20 bg-gradient-to-br from-slate-950 to-slate-900 p-6">
          <h3 className="mb-4 text-sm font-bold uppercase tracking-widest text-cyan-400">
            🎮 Play Options
          </h3>
          <LobbyPlayHub
            activeSurface={activeSurface}
            onSurfaceChange={onSurfaceChange}
            selectedMode={selectedMode}
            onModeChange={onModeChange}
            isFindingMatch={isFindingMatch}
            isCreatingPrivate={isCreatingPrivate}
            isJoiningPrivate={isJoiningPrivate}
            isConnected={isConnected}
            privateCode={privateCode}
            onPrivateCodeChange={onPrivateCodeChange}
            elapsedSearchSeconds={elapsedSearchSeconds}
            onFindMatch={onFindMatch}
            onCancelMatchmaking={onCancelMatchmaking}
            onCreatePrivate={onCreatePrivate}
            onJoinPrivate={onJoinPrivate}
          />
        </div>
      )}
    </motion.section>
  )
}
