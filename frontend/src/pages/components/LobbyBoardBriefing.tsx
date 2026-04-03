import { SectionHeader } from '../../components/WebUI'
import SectionGlyph from './SectionGlyph'
import AnimatedCounter from './AnimatedCounter'
import { AnalyticsData } from '../../types'

interface LobbyBoardBriefingProps {
  analytics: AnalyticsData | null
  liveActivityCount: number
  replayCount: number
  reduceMotion: boolean
}

export default function LobbyBoardBriefing({
  analytics,
  liveActivityCount,
  replayCount,
  reduceMotion,
}: LobbyBoardBriefingProps) {
  if (!analytics) return null

  const getTopMode = () => {
    const [mode] = Object.entries(analytics.modeCounts).sort((a, b) => b[1] - a[1])[0] ?? ['classic', 0]
    return mode.replace(/vs_ai_/g, 'AI ').replace(/_/g, ' ')
  }

  return (
    <section className="premium-card p-6">
      <SectionHeader
        eyebrow="Board briefing"
        title="What the room looks like"
        subtitle="A lighter summary of the live environment before you commit to a match."
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="premium-section-card">
          <div className="flex items-center justify-between gap-3">
            <div className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--ink-muted)]">Live events</div>
            <SectionGlyph code="LV" tone="neutral" />
          </div>
          <div className="mt-2 font-[var(--font-display)] text-3xl font-bold tracking-[-0.05em] text-[var(--ink)]">
            <AnimatedCounter value={liveActivityCount} reduceMotion={reduceMotion} />
          </div>
          <p className="mt-2 text-sm text-[var(--ink-soft)]">Fresh room activity in the last polling window.</p>
        </div>

        <div className="premium-section-card">
          <div className="flex items-center justify-between gap-3">
            <div className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--ink-muted)]">Recent replays</div>
            <SectionGlyph code="RR" tone="warm" />
          </div>
          <div className="mt-2 font-[var(--font-display)] text-3xl font-bold tracking-[-0.05em] text-[var(--o)]">
            <AnimatedCounter value={replayCount} reduceMotion={reduceMotion} />
          </div>
          <p className="mt-2 text-sm text-[var(--ink-soft)]">Matches ready to inspect or share.</p>
        </div>

        <div className="premium-section-card">
          <div className="flex items-center justify-between gap-3">
            <div className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--ink-muted)]">Average duration</div>
            <SectionGlyph code="AD" tone="accent" />
          </div>
          <div className="mt-2 font-[var(--font-display)] text-3xl font-bold tracking-[-0.05em] text-[var(--x)]">
            <AnimatedCounter
              value={Math.round(analytics.averageDurationMs / 1000)}
              suffix="s"
              reduceMotion={reduceMotion}
            />
          </div>
          <p className="mt-2 text-sm text-[var(--ink-soft)]">Typical match length across the current data set.</p>
        </div>

        <div className="premium-section-card">
          <div className="flex items-center justify-between gap-3">
            <div className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--ink-muted)]">Preferred mode</div>
            <SectionGlyph code="PM" tone="success" />
          </div>
          <div className="mt-2 font-[var(--font-display)] text-3xl font-bold tracking-[-0.05em] text-[var(--success)]">
            {getTopMode()}
          </div>
          <p className="mt-2 text-sm text-[var(--ink-soft)]">The most played mode from analytics right now.</p>
        </div>
      </div>
    </section>
  )
}
