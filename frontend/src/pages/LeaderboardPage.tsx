import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { ScreenHero, SectionHeader } from '../components/WebUI'
import { useAuthStore, useLeaderboardStore } from '../context/store'
import { nakamaService } from '../services/nakama.service'
import { getErrorMessage } from '../lib/client-utils'

export default function LeaderboardPage() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { entries, playerStats, isLoading, setEntries, setPlayerStats, setLoading } = useLeaderboardStore()

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        const [leaderboard, stats] = await Promise.all([
          nakamaService.getLeaderboard(50),
          nakamaService.getPlayerStats(user?.userId),
        ])
        setEntries(leaderboard)
        setPlayerStats(stats)
      } catch (error) {
        console.error('Failed to load leaderboard data:', error)
        toast.error(getErrorMessage(error, 'Failed to load leaderboard data'))
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [user?.userId, setEntries, setPlayerStats, setLoading])

  return (
    <div className="min-h-screen px-4 py-6">
      <div className="stage-shell--narrow">
        <div className="mb-6">
          <ScreenHero
            tag="Leaderboard"
            title="Top players, cleanly ranked."
            description="Review the current ladder, compare streaks, and see how your personal stats stack up."
            dark
          />
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.25fr_0.75fr]">
          <section className="premium-card p-6 md:p-8">
            <SectionHeader
              eyebrow="Rankings"
              title="Top players"
              action={<span className="premium-pill-light">{entries.length} players</span>}
            />

            {isLoading ? (
              <div className="premium-stat text-center text-sm text-[var(--ink-soft)]">Loading leaderboard...</div>
            ) : entries.length === 0 ? (
              <div className="premium-stat text-center text-sm text-[var(--ink-soft)]">No games played yet.</div>
            ) : (
              <div className="space-y-3">
                {entries.map((entry, index) => (
                  <div
                    key={entry.userId}
                    className="premium-stat flex flex-col gap-4 md:flex-row md:items-center md:justify-between"
                    style={{
                      borderColor: entry.userId === user?.userId ? 'rgba(74, 141, 255, 0.22)' : undefined,
                      background: entry.userId === user?.userId ? 'rgba(74, 141, 255, 0.08)' : undefined,
                    }}
                  >
                    <div className="flex items-center gap-4">
                      <span className="premium-badge" style={{ color: index === 0 ? 'var(--o)' : 'var(--ink)' }}>
                        #{entry.rank}
                      </span>
                      <div>
                        <div className="font-[var(--font-display)] text-xl font-bold tracking-[-0.04em] text-[var(--ink)]">
                          {entry.username}
                        </div>
                        <div className="text-sm text-[var(--ink-soft)]">{entry.totalGames} total games</div>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3 md:min-w-[240px]">
                      <div className="rounded-[20px] bg-white/70 px-3 py-2 text-center">
                        <div className="font-[var(--font-display)] text-xl font-bold tracking-[-0.04em] text-[var(--success)]">{entry.wins}</div>
                        <div className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--ink-muted)]">Wins</div>
                      </div>
                      <div className="rounded-[20px] bg-white/70 px-3 py-2 text-center">
                        <div className="font-[var(--font-display)] text-xl font-bold tracking-[-0.04em] text-[var(--x)]">{entry.winStreak}</div>
                        <div className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--ink-muted)]">Streak</div>
                      </div>
                      <div className="rounded-[20px] bg-white/70 px-3 py-2 text-center">
                        <div className="font-[var(--font-display)] text-xl font-bold tracking-[-0.04em] text-[var(--o)]">{entry.totalGames}</div>
                        <div className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--ink-muted)]">Games</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <aside className="space-y-6">
            <section className="premium-card p-6">
              <SectionHeader eyebrow="Your snapshot" title="Personal stats" />

              {isLoading ? (
                <div className="-mt-1 premium-stat text-center text-sm text-[var(--ink-soft)]">Loading stats...</div>
              ) : playerStats ? (
                <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                  <div className="premium-stat">
                    <div className="font-[var(--font-display)] text-3xl font-bold tracking-[-0.05em] text-[var(--success)]">{playerStats.wins}</div>
                    <div className="text-sm text-[var(--ink-soft)]">Wins</div>
                  </div>
                  <div className="premium-stat">
                    <div className="font-[var(--font-display)] text-3xl font-bold tracking-[-0.05em] text-[var(--danger)]">{playerStats.losses}</div>
                    <div className="text-sm text-[var(--ink-soft)]">Losses</div>
                  </div>
                  <div className="premium-stat">
                    <div className="font-[var(--font-display)] text-3xl font-bold tracking-[-0.05em] text-[var(--o)]">{playerStats.draws}</div>
                    <div className="text-sm text-[var(--ink-soft)]">Draws</div>
                  </div>
                  <div className="premium-stat">
                    <div className="font-[var(--font-display)] text-3xl font-bold tracking-[-0.05em] text-[var(--x)]">{playerStats.bestStreak}</div>
                    <div className="text-sm text-[var(--ink-soft)]">Best streak</div>
                  </div>
                </div>
              ) : (
                <div className="mt-5 premium-stat text-center text-sm text-[var(--ink-soft)]">No stats available yet.</div>
              )}
            </section>

            <div className="flex flex-col gap-3">
              <button onClick={() => navigate('/lobby')} className="premium-btn premium-btn-secondary w-full">
                Back to Lobby
              </button>
              <button onClick={() => navigate('/analytics')} className="premium-btn premium-btn-primary w-full">
                Open Analytics
              </button>
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}
