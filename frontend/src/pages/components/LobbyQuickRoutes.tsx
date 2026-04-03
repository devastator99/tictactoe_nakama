import { SectionHeader } from '../../components/WebUI'
import SectionGlyph from './SectionGlyph'
import { ReplayRecord } from '../../types'

interface LobbyQuickRoutesProps {
  onNavigateLeaderboard: () => void
  onNavigateAnalytics: () => void
  onNavigateReplay: (matchId: string) => void
  featuredReplay: ReplayRecord | null
}

const LOBBY_SECTIONS = [
  { label: 'Leaderboard', detail: 'See your position on the ladder.', action: 'Open', path: '/leaderboard', icon: 'LD' },
  { label: 'Analytics', detail: 'Browse live mode and board trends.', action: 'Explore', path: '/analytics', icon: 'AN' },
  { label: 'Replay room', detail: 'Jump back into finished matches.', action: 'Watch', path: '/replay', icon: 'RP' },
] as const

function formatModeLabel(mode: string) {
  return mode.replace(/vs_ai_/g, 'AI ').replace(/_/g, ' ')
}

function formatTimestamp(value: number) {
  return new Date(value).toLocaleString()
}

export default function LobbyQuickRoutes({
  onNavigateLeaderboard,
  onNavigateAnalytics,
  onNavigateReplay,
  featuredReplay,
}: LobbyQuickRoutesProps) {
  const handleNavigation = (index: number) => {
    if (index === 0) {
      onNavigateLeaderboard()
    } else if (index === 1) {
      onNavigateAnalytics()
    } else if (index === 2 && featuredReplay) {
      onNavigateReplay(featuredReplay.matchId)
    }
  }

  return (
    <section className="premium-card p-6">
      <SectionHeader
        eyebrow="Quick routes"
        title="Jump to sections"
        subtitle="Fast navigation to the other product surfaces."
      />

      <div className="premium-list">
        {LOBBY_SECTIONS.map((section, index) => (
          <button
            key={section.label}
            onClick={() => handleNavigation(index)}
            className="premium-list-item w-full text-left"
          >
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <SectionGlyph
                  code={section.icon}
                  tone={index === 0 ? 'accent' : index === 1 ? 'neutral' : 'warm'}
                />
                <div>
                  <div className="font-semibold text-[var(--ink)]">{section.label}</div>
                  <div className="mt-1 text-sm text-[var(--ink-soft)]">{section.detail}</div>
                </div>
              </div>
              <span className="premium-badge">{section.action}</span>
            </div>
          </button>
        ))}
      </div>

      {featuredReplay && (
        <div className="premium-banner mt-5">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--x)]">Featured replay</p>
            <h3 className="mt-2 font-[var(--font-display)] text-xl font-bold tracking-[-0.04em] text-[var(--ink)]">
              {featuredReplay.players.map((player) => player.username).join(' vs ')}
            </h3>
            <p className="mt-2 text-sm text-[var(--ink-soft)]">
              {formatModeLabel(featuredReplay.mode)} • {Math.round(featuredReplay.durationMs / 1000)}s • {formatTimestamp(featuredReplay.endedAt)}
            </p>
          </div>
          <button onClick={() => onNavigateReplay(featuredReplay.matchId)} className="premium-btn premium-btn-primary">
            Open Replay
          </button>
        </div>
      )}
    </section>
  )
}
