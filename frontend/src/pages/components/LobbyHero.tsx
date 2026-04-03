import { useReducedMotion } from 'framer-motion'
import BrandMark from '../../components/BrandMark'
import IconChip, { type IconTone } from './IconChip'
import AnimatedCounter from './AnimatedCounter'
import { PlayerStats, AnalyticsData } from '../../types'

interface LobbyHeroProps {
  username: string
  isConnected: boolean
  playerStats: PlayerStats | null
  analytics: AnalyticsData | null
  onViewLeaderboard: () => void
  onOpenAnalytics: () => void
}

export default function LobbyHero({
  username,
  isConnected,
  playerStats,
  analytics,
  onViewLeaderboard,
  onOpenAnalytics,
}: LobbyHeroProps) {
  const shouldReduceMotion = useReducedMotion()

  const winRate = playerStats && playerStats.totalGames > 0 
    ? Math.round((playerStats.wins / playerStats.totalGames) * 100)
    : 0

  const getTopMode = () => {
    if (!analytics) return 'Classic'
    const [mode] = Object.entries(analytics.modeCounts).sort((a, b) => b[1] - a[1])[0] ?? ['classic', 0]
    return mode.replace(/vs_ai_/g, 'AI ').replace(/_/g, ' ')
  }

  const quickStats: Array<{ 
    label: string
    value: number | string
    suffix?: string
    icon: string
    tone: string
    iconTone: IconTone
  }> = [
    { label: 'Win rate', value: winRate, suffix: '%', icon: 'WR', tone: 'var(--success)', iconTone: 'success' },
    { label: 'Best streak', value: playerStats?.bestStreak ?? 0, icon: 'ST', tone: 'var(--x)', iconTone: 'accent' },
    { label: 'Active matches', value: analytics?.activeMatches ?? 0, icon: 'AM', tone: 'var(--o)', iconTone: 'warm' },
    { label: 'Top mode', value: getTopMode(), icon: 'TM', tone: 'var(--ink)', iconTone: 'neutral' },
  ]

  return (
    <>
      <div className="stage-shell">
        <section className="premium-card-dark p-7 md:p-8" data-testid="lobby-hero">
          <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
            {/* Left Column */}
            <div>
              <div className="mb-4 flex flex-wrap items-center gap-3">
                <BrandMark size="sm" />
                <span className="premium-pill">Lobby control</span>
                <span className="premium-pill">
                  <span className={`h-2.5 w-2.5 rounded-full ${isConnected ? 'bg-emerald-400' : 'bg-rose-400'}`} />
                  {isConnected ? 'Connected' : 'Offline'}
                </span>
              </div>

              <h1 className="premium-heading text-4xl md:text-6xl">Welcome back, {username}</h1>
              <p className="mt-3 max-w-3xl text-base leading-8 text-white/78 md:text-lg">
                The lobby now acts like your match command center: queue up quickly, review your form, scan live activity, and jump into replays or rankings without losing context.
              </p>

              <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {quickStats.map((item) => (
                  <div key={item.label} className="premium-hero-stat">
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-xs font-bold uppercase tracking-[0.18em] text-white/52">{item.label}</div>
                      <IconChip code={item.icon as never} tone={item.iconTone} size="sm" />
                    </div>
                    <div className="mt-2 font-[var(--font-display)] text-2xl font-bold tracking-[-0.04em]" style={{ color: item.tone }}>
                      {typeof item.value === 'number' ? (
                        <AnimatedCounter value={item.value} suffix={item.suffix} reduceMotion={Boolean(shouldReduceMotion)} />
                      ) : (
                        item.value
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Column - Player Info Cards */}
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-1">
              {/* Player Snapshot */}
              <section className="premium-card p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--ink-muted)]">Player snapshot</p>
                    <h2 className="mt-2 font-[var(--font-display)] text-2xl font-bold tracking-[-0.05em] text-[var(--ink)]">
                      Your board form
                    </h2>
                  </div>
                  <div className="premium-avatar">{username?.slice(0, 2).toUpperCase() || 'PL'}</div>
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  <div className="premium-list-item">
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--ink-muted)]">Wins</div>
                      <IconChip code="WN" tone="success" size="sm" />
                    </div>
                    <div className="mt-2 font-[var(--font-display)] text-3xl font-bold tracking-[-0.05em] text-[var(--success)]">
                      <AnimatedCounter value={playerStats?.wins ?? 0} reduceMotion={Boolean(shouldReduceMotion)} />
                    </div>
                  </div>
                  <div className="premium-list-item">
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--ink-muted)]">Total games</div>
                      <IconChip code="GM" tone="accent" size="sm" />
                    </div>
                    <div className="mt-2 font-[var(--font-display)] text-3xl font-bold tracking-[-0.05em] text-[var(--ink)]">
                      <AnimatedCounter value={playerStats?.totalGames ?? 0} reduceMotion={Boolean(shouldReduceMotion)} />
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-3">
                  <button onClick={onViewLeaderboard} className="premium-btn premium-btn-secondary">
                    View Leaderboard
                  </button>
                  <button onClick={onOpenAnalytics} className="premium-btn premium-btn-primary">
                    Open Analytics
                  </button>
                </div>
              </section>

              {/* Board Briefing */}
              <section className="premium-card p-5">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--ink-muted)]">Board briefing</p>
                <h2 className="mt-2 font-[var(--font-display)] text-2xl font-bold tracking-[-0.05em] text-[var(--ink)]">
                  Before you queue
                </h2>

                <div className="mt-4 premium-list">
                  <div className="premium-list-item flex items-center justify-between gap-3">
                    <span className="flex items-center gap-3 font-semibold text-[var(--ink)]">
                      <IconChip code="AV" tone="warm" size="sm" />
                      Average match
                    </span>
                    <span className="font-[var(--font-display)] text-xl font-bold tracking-[-0.04em] text-[var(--o)]">
                      {analytics ? <AnimatedCounter value={Math.round(analytics.averageDurationMs / 1000)} suffix="s" reduceMotion={Boolean(shouldReduceMotion)} /> : '...'}
                    </span>
                  </div>
                  <div className="premium-list-item flex items-center justify-between gap-3">
                    <span className="flex items-center gap-3 font-semibold text-[var(--ink)]">
                      <IconChip code="QM" tone="accent" size="sm" />
                      Quantum moves logged
                    </span>
                    <span className="font-[var(--font-display)] text-xl font-bold tracking-[-0.04em] text-[var(--x)]">
                      <AnimatedCounter value={analytics?.quantumMoves ?? 0} reduceMotion={Boolean(shouldReduceMotion)} />
                    </span>
                  </div>
                  <div className="premium-list-item flex items-center justify-between gap-3">
                    <span className="flex items-center gap-3 font-semibold text-[var(--ink)]">
                      <IconChip code="EV" tone="neutral" size="sm" />
                      Featured event
                    </span>
                    <span className="text-right text-sm font-semibold text-[var(--ink-soft)]">
                      {/* featured event time would be passed as prop */}
                      Quiet right now
                    </span>
                  </div>
                </div>
              </section>
            </div>
          </div>
        </section>
      </div>
    </>
  )
}
