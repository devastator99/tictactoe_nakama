import { SectionHeader } from '../../components/WebUI'
import SectionGlyph from './SectionGlyph'

const LOBBY_NOTES = [
  {
    title: 'Play with intent',
    body: 'Classic is better for longer reads. Timed mode rewards confident first choices and cleaner recovery.',
  },
  {
    title: 'Use private rooms',
    body: 'Private codes make rematches and side-by-side testing much easier when you are iterating with someone else.',
  },
  {
    title: 'Review the board',
    body: 'The replay and analytics surfaces are strong enough now to make the lobby your match review starting point.',
  },
] as const

export default function LobbyCoachNotes() {
  return (
    <section className="premium-card-muted p-6">
      <SectionHeader
        eyebrow="Coach notes"
        title="Small reminders"
        subtitle="A compact section for guidance, especially when you have been away from the board."
      />

      <div className="grid gap-4 lg:grid-cols-3">
        {LOBBY_NOTES.map((note, index) => (
          <article key={note.title} className="premium-section-card">
            <div className="mb-4">
              <SectionGlyph
                code={`N${index + 1}`}
                tone={index === 0 ? 'success' : index === 1 ? 'warm' : 'accent'}
              />
            </div>
            <h3 className="font-[var(--font-display)] text-xl font-bold tracking-[-0.04em] text-[var(--ink)]">{note.title}</h3>
            <p className="mt-3 text-sm leading-7 text-[var(--ink-soft)]">{note.body}</p>
          </article>
        ))}
      </div>
    </section>
  )
}
