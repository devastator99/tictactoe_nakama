import { SectionHeader } from '../../components/WebUI'
import { LobbyEmptyState } from './LobbyLiveActivity'
import { LeaderboardEntry } from '../../types'

interface LobbyLeaderboardProps {
  entries: LeaderboardEntry[]
  isLoading: boolean
  hasQuery: boolean
  onClearQuery: () => void
  onNavigateLeaderboard: () => void
}

export default function LobbyLeaderboard({
  entries,
  isLoading,
  hasQuery,
  onClearQuery,
  onNavigateLeaderboard,
}: LobbyLeaderboardProps) {
  return (
    <section className="premium-card p-6" data-testid="lobby-leaderboard-card">
      <SectionHeader
        eyebrow="Leaderboard"
        title="Top players"
        action={
          <button onClick={onNavigateLeaderboard} className="premium-btn premium-btn-secondary px-4 py-2">
            Full list
          </button>
        }
      />

      <div className="premium-list">
        {isLoading ? (
          <div className="premium-list-item text-sm text-[var(--ink-soft)]">Loading leaderboard...</div>
        ) : entries.length === 0 ? (
          <LobbyEmptyState
            code="LD"
            tone="accent"
            title={hasQuery ? 'No player matches found' : 'No ranked games yet'}
            body={
              hasQuery
                ? 'Search by username, rank, or totals to surface a wider slice of the ladder.'
                : 'The leaderboard will start filling as soon as ranked players post finished games.'
            }
            actionLabel={hasQuery ? 'Clear Search' : 'Queue Ranked'}
            onAction={hasQuery ? onClearQuery : onNavigateLeaderboard}
          />
        ) : (
          entries.slice(0, 5).map((entry) => (
            <div key={entry.userId} className="premium-list-item flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="premium-badge">#{entry.rank}</span>
                <div>
                  <div className="font-semibold text-[var(--ink)]">{entry.username}</div>
                  <div className="text-sm text-[var(--ink-soft)]">{entry.totalGames} games</div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-semibold text-[var(--o)]">{entry.wins} wins</div>
                <div className="text-sm text-[var(--ink-soft)]">{entry.winStreak} streak</div>
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  )
}
