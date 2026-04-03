import { GameMode } from '../../types'

type PlaySurface = 'quick' | 'ai' | 'private'

interface LobbyPlayHubProps {
  activeSurface: PlaySurface
  onSurfaceChange: (surface: PlaySurface) => void
  selectedMode: GameMode
  onModeChange: (mode: GameMode) => void
  isFindingMatch: boolean
  isCreatingPrivate: boolean
  isJoiningPrivate: boolean
  isConnected: boolean
  privateCode: string
  onPrivateCodeChange: (code: string) => void
  elapsedSearchSeconds: number
  onFindMatch: () => void
  onCancelMatchmaking: () => void
  onCreatePrivate: (mode?: GameMode) => void
  onJoinPrivate: () => void
}

const PLAY_SURFACES = [
  { key: 'quick', label: 'Quick match', detail: 'Ranked live opponents' },
  { key: 'ai', label: 'AI practice', detail: 'Warm up on your own' },
  { key: 'private', label: 'Private room', detail: 'Bring a friend' },
] as const

function formatModeLabel(mode: string) {
  return mode.replace(/vs_ai_/g, 'AI ').replace(/_/g, ' ')
}

export default function LobbyPlayHub(props: LobbyPlayHubProps) {
  const {
    activeSurface,
    onSurfaceChange,
    selectedMode,
    onModeChange,
    isFindingMatch,
    isCreatingPrivate,
    isJoiningPrivate,
    isConnected,
    privateCode,
    onPrivateCodeChange,
    elapsedSearchSeconds,
    onFindMatch,
    onCancelMatchmaking,
    onCreatePrivate,
    onJoinPrivate,
  } = props

  return (
    <section className="premium-card p-6 md:p-8" data-testid="lobby-match-card">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-[var(--ink-muted)]">Play hub</p>
          <h2 className="mt-2 font-[var(--font-display)] text-3xl font-bold tracking-[-0.05em] text-[var(--ink)]">
            Pick your next route
          </h2>
          <p className="mt-2 text-sm leading-7 text-[var(--ink-soft)]">
            Queue live, spar with AI, or spin up a private room from one section.
          </p>
        </div>
        <span className="premium-pill-light">Server authoritative</span>
      </div>

      {/* Tabs */}
      <div className="premium-tab-group mb-6">
        {PLAY_SURFACES.map((surface) => (
          <button
            key={surface.key}
            onClick={() => onSurfaceChange(surface.key as PlaySurface)}
            className={`premium-tab ${activeSurface === surface.key ? 'is-active' : ''}`}
          >
            <span>{surface.label}</span>
            <span className="text-xs font-medium opacity-70">{surface.detail}</span>
          </button>
        ))}
      </div>

      {/* Quick Match Tab */}
      {activeSurface === 'quick' && (
        <>
          <div className="mb-5 grid gap-3 md:grid-cols-2">
            <button
              onClick={() => onModeChange('classic')}
              className={`premium-segment flex-col items-start ${selectedMode === 'classic' ? 'is-selected' : ''}`}
            >
              <span className="text-lg font-[var(--font-display)] font-bold tracking-[-0.04em]">Classic</span>
              <span className="text-sm text-[var(--ink-soft)]">Relaxed pacing with more room to read the board.</span>
            </button>

            <button
              onClick={() => onModeChange('timed')}
              className={`premium-segment flex-col items-start ${selectedMode === 'timed' ? 'is-selected' : ''}`}
            >
              <span className="text-lg font-[var(--font-display)] font-bold tracking-[-0.04em]">Timed</span>
              <span className="text-sm text-[var(--ink-soft)]">Thirty seconds per move for fast pressure and cleaner instincts.</span>
            </button>
          </div>

          <div className="flex flex-wrap gap-3">
            <button 
              onClick={onFindMatch} 
              disabled={isFindingMatch || !isConnected} 
              className="premium-btn premium-btn-primary flex-1"
            >
              {isFindingMatch ? 'Searching for opponent...' : 'Find Match'}
            </button>
          </div>

          {isFindingMatch && (
            <div className="premium-banner mt-5" aria-live="polite">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--x)]">Matchmaking live</p>
                <h3 className="mt-2 font-[var(--font-display)] text-xl font-bold tracking-[-0.04em] text-[var(--ink)]">
                  Searching {formatModeLabel(selectedMode)}
                </h3>
                <p className="mt-2 text-sm text-[var(--ink-soft)]">
                  {elapsedSearchSeconds}s elapsed. We'll push you straight into a match as soon as the queue resolves.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <span className="premium-pill-light">Live queue</span>
                <button onClick={() => void onCancelMatchmaking()} className="premium-btn premium-btn-secondary">
                  Cancel Search
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* AI Tab */}
      {activeSurface === 'ai' && (
        <>
          <div className="mb-5 rounded-[26px] border border-[var(--line)] bg-[rgba(255,255,255,0.58)] p-5">
            <p className="text-sm leading-7 text-[var(--ink-soft)]">
              Practice board reading, openings, and pressure handling without waiting for a live queue.
            </p>
          </div>
          <div className="grid gap-3">
            <button 
              onClick={() => onCreatePrivate('vs_ai_easy')} 
              disabled={isCreatingPrivate || !isConnected} 
              className="premium-btn premium-btn-secondary w-full justify-between"
            >
              <span>Easy AI</span>
              <span className="premium-badge">Warm up</span>
            </button>
            <button 
              onClick={() => onCreatePrivate('vs_ai_medium')} 
              disabled={isCreatingPrivate || !isConnected} 
              className="premium-btn premium-btn-primary w-full justify-between"
            >
              <span>Medium AI</span>
              <span className="premium-badge">Balanced</span>
            </button>
            <button 
              onClick={() => onCreatePrivate('vs_ai_hard')} 
              disabled={isCreatingPrivate || !isConnected} 
              className="premium-btn premium-btn-warm w-full justify-between"
            >
              <span>Hard AI</span>
              <span className="premium-badge">Pressure</span>
            </button>
          </div>
        </>
      )}

      {/* Private Room Tab */}
      {activeSurface === 'private' && (
        <>
          <div className="mb-5 rounded-[26px] border border-[var(--line)] bg-[rgba(255,255,255,0.58)] p-5">
            <p className="text-sm leading-7 text-[var(--ink-soft)]">
              Create a room for a friend or jump into a code someone shared with you.
            </p>
          </div>
          <div className="space-y-3">
            <button 
              onClick={() => onCreatePrivate()} 
              disabled={isCreatingPrivate || !isConnected} 
              className="premium-btn premium-btn-secondary w-full"
            >
              {isCreatingPrivate ? 'Creating room...' : 'Create Room'}
            </button>
            <input
              type="text"
              value={privateCode}
              onChange={(event) => onPrivateCodeChange(event.target.value.toUpperCase())}
              placeholder="Enter room code"
              className="premium-input"
              maxLength={6}
            />
            <p className="text-sm text-[var(--ink-soft)]">Room codes are 6 characters and work best for fast rematches and shared testing.</p>
            <button 
              onClick={onJoinPrivate} 
              disabled={isJoiningPrivate || !isConnected || !privateCode.trim()} 
              className="premium-btn premium-btn-primary w-full"
            >
              {isJoiningPrivate ? 'Joining room...' : 'Join Room'}
            </button>
          </div>
        </>
      )}
    </section>
  )
}
