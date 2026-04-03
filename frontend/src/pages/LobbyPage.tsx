import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, useReducedMotion } from 'framer-motion'
import toast from 'react-hot-toast'
import { useAuthStore, useLeaderboardStore, useMetaStore } from '../context/store'
import { useNakama } from '../hooks/useNakama'
import { usePreferences } from '../hooks/usePreferences'
import { nakamaService } from '../services/nakama.service'
import { GameMode } from '../types'
import { getErrorMessage } from '../lib/client-utils'
import { playUiTone, triggerHaptic } from '../lib/feedback'
import { logger } from '../lib/logger'
// Component imports
import LobbyHero from './components/LobbyHero'
import LobbyDiscovery from './components/LobbyDiscovery'
import LobbyMainGrid from './components/LobbyMainGrid'
import LobbyFooter from './components/LobbyFooter'
// Mobile variants
import LobbyHeroMobile from './components/LobbyHeroMobile'
import LobbyDiscoveryMobile from './components/LobbyDiscoveryMobile'
// New components
import PlayerSnapshot from './components/PlayerSnapshot'
import FirstMatchOnboarding from './components/FirstMatchOnboarding'
import StickyQueueButton from './components/StickyQueueButton'
import PlayHubSection from './components/PlayHubSection'

// Types
type PlaySurface = 'quick' | 'ai' | 'private'

// Utility functions
function matchesQuery(query: string, values: Array<string | number | null | undefined>) {
  if (!query) return true
  return values.some((value) => String(value ?? '').toLowerCase().includes(query))
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

export default function LobbyPage() {
  // State management
  const [activeSurface, setActiveSurface] = useState<PlaySurface>('quick')
  const [selectedMode, setSelectedMode] = useState<GameMode>('classic')
  const [isFindingMatch, setIsFindingMatch] = useState(false)
  const [matchmakingTicket, setMatchmakingTicket] = useState<string | null>(null)
  const [elapsedSearchSeconds] = useState(0)
  const [privateCode, setPrivateCode] = useState('')
  const [isCreatingPrivate, setIsCreatingPrivate] = useState(false)
  const [isJoiningPrivate, setIsJoiningPrivate] = useState(false)
  const [isDashboardLoading, setIsDashboardLoading] = useState(true)
  const [lobbyQuery, setLobbyQuery] = useState('')
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1024)

  // Hooks
  const navigate = useNavigate()
  const shouldReduceMotion = useReducedMotion()
  const reduceMotion = Boolean(shouldReduceMotion)

  // Store
  const { user } = useAuthStore()
  const { entries, playerStats, setEntries, setPlayerStats } = useLeaderboardStore()
  const { liveActivity, replays, analytics, setLiveActivity, setReplays, setAnalytics } = useMetaStore()
  const {
    connect,
    findMatch,
    cancelMatchmaking,
    createPrivateMatch,
    joinPrivateMatch,
    onMatchmakerMatched,
    isConnected,
  } = useNakama()
  const {
    theme,
    setTheme,
    soundEnabled,
    setSoundEnabled,
    hapticsEnabled,
    setHapticsEnabled,
    voiceEnabled,
    setVoiceEnabled,
  } = usePreferences()

  // Memoized values
  const isMobile = windowWidth < 768
  const featuredReplay = replays[0] ?? null
  const featuredEvent = liveActivity[0] ?? null

  const filteredActivity = liveActivity.filter((event) =>
    matchesQuery(lobbyQuery.toLowerCase(), [event.message, event.mode, new Date(event.at).toLocaleTimeString()]),
  )

  const filteredReplays = replays.filter((replay) =>
    matchesQuery(
      lobbyQuery.toLowerCase(),
      [replay.mode, replay.players.map((player) => player.username).join(' '), Math.round(replay.durationMs / 1000)],
    ),
  )

  const filteredEntries = entries.filter((entry) =>
    matchesQuery(lobbyQuery.toLowerCase(), [entry.username, entry.rank, entry.totalGames, entry.wins]),
  )

  const buildNotifications = () => {
    return [
      !isConnected
        ? {
            title: 'Connection interrupted',
            body: 'Reconnect to keep lobby activity and quick queue actions live.',
            tone: 'warning' as const,
            actionLabel: 'Stay alert',
            onClick: undefined,
          }
        : null,
      isFindingMatch
        ? {
            title: `Searching ${selectedMode.replace(/vs_ai_/g, 'AI ').replace(/_/g, ' ')}`,
            body: `${elapsedSearchSeconds}s elapsed. The next available board will open automatically when the queue resolves.`,
            tone: 'accent' as const,
            actionLabel: 'Live queue',
            onClick: () => void handleCancelMatchmaking(),
          }
        : null,
      featuredEvent
        ? {
            title: 'Live pulse',
            body: featuredEvent.message,
            tone: 'success' as const,
            actionLabel: 'Open replay',
            onClick: featuredEvent.matchId ? () => navigate(`/replay/${featuredEvent.matchId}`) : undefined,
          }
        : null,
      featuredReplay
        ? {
            title: 'Replay ready',
            body: `${featuredReplay.players.map((player) => player.username).join(' vs ')} • ${featuredReplay.mode
              .replace(/vs_ai_/g, 'AI ')
              .replace(/_/g, ' ')}`,
            tone: 'accent' as const,
            actionLabel: 'Watch',
            onClick: () => navigate(`/replay/${featuredReplay.matchId}`),
          }
        : null,
      analytics
        ? {
            title: 'Board traffic',
            body: `${analytics.activeMatches} active matches and ${analytics.totalMatches} total sessions tracked right now.`,
            tone: 'neutral' as const,
            actionLabel: 'Analytics',
            onClick: () => navigate('/analytics'),
          }
        : null,
      playerStats && playerStats.totalGames === 0
        ? {
            title: 'First match ready',
            body: 'Your personal stats board is waiting for its first ranked result.',
            tone: 'success' as const,
            actionLabel: 'Queue up',
            onClick: () => setActiveSurface('quick'),
          }
        : null,
    ]
      .filter(Boolean)
      .slice(0, 4) as Array<{
      title: string
      body: string
      tone: 'warning' | 'accent' | 'success' | 'neutral'
      actionLabel: string
      onClick?: (() => void) | undefined
    }>
  }

  // Effects
  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    const loadLobbyData = async () => {
      try {
        setIsDashboardLoading(true)
        const [leaderboard, activity, recentReplays, stats, analyticsData] = await Promise.all([
          nakamaService.getLeaderboard(10),
          nakamaService.getLiveActivity(8),
          nakamaService.getRecentReplays(6),
          nakamaService.getPlayerStats(user?.userId),
          nakamaService.getAnalytics(),
        ])

        setEntries(leaderboard)
        setLiveActivity(activity)
        setReplays(recentReplays)
        setPlayerStats(stats)
        setAnalytics(analyticsData)
      } catch (error) {
        logger.error({ error: String(error) }, 'Failed to load lobby data')
        toast.error(getErrorMessage(error, 'Failed to load lobby data'))
      } finally {
        setIsDashboardLoading(false)
      }
    }

    void loadLobbyData()

    const pollId = window.setInterval(() => {
      void nakamaService
        .getLiveActivity(8)
        .then((items) => {
          setLiveActivity(items)
        })
        .catch(() => {
          // best effort polling
        })
    }, 5000)

    return () => {
      window.clearInterval(pollId)
    }
  }, [setAnalytics, setEntries, setLiveActivity, setPlayerStats, setReplays, user?.userId])

  useEffect(() => {
    if (!isConnected) {
      connect().catch((err) => logger.error({ error: String(err) }, 'Failed to connect to server'))
    }
  }, [connect, isConnected])

  useEffect(() => {
    const handleMatched = (matchId: string) => {
      setIsFindingMatch(false)
      setMatchmakingTicket(null)
      toast.success('Match found!')
      playUiTone('success', soundEnabled)
      triggerHaptic([25, 30, 25], hapticsEnabled)
      navigate(`/game/${matchId}`)
    }

    onMatchmakerMatched(handleMatched)
  }, [navigate, onMatchmakerMatched, soundEnabled, hapticsEnabled])

  // Event handlers
  const handleFindMatch = async () => {
    if (!isConnected) {
      toast.error('Not connected to server')
      return
    }

    setActiveSurface('quick')
    setIsFindingMatch(true)
    setMatchmakingTicket(null)

    try {
      const result = await findMatch(selectedMode)
      if (result.shadowBanned) {
        toast('Competitive matchmaking unavailable. Starting AI challenge mode.')
      }

      if (result.direct && result.matchId) {
        setIsFindingMatch(false)
        playUiTone('success', soundEnabled)
        triggerHaptic(20, hapticsEnabled)
        navigate(`/game/${result.matchId}`)
        return
      }

      setMatchmakingTicket(result.ticket || null)
      const modeLabel = selectedMode.replace(/vs_ai_/g, 'AI ').replace(/_/g, ' ')
      toast.success(`Searching ${modeLabel} queue...`)
    } catch {
      setIsFindingMatch(false)
      setMatchmakingTicket(null)
      playUiTone('error', soundEnabled)
    }
  }

  const handleCancelMatchmaking = async () => {
    try {
      if (matchmakingTicket) {
        await cancelMatchmaking(matchmakingTicket)
      }
      setIsFindingMatch(false)
      setMatchmakingTicket(null)
      toast('Matchmaking canceled')
    } catch {
      playUiTone('error', soundEnabled)
    }
  }

  const handleCreatePrivate = async (overrideMode?: GameMode | unknown) => {
    if (!isConnected) {
      toast.error('Not connected to server')
      return
    }

    setIsCreatingPrivate(true)
    setActiveSurface(typeof overrideMode === 'string' && overrideMode.startsWith('vs_ai') ? 'ai' : 'private')
    try {
      const mode = typeof overrideMode === 'string' ? (overrideMode as GameMode) : selectedMode
      const result = await createPrivateMatch(mode)
      if (!mode.startsWith('vs_ai') && result.code) {
        toast.success(`Room created! Code: ${result.code}`)
      }
      playUiTone('click', soundEnabled)
      triggerHaptic(15, hapticsEnabled)
      navigate(`/game/${result.matchId}`)
    } catch {
      setIsCreatingPrivate(false)
      playUiTone('error', soundEnabled)
    }
  }

  const handleJoinPrivate = async () => {
    if (!privateCode.trim()) {
      toast.error('Please enter a room code')
      return
    }

    if (!isConnected) {
      toast.error('Not connected to server')
      return
    }

    setIsJoiningPrivate(true)
    setActiveSurface('private')
    try {
      const matchId = await joinPrivateMatch(privateCode.trim().toUpperCase())
      toast.success('Joined room!')
      playUiTone('success', soundEnabled)
      navigate(`/game/${matchId}`)
    } catch {
      setIsJoiningPrivate(false)
      playUiTone('error', soundEnabled)
    }
  }

  // Render
  const builtNotifications = buildNotifications()
  const isFirstMatch = playerStats && playerStats.totalGames === 0
  const topStreakAcrossLeaderboard = Math.max(...entries.map((e) => e.winStreak || 0), 0)
  const totalOnlineCount = entries.length * 2 // Approximate online players

  return (
    <div className="min-h-screen px-4 py-6 pb-32 md:pb-6">
      {/* Hero Section - Desktop & Mobile */}
      <motion.div {...getRevealProps(0, reduceMotion)}>
        {isFirstMatch ? (
          <FirstMatchOnboarding
            playerName={user?.username || 'Player'}
            onStartQuickMatch={() => {
              setActiveSurface('quick')
              handleFindMatch()
            }}
            onStartAiMatch={() => {
              setActiveSurface('ai')
              handleCreatePrivate('vs_ai_easy')
            }}
            isConnected={isConnected}
          />
        ) : isMobile && playerStats ? (
          <LobbyHeroMobile
            displayName={user?.username || ''}
            rating={playerStats.rating || 0}
            wins={playerStats.wins || 0}
            losses={playerStats.losses || 0}
            bestStreak={playerStats.bestStreak || 0}
            isConnected={isConnected}
            onNavigateProfile={() => navigate('/analytics')}
          />
        ) : (
          <LobbyHero
            username={user?.username || ''}
            isConnected={isConnected}
            playerStats={playerStats}
            analytics={analytics}
            onViewLeaderboard={() => navigate('/leaderboard')}
            onOpenAnalytics={() => navigate('/analytics')}
          />
        )}
      </motion.div>

      {/* Player Snapshot - Social Proof */}
      {!isFirstMatch && (
        <motion.div {...getRevealProps(1, reduceMotion)} className="mt-4">
          <PlayerSnapshot
            onlineCount={totalOnlineCount}
            totalMatches={playerStats?.totalGames || 0}
            topStreak={topStreakAcrossLeaderboard}
            onViewLeaderboard={() => navigate('/leaderboard')}
          />
        </motion.div>
      )}

      {/* Play Hub - Moved Earlier */}
      {!isFirstMatch && (
        <PlayHubSection
          activeSurface={activeSurface}
          selectedMode={selectedMode}
          isFindingMatch={isFindingMatch}
          isCreatingPrivate={isCreatingPrivate}
          isJoiningPrivate={isJoiningPrivate}
          isConnected={isConnected}
          privateCode={privateCode}
          elapsedSearchSeconds={elapsedSearchSeconds}
          isMobile={isMobile}
          reduceMotion={reduceMotion}
          onSurfaceChange={setActiveSurface}
          onModeChange={setSelectedMode}
          onFindMatch={handleFindMatch}
          onCancelMatchmaking={handleCancelMatchmaking}
          onPrivateCodeChange={setPrivateCode}
          onCreatePrivate={handleCreatePrivate}
          onJoinPrivate={handleJoinPrivate}
        />
      )}

      {/* Discovery Section - Desktop & Mobile */}
      <motion.div {...getRevealProps(3, reduceMotion)} className="mt-6">
        {isMobile ? (
          <LobbyDiscoveryMobile
            onSearch={(query) => setLobbyQuery(query)}
            recentSearches={filteredEntries.map((e) => e.username).slice(0, 4)}
            onSelectRecent={(name) => setLobbyQuery(name)}
            trendingPlayers={filteredEntries.slice(0, 5).map((e) => ({
              name: e.username,
              rating: e.elo || 0,
            }))}
            onSelectPlayer={(name) => setLobbyQuery(name)}
          />
        ) : (
          <LobbyDiscovery
            query={lobbyQuery}
            onQueryChange={setLobbyQuery}
            onFilterChange={() => {}}
            selectedFilter="all"
            activityCount={filteredActivity.length}
            replayCount={filteredReplays.length}
            playerCount={filteredEntries.length}
            reduceMotion={reduceMotion}
          />
        )}
      </motion.div>

      {/* Main Content Grid - Desktop Only */}
      {!isMobile && !isFirstMatch && (
        <LobbyMainGrid
          // Play Hub Props
          activeSurface={activeSurface}
          onSurfaceChange={setActiveSurface}
          selectedMode={selectedMode}
          onModeChange={setSelectedMode}
          isFindingMatch={isFindingMatch}
          isCreatingPrivate={isCreatingPrivate}
          isJoiningPrivate={isJoiningPrivate}
          isConnected={isConnected}
          privateCode={privateCode}
          onPrivateCodeChange={setPrivateCode}
          elapsedSearchSeconds={elapsedSearchSeconds}
          onFindMatch={handleFindMatch}
          onCancelMatchmaking={handleCancelMatchmaking}
          onCreatePrivate={handleCreatePrivate}
          onJoinPrivate={handleJoinPrivate}
          // Board Briefing Props
          analytics={analytics}
          liveActivityCount={liveActivity.length}
          replayCount={replays.length}
          // Live Activity Props
          activityItems={filteredActivity}
          hasQuery={!!lobbyQuery}
          onClearQuery={() => setLobbyQuery('')}
          onNavigateReplay={(matchId) => navigate(`/replay/${matchId}`)}
          // Settings Props
          theme={theme}
          onThemeChange={setTheme}
          soundEnabled={soundEnabled}
          onSoundChange={setSoundEnabled}
          hapticsEnabled={hapticsEnabled}
          onHapticsChange={setHapticsEnabled}
          voiceEnabled={voiceEnabled}
          onVoiceChange={setVoiceEnabled}
          // Shared
          reduceMotion={reduceMotion}
          notifications={builtNotifications}
          onNavigateLeaderboard={() => navigate('/leaderboard')}
          onNavigateAnalytics={() => navigate('/analytics')}
          featuredReplay={featuredReplay}
        />
      )}

      {/* Footer Section - Both mobile and desktop */}
      {!isFirstMatch && (
        <LobbyFooter
          replays={filteredReplays}
          isLoadingReplays={isDashboardLoading}
          entries={filteredEntries}
          isLoadingLeaderboard={isDashboardLoading}
          onNavigateLeaderboard={() => navigate('/leaderboard')}
          playerStats={playerStats}
          reduceMotion={reduceMotion}
        />
      )}

      {/* Sticky Queue Button - Mobile Only */}
      <StickyQueueButton
        isVisible={isMobile && !isFirstMatch}
        isFindingMatch={isFindingMatch}
        isConnected={isConnected}
        elapsedSeconds={elapsedSearchSeconds}
        selectedMode={selectedMode}
        onFindMatch={handleFindMatch}
        onCancel={handleCancelMatchmaking}
      />
    </div>
  )
}
