import { GameMode, ActivityEvent, ReplayRecord, AnalyticsData, PlayerStats } from '../../types'

export interface NotificationItem {
  title: string
  body: string
  tone: 'warning' | 'accent' | 'success' | 'neutral'
  actionLabel: string
  onClick?: () => void
}

interface UseNotificationsParams {
  isConnected: boolean
  isFindingMatch: boolean
  selectedMode: GameMode
  elapsedSearchSeconds: number
  onCancelMatchmaking: () => void
  onNavigateReplay: (matchId: string) => void
  onNavigateAnalytics: () => void
  onSetActiveSurface: (surface: string) => void
  featuredEvent: ActivityEvent | null
  featuredReplay: ReplayRecord | null
  analytics: AnalyticsData | null
  playerStats: PlayerStats | null
}

export function useNotifications({
  isConnected,
  isFindingMatch,
  selectedMode,
  elapsedSearchSeconds,
  onCancelMatchmaking,
  onNavigateReplay,
  onNavigateAnalytics,
  onSetActiveSurface,
  featuredEvent,
  featuredReplay,
  analytics,
  playerStats,
}: UseNotificationsParams): NotificationItem[] {
  const notifications = [
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
          onClick: () => void onCancelMatchmaking(),
        }
      : null,
    featuredEvent
      ? {
          title: 'Live pulse',
          body: featuredEvent.message,
          tone: 'success' as const,
          actionLabel: 'Open replay',
          onClick: featuredEvent.matchId ? () => onNavigateReplay(featuredEvent.matchId) : undefined,
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
          onClick: () => onNavigateReplay(featuredReplay.matchId),
        }
      : null,
    analytics
      ? {
          title: 'Board traffic',
          body: `${analytics.activeMatches} active matches and ${analytics.totalMatches} total sessions tracked right now.`,
          tone: 'neutral' as const,
          actionLabel: 'Analytics',
          onClick: () => onNavigateAnalytics(),
        }
      : null,
    playerStats && playerStats.totalGames === 0
      ? {
          title: 'First match ready',
          body: 'Your personal stats board is waiting for its first ranked result.',
          tone: 'success' as const,
          actionLabel: 'Queue up',
          onClick: () => onSetActiveSurface('quick'),
        }
      : null,
  ]
    .filter(Boolean)
    .slice(0, 4) as NotificationItem[]

  return notifications
}
