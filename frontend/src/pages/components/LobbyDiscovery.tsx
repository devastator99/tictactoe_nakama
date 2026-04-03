import { SectionHeader } from '../../components/WebUI'
import SectionGlyph from './SectionGlyph'

interface LobbyDiscoveryProps {
  query: string
  onQueryChange: (value: string) => void
  onFilterChange: (filter: 'all' | 'activity' | 'replays' | 'players') => void
  selectedFilter: string
  activityCount: number
  replayCount: number
  playerCount: number
  reduceMotion: boolean
}

const DISCOVERY_FILTERS = [
  { key: 'all', label: 'Everything' },
  { key: 'activity', label: 'Activity' },
  { key: 'replays', label: 'Replays' },
  { key: 'players', label: 'Players' },
] as const

import AnimatedCounter from './AnimatedCounter'

export default function LobbyDiscovery({
  query,
  onQueryChange,
  onFilterChange,
  selectedFilter,
  activityCount,
  replayCount,
  playerCount,
  reduceMotion,
}: LobbyDiscoveryProps) {
  return (
    <section className="premium-card mt-6 p-6 md:p-8">
      <SectionHeader
        eyebrow="Discover"
        title="Search the lobby"
        subtitle="Filter players, replays, and live activity from one place while the rest of the lobby stays in view."
      />

      <div className="premium-search-shell">
        <input
          type="text"
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder="Search players, room activity, or replay details"
          className="premium-input"
        />

        <div className="flex flex-wrap gap-2">
          {DISCOVERY_FILTERS.map((filter) => (
            <button
              key={filter.key}
              onClick={() => onFilterChange(filter.key)}
              className={`premium-filter-chip ${selectedFilter === filter.key ? 'is-active' : ''}`}
            >
              {filter.label}
            </button>
          ))}

          {query.trim() && (
            <button onClick={() => onQueryChange('')} className="premium-filter-chip">
              Clear
            </button>
          )}
        </div>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-3">
        <div className="premium-section-card">
          <div className="flex items-center justify-between gap-3">
            <div className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--ink-muted)]">Activity matches</div>
            <SectionGlyph code="AC" tone="neutral" />
          </div>
          <div className="mt-2 font-[var(--font-display)] text-3xl font-bold tracking-[-0.05em] text-[var(--ink)]">
            <AnimatedCounter value={activityCount} reduceMotion={reduceMotion} />
          </div>
          <p className="mt-2 text-sm text-[var(--ink-soft)]">Live event results from your current search scope.</p>
        </div>

        <div className="premium-section-card">
          <div className="flex items-center justify-between gap-3">
            <div className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--ink-muted)]">Replay matches</div>
            <SectionGlyph code="RP" tone="warm" />
          </div>
          <div className="mt-2 font-[var(--font-display)] text-3xl font-bold tracking-[-0.05em] text-[var(--o)]">
            <AnimatedCounter value={replayCount} reduceMotion={reduceMotion} />
          </div>
          <p className="mt-2 text-sm text-[var(--ink-soft)]">Recent matches that match the current query.</p>
        </div>

        <div className="premium-section-card">
          <div className="flex items-center justify-between gap-3">
            <div className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--ink-muted)]">Player matches</div>
            <SectionGlyph code="PL" tone="accent" />
          </div>
          <div className="mt-2 font-[var(--font-display)] text-3xl font-bold tracking-[-0.05em] text-[var(--x)]">
            <AnimatedCounter value={playerCount} reduceMotion={reduceMotion} />
          </div>
          <p className="mt-2 text-sm text-[var(--ink-soft)]">Leaderboard entries that match the current query.</p>
        </div>
      </div>
    </section>
  )
}
