import { ReactNode } from 'react'
import BrandMark from './BrandMark'

interface ScreenHeroProps {
  tag: string
  title: string
  description: string
  dark?: boolean
  actions?: ReactNode
}

interface SectionHeaderProps {
  eyebrow: string
  title: string
  subtitle?: string
  action?: ReactNode
}

interface StatTileProps {
  label: string
  value: ReactNode
  tone?: string
}

export function ScreenHero({ tag, title, description, dark = false, actions }: ScreenHeroProps) {
  return (
    <section className={`${dark ? 'premium-card-dark' : 'premium-card'} p-7 md:p-8`}>
      <div className="mb-4 flex items-center gap-3">
        <BrandMark size="sm" />
        <span className={dark ? 'premium-pill' : 'premium-pill-light'}>{tag}</span>
      </div>
      <h1 className={`${dark ? 'premium-heading' : 'font-[var(--font-display)] text-[var(--ink)]'} text-4xl font-bold tracking-[-0.05em] md:text-5xl`}>
        {title}
      </h1>
      <p className={`mt-3 max-w-2xl text-base leading-8 ${dark ? 'text-white/78' : 'text-[var(--ink-soft)]'}`}>
        {description}
      </p>
      {actions ? <div className="mt-5">{actions}</div> : null}
    </section>
  )
}

export function SectionHeader({ eyebrow, title, subtitle, action }: SectionHeaderProps) {
  return (
    <div className="mb-5 flex items-center justify-between gap-3">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-[var(--ink-muted)]">{eyebrow}</p>
        <h2 className="mt-2 font-[var(--font-display)] text-3xl font-bold tracking-[-0.05em] text-[var(--ink)]">{title}</h2>
        {subtitle ? <p className="mt-2 text-sm leading-7 text-[var(--ink-soft)]">{subtitle}</p> : null}
      </div>
      {action}
    </div>
  )
}

export function StatTile({ label, value, tone = 'var(--ink)' }: StatTileProps) {
  return (
    <div className="premium-card p-5">
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--ink-muted)]">{label}</p>
      <p className="mt-2 font-[var(--font-display)] text-2xl font-bold tracking-[-0.05em]" style={{ color: tone }}>
        {value}
      </p>
    </div>
  )
}
