import SectionGlyph from './SectionGlyph'
import AnimatedCounter from './AnimatedCounter'
import { SectionHeader } from '../../components/WebUI'
import { ActivityEvent } from '../../types'

interface LobbyEmptyStateProps {
  code: string
  tone: 'neutral' | 'accent' | 'warm' | 'success'
  title: string
  body: string
  actionLabel?: string
  onAction?: () => void
}

export function LobbyEmptyState({
  code,
  tone,
  title,
  body,
  actionLabel,
  onAction,
}: LobbyEmptyStateProps) {
  return (
    <div className="premium-empty-state">
      <div className="flex items-start gap-4">
        <SectionGlyph code={code} tone={tone} />
        <div className="min-w-0 flex-1">
          <div className="font-[var(--font-display)] text-xl font-bold tracking-[-0.04em] text-[var(--ink)]">{title}</div>
          <p className="mt-2 text-sm leading-7 text-[var(--ink-soft)]">{body}</p>
          {actionLabel && onAction && (
            <button onClick={onAction} className="premium-btn premium-btn-secondary mt-4">
              {actionLabel}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

interface LobbyLiveActivityProps {
  activity: ActivityEvent[]
  isLoading?: boolean
  hasQuery: boolean
  onClearQuery: () => void
  onNavigateReplay: (matchId: string) => void
  onFindMatch: () => void
  reduceMotion: boolean
}

export default function LobbyLiveActivity({
  activity,
  hasQuery,
  onClearQuery,
  onNavigateReplay,
  onFindMatch,
  reduceMotion,
}: LobbyLiveActivityProps) {
  return (
    <section className="premium-card p-6" data-testid="lobby-activity-card">
      <SectionHeader
        eyebrow="Live activity"
        title="Room pulse"
        action={
          <span className="premium-pill-light">
            <AnimatedCounter value={activity.length} reduceMotion={reduceMotion} /> events
          </span>
        }
      />

      <div className="premium-list">
        {activity.length === 0 ? (
          <LobbyEmptyState
            code="LA"
            tone="neutral"
            title={hasQuery ? 'No live activity found' : 'The room is quiet right now'}
            body={
              hasQuery
                ? 'Try a broader search or switch back to Everything to see the current room pulse.'
                : 'Once players start matching and finishing boards, this rail will fill with live room updates.'
            }
            actionLabel={hasQuery ? 'Clear Search' : 'Find Match'}
            onAction={hasQuery ? onClearQuery : onFindMatch}
          />
        ) : (
          activity.slice(0, 5).map((event) => (
            <button
              key={event.id}
              onClick={() => event.matchId && onNavigateReplay(event.matchId)}
              className="premium-list-item w-full text-left"
            >
              <div className="font-semibold text-[var(--ink)]">{event.message}</div>
              <div className="mt-2 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--ink-muted)]">
                {new Date(event.at).toLocaleTimeString()}
              </div>
            </button>
          ))
        )}
      </div>
    </section>
  )
}
