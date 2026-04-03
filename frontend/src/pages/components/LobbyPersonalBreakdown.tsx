import { SectionHeader } from '../../components/WebUI'
import SectionGlyph from './SectionGlyph'
import AnimatedCounter from './AnimatedCounter'
import { PlayerStats } from '../../types'

interface LobbyPersonalBreakdownProps {
  playerStats: PlayerStats | null
  reduceMotion: boolean
}

export default function LobbyPersonalBreakdown({
  playerStats,
  reduceMotion,
}: LobbyPersonalBreakdownProps) {
  return (
    <section className="premium-card p-6">
      <SectionHeader
        eyebrow="Your record"
        title="Personal breakdown"
        subtitle="A fast read on how your results are trending before you enter another match."
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="premium-section-card">
          <div className="flex items-center justify-between gap-3">
            <div className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--ink-muted)]">Wins</div>
            <SectionGlyph code="WN" tone="success" />
          </div>
          <div className="mt-2 font-[var(--font-display)] text-3xl font-bold tracking-[-0.05em] text-[var(--success)]">
            <AnimatedCounter value={playerStats?.wins ?? 0} reduceMotion={reduceMotion} />
          </div>
        </div>

        <div className="premium-section-card">
          <div className="flex items-center justify-between gap-3">
            <div className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--ink-muted)]">Losses</div>
            <SectionGlyph code="LS" tone="accent" />
          </div>
          <div className="mt-2 font-[var(--font-display)] text-3xl font-bold tracking-[-0.05em] text-[var(--danger)]">
            <AnimatedCounter value={playerStats?.losses ?? 0} reduceMotion={reduceMotion} />
          </div>
        </div>

        <div className="premium-section-card">
          <div className="flex items-center justify-between gap-3">
            <div className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--ink-muted)]">Draws</div>
            <SectionGlyph code="DR" tone="warm" />
          </div>
          <div className="mt-2 font-[var(--font-display)] text-3xl font-bold tracking-[-0.05em] text-[var(--o)]">
            <AnimatedCounter value={playerStats?.draws ?? 0} reduceMotion={reduceMotion} />
          </div>
        </div>

        <div className="premium-section-card">
          <div className="flex items-center justify-between gap-3">
            <div className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--ink-muted)]">Best streak</div>
            <SectionGlyph code="ST" tone="accent" />
          </div>
          <div className="mt-2 font-[var(--font-display)] text-3xl font-bold tracking-[-0.05em] text-[var(--x)]">
            <AnimatedCounter value={playerStats?.bestStreak ?? 0} reduceMotion={reduceMotion} />
          </div>
        </div>
      </div>
    </section>
  )
}
