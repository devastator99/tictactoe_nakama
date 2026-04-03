import { motion } from 'framer-motion'
import LobbyPlayHub from './LobbyPlayHub'
import LobbyBoardBriefing from './LobbyBoardBriefing'
import LobbyCoachNotes from './LobbyCoachNotes'
import LobbyNotifications from './LobbyNotifications'
import LobbyQuickRoutes from './LobbyQuickRoutes'
import LobbySessionSettings from './LobbySessionSettings'
import LobbyLiveActivity from './LobbyLiveActivity'
import { ActivityEvent, AnalyticsData, GameMode, ReplayRecord } from '../../types'

interface LobbyMainGridProps {
  // Play Hub Props
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
  // Board Briefing Props
  analytics: AnalyticsData | null
  liveActivityCount: number
  replayCount: number
  // Live Activity Props
  activityItems: ActivityEvent[]
  hasQuery: boolean
  onClearQuery: () => void
  onNavigateReplay: (matchId: string) => void
  // Settings Props
  theme: 'cyberpunk' | 'retro' | 'minimal'
  onThemeChange: (value: 'cyberpunk' | 'retro' | 'minimal') => void
  soundEnabled: boolean
  onSoundChange: (value: boolean) => void
  hapticsEnabled: boolean
  onHapticsChange: (value: boolean) => void
  voiceEnabled: boolean
  onVoiceChange: (value: boolean) => void
  // Shared
  reduceMotion: boolean
  notifications: Array<{
    title: string
    body: string
    tone: 'warning' | 'accent' | 'success' | 'neutral'
    actionLabel: string
    onClick?: (() => void) | undefined
  }>
  onNavigateLeaderboard: () => void
  onNavigateAnalytics: () => void
  featuredReplay: ReplayRecord | null
}

function getRevealProps(index: number, reduceMotion: boolean) {
  if (reduceMotion) return {}
  return {
    initial: { opacity: 0, y: 20 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, amount: 0.18 },
    transition: { duration: 0.34, delay: index * 0.04 },
  }
}

export default function LobbyMainGrid({
  // Play Hub
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
  // Board Briefing
  analytics,
  liveActivityCount,
  replayCount,
  // Live Activity
  activityItems,
  hasQuery,
  onClearQuery,
  onNavigateReplay,
  // Settings
  theme,
  onThemeChange,
  soundEnabled,
  onSoundChange,
  hapticsEnabled,
  onHapticsChange,
  voiceEnabled,
  onVoiceChange,
  // Shared
  reduceMotion,
  notifications,
  onNavigateLeaderboard,
  onNavigateAnalytics,
  featuredReplay,
}: LobbyMainGridProps) {
  const revealProps = (index: number) => getRevealProps(index, reduceMotion)

  return (
    <div className="mt-6 grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
      {/* Left Column */}
      <div className="space-y-6">
        {/* Play Hub */}
        <motion.div {...revealProps(0)}>
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
        </motion.div>

        {/* Board Briefing */}
        {analytics && (
          <motion.div {...revealProps(1)}>
            <LobbyBoardBriefing
              analytics={analytics}
              liveActivityCount={liveActivityCount}
              replayCount={replayCount}
              reduceMotion={reduceMotion}
            />
          </motion.div>
        )}

        {/* Coach Notes */}
        <motion.div {...revealProps(2)}>
          <LobbyCoachNotes />
        </motion.div>
      </div>

      {/* Right Sidebar */}
      <div className="space-y-6">
        {/* Notifications */}
        <motion.div {...revealProps(3)}>
          <LobbyNotifications notifications={notifications} />
        </motion.div>

        {/* Quick Routes */}
        <motion.div {...revealProps(4)}>
          <LobbyQuickRoutes
            onNavigateLeaderboard={onNavigateLeaderboard}
            onNavigateAnalytics={onNavigateAnalytics}
            onNavigateReplay={onNavigateReplay}
            featuredReplay={featuredReplay}
          />
        </motion.div>

        {/* Session Settings */}
        <motion.div {...revealProps(5)}>
          <LobbySessionSettings
            theme={theme}
            onThemeChange={onThemeChange}
            soundEnabled={soundEnabled}
            onSoundChange={onSoundChange}
            hapticsEnabled={hapticsEnabled}
            onHapticsChange={onHapticsChange}
            voiceEnabled={voiceEnabled}
            onVoiceChange={onVoiceChange}
          />
        </motion.div>

        {/* Live Activity */}
        <motion.div {...revealProps(6)}>
          <LobbyLiveActivity
            activity={activityItems}
            hasQuery={hasQuery}
            onClearQuery={onClearQuery}
            onNavigateReplay={onNavigateReplay}
            onFindMatch={onFindMatch}
            reduceMotion={reduceMotion}
          />
        </motion.div>
      </div>
    </div>
  )
}
