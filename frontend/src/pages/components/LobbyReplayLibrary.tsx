import { SectionHeader } from '../../components/WebUI'
import { LobbyEmptyState } from './LobbyLiveActivity'
import { ReplayRecord } from '../../types'

interface LobbyReplayLibraryProps {
  replays: ReplayRecord[]
  isLoading?: boolean
  hasQuery: boolean
  onClearQuery: () => void
  onNavigateReplay: (matchId: string) => void
  onNavigateAnalytics: () => void
  reduceMotion: boolean
}

function formatModeLabel(mode: string) {
  return mode.replace(/vs_ai_/g, 'AI ').replace(/_/g, ' ')
}

function formatTimestamp(value: number) {
  return new Date(value).toLocaleString()
}

export default function LobbyReplayLibrary({
  replays,
  hasQuery,
  onClearQuery,
  onNavigateReplay,
  onNavigateAnalytics,
}: LobbyReplayLibraryProps) {
  return (
    <section className="premium-card p-6" data-testid="lobby-replays-card">
      <SectionHeader
        eyebrow="Replay library"
        title="Recent matches"
        action={
          <button onClick={onNavigateAnalytics} className="premium-btn premium-btn-secondary px-4 py-2">
            Analytics
          </button>
        }
      />

      <div className="premium-list">
        {replays.length === 0 ? (
          <LobbyEmptyState
            code="RP"
            tone="warm"
            title={hasQuery ? 'No replay matches found' : 'No replays yet'}
            body={
              hasQuery
                ? 'Try a broader search to pull in more finished boards and player matchups.'
                : 'Finished matches will land here once the room starts generating replay-ready sessions.'
            }
            actionLabel={hasQuery ? 'Clear Search' : 'Open Analytics'}
            onAction={hasQuery ? onClearQuery : onNavigateAnalytics}
          />
        ) : (
          replays.slice(0, 5).map((replay) => (
            <button
              key={replay.matchId}
              onClick={() => onNavigateReplay(replay.matchId)}
              className="premium-list-item w-full text-left"
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="font-semibold capitalize text-[var(--ink)]">{formatModeLabel(replay.mode)}</div>
                  <div className="mt-2 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--ink-muted)]">
                    {Math.round(replay.durationMs / 1000)}s • {formatTimestamp(replay.endedAt)}
                  </div>
                </div>
                <span className="premium-badge">Replay</span>
              </div>
            </button>
          ))
        )}
      </div>
    </section>
  )
}
