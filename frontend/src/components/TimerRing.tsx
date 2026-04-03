import { motion } from 'framer-motion'

interface TimerRingProps {
  timeLeft: string
  isLowTime: boolean
  isActive: boolean
}

export default function TimerRing({ timeLeft, isLowTime, isActive }: TimerRingProps) {
  const [minutes, seconds] = timeLeft.split(':').map(Number)
  const totalSeconds = minutes * 60 + seconds
  const progress = Math.max(0, (30 - totalSeconds) / 30)
  const stroke = isLowTime ? 'var(--danger)' : isActive ? 'var(--x)' : 'var(--o)'

  return (
    <div className="premium-card-muted flex items-center gap-4 px-5 py-4">
      <div className="relative h-20 w-20">
        <svg className="h-20 w-20 -rotate-90" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="42" stroke="rgba(107,122,140,0.18)" strokeWidth="10" fill="transparent" />
          <motion.circle
            cx="50"
            cy="50"
            r="42"
            stroke={stroke}
            strokeWidth="10"
            fill="transparent"
            strokeLinecap="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: progress }}
            transition={{ duration: 0.4, ease: 'easeInOut' }}
            style={{
              strokeDasharray: '264',
              strokeDashoffset: `calc(264 * ${progress})`,
            }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="font-[var(--font-display)] text-lg font-bold tracking-[-0.04em]" style={{ color: stroke }}>
            {timeLeft}
          </span>
        </div>
      </div>

      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--ink-muted)]">Turn clock</p>
        <p className="font-[var(--font-display)] text-xl font-bold tracking-[-0.04em] text-[var(--ink)]">
          {isLowTime ? 'Hurry up' : isActive ? 'You are live' : 'Opponent turn'}
        </p>
      </div>
    </div>
  )
}
