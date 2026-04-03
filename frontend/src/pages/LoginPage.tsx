import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import BrandMark from '../components/BrandMark'
import { useAuthStore } from '../context/store'
import { useNakama } from '../hooks/useNakama'

const NAME_ADJECTIVES = ['Calm', 'Swift', 'Bright', 'Lucky', 'Clever', 'Quiet']
const NAME_NOUNS = ['Board', 'Nova', 'Orbit', 'Pixel', 'Pulse', 'Comet']

function buildSuggestedUsername() {
  const adjective = NAME_ADJECTIVES[Math.floor(Math.random() * NAME_ADJECTIVES.length)]
  const noun = NAME_NOUNS[Math.floor(Math.random() * NAME_NOUNS.length)]
  const suffix = Math.floor(Math.random() * 90) + 10
  return `${adjective}${noun}${suffix}`
}

export default function LoginPage() {
  const [username, setUsername] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [suggestedUsername, setSuggestedUsername] = useState(() => buildSuggestedUsername())
  const { setLoading } = useAuthStore()
  const { authenticate } = useNakama()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmedUsername = username.trim()
    if (!trimmedUsername) return

    setIsLoading(true)
    setLoading(true)

    try {
      await authenticate(trimmedUsername)
      toast.success(`Welcome, ${trimmedUsername}!`)
      navigate('/lobby')
    } catch {
      // Error already handled in useNakama
    } finally {
      setIsLoading(false)
      setLoading(false)
    }
  }

  const handleGuestLogin = async () => {
    setIsLoading(true)
    setLoading(true)

    try {
      await authenticate()
      toast.success('Welcome, Guest!')
      navigate('/lobby')
    } catch {
      // Error already handled in useNakama
    } finally {
      setIsLoading(false)
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen px-4 py-8">
      <div className="stage-shell flex min-h-[calc(100dvh-4rem)] items-center">
        <div className="grid w-full gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <section className="premium-card-dark p-8 md:p-10" data-testid="login-hero">
            <span className="premium-pill mb-6">Soft board. Sharp play.</span>
            <BrandMark size="lg" className="mb-5" />
            <h1 className="premium-heading mb-4 max-w-xl text-4xl md:text-6xl">
              Tic-Tac-Toe with a polished multiplayer feel.
            </h1>
            <p className="max-w-2xl text-base leading-8 text-white/78 md:text-lg">
              LILA keeps matchmaking, live play, replays, and leaderboards intact while wrapping the experience in a calmer, premium presentation.
            </p>

            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              <div className="premium-card-muted p-4">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--ink-muted)]">Realtime</p>
                <p className="mt-2 font-[var(--font-display)] text-xl font-bold text-[var(--ink)]">Live matches</p>
              </div>
              <div className="premium-card-muted p-4">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--ink-muted)]">Authority</p>
                <p className="mt-2 font-[var(--font-display)] text-xl font-bold text-[var(--ink)]">Server truth</p>
              </div>
              <div className="premium-card-muted p-4">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--ink-muted)]">Competitive</p>
                <p className="mt-2 font-[var(--font-display)] text-xl font-bold text-[var(--ink)]">Ranked history</p>
              </div>
            </div>
          </section>

          <section className="premium-card mx-auto w-full max-w-xl p-8 md:p-10" data-testid="login-form-card">
            <div className="mb-8 text-center">
              <BrandMark size="md" className="justify-center" />
              <h2 className="mt-5 font-[var(--font-display)] text-3xl font-bold tracking-[-0.05em] text-[var(--ink)]">
                Enter your name
              </h2>
              <p className="mt-2 text-sm leading-7 text-[var(--ink-soft)]">
                Jump in with a custom identity or step straight into the lobby as a guest.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="username" className="mb-2 block text-sm font-semibold text-[var(--ink-soft)]">
                  Player name
                </label>
                <input
                  id="username"
                  type="text"
                  autoFocus
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Nickname"
                  className="premium-input"
                  maxLength={20}
                />
                <p className="mt-2 text-sm text-[var(--ink-soft)]">No signup required. Your session stays on this device.</p>
              </div>

              <button type="submit" disabled={isLoading || !username.trim()} className="premium-btn premium-btn-primary w-full">
                {isLoading ? 'Connecting...' : 'Continue'}
              </button>
            </form>

            <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-sm">
              <span className="text-[var(--ink-soft)]">Need a name?</span>
              <button
                type="button"
                onClick={() => setUsername(suggestedUsername)}
                className="premium-pill-light"
              >
                Use {suggestedUsername}
              </button>
              <button
                type="button"
                onClick={() => setSuggestedUsername(buildSuggestedUsername())}
                className="premium-pill-light"
              >
                Shuffle
              </button>
            </div>

            <div className="my-5 flex items-center gap-3">
              <div className="h-px flex-1 bg-[var(--line)]" />
              <span className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--ink-muted)]">or</span>
              <div className="h-px flex-1 bg-[var(--line)]" />
            </div>

            <button onClick={handleGuestLogin} disabled={isLoading} className="premium-btn premium-btn-secondary w-full">
              {isLoading ? 'Connecting...' : 'Play as Guest'}
            </button>

            <div className="mt-6 flex flex-wrap items-center justify-center gap-2 text-xs font-semibold text-[var(--ink-muted)]">
              <span className="premium-pill-light">Version 1.0.0</span>
              <span className="premium-pill-light">Multiplayer</span>
              <span className="premium-pill-light">Private rooms</span>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
