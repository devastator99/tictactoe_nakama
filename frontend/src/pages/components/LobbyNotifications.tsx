import { SectionHeader } from '../../components/WebUI'

interface NotificationItem {
  title: string
  body: string
  tone: 'warning' | 'accent' | 'success' | 'neutral'
  actionLabel: string
  onClick?: () => void
}

interface LobbyNotificationsProps {
  notifications: NotificationItem[]
}

export default function LobbyNotifications({ notifications }: LobbyNotificationsProps) {
  return (
    <section className="premium-card p-6">
      <SectionHeader
        eyebrow="Notifications"
        title="Signals and prompts"
        subtitle="A living rail for things you may want to react to immediately."
      />

      <div className="premium-notice-stack">
        {notifications.map((item) => (
          <button
            key={`${item.title}-${item.actionLabel}`}
            onClick={item.onClick}
            className="premium-notice-card"
            data-tone={item.tone}
            disabled={!item.onClick}
          >
            <div className="flex items-center justify-between gap-3">
              <div className="font-[var(--font-display)] text-xl font-bold tracking-[-0.04em] text-[var(--ink)]">{item.title}</div>
              <span className="premium-badge">{item.actionLabel}</span>
            </div>
            <p className="mt-3 text-sm leading-7 text-[var(--ink-soft)]">{item.body}</p>
          </button>
        ))}
      </div>
    </section>
  )
}
