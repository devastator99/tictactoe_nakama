import type { IconCode, IconTone } from './IconChip.types'

interface IconChipProps {
  code: IconCode
  tone?: IconTone
  size?: 'sm' | 'md'
}

const ICON_SVGS: Record<IconCode, string> = {
  WR: 'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z',
  ST: 'M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6',
  AM: 'M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75',
  TM: 'M4 6h16M4 12h16M4 18h16',
  CS: 'M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8z',
  WN: 'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z',
  GM: 'M3 3h18v18H3zM21 9H3M21 15H3M12 3v18',
  AV: 'M3 12a9 9 0 109-9 9.75 9.75 0 00-6.74 2.74L3 8M3 3v5h5',
  QM: 'M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z',
  EV: 'M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z',
  AC: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2',
  RP: 'M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z',
  PL: 'M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75',
  LV: 'M22 12h-4l-3 9L9 3l-3 9H2',
  RR: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
  AD: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
  PM: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
  N1: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
  N2: 'M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
  N3: 'M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z',
  LS: 'M6 18L18 6M6 6l12 12',
  DR: 'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9M20 20v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15',
  WS: 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6',
  BL: 'M11 3.055A9.001 9.001 0 1020.945 13H11V3.055zM20.488 9H15V3.512A9.025 9.025 0 0120.488 9z',
  GN: 'M3 3h18v18H3zM21 9H3M21 15H3M12 3v18',
  PT: 'M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6',
  RK: 'M4 6h16M4 12h16M4 18h7',
}

const ICON_LABELS: Record<IconCode, string> = {
  WR: 'Win Rate',
  ST: 'Streak',
  AM: 'Active Matches',
  TM: 'Top Mode',
  CS: 'Player Snapshot',
  WN: 'Wins',
  GM: 'Total Games',
  AV: 'Average',
  QM: 'Quantum Moves',
  EV: 'Featured Event',
  AC: 'Activity Matches',
  RP: 'Replay Matches',
  PL: 'Player Matches',
  LV: 'Live Events',
  RR: 'Recent Replays',
  AD: 'Average Duration',
  PM: 'Preferred Mode',
  N1: 'Note 1',
  N2: 'Note 2',
  N3: 'Note 3',
  LS: 'Losses',
  DR: 'Draws',
  WS: 'Win Streak',
  BL: 'Best Streak',
  GN: 'Games',
  PT: 'Points',
  RK: 'Rank',
}

const TONE_COLORS: Record<IconTone, string> = {
  neutral: 'var(--ink)',
  accent: 'var(--x)',
  warm: 'var(--o)',
  success: 'var(--success)',
}

export default function IconChip({ code, tone = 'neutral', size = 'md' }: IconChipProps) {
  const label = ICON_LABELS[code] || code
  const svgPath = ICON_SVGS[code]
  const color = TONE_COLORS[tone]
  const sizeClasses = size === 'sm' ? 'w-[1.5rem] h-[1.5rem]' : 'w-5 h-5'
  const chipSizeClasses = size === 'sm' ? 'min-w-[1.8rem] h-[1.8rem] text-[0.65rem] p-1' : 'min-w-[2.3rem] h-[2.3rem] text-[0.72rem] p-1.5'

  if (svgPath) {
    return (
      <span 
        className={`premium-icon-chip flex items-center justify-center ${chipSizeClasses}`}
        data-tone={tone}
        aria-label={label}
        title={label}
      >
        <svg 
          className={sizeClasses}
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor" 
          strokeWidth={2}
          strokeLinecap="round" 
          strokeLinejoin="round"
          style={{ color }}
        >
          <path d={svgPath} />
        </svg>
      </span>
    )
  }

  return (
    <span 
      className={`premium-icon-chip ${chipSizeClasses}`}
      data-tone={tone}
      aria-label={label}
      title={label}
    >
      {code}
    </span>
  )
}

export type { IconCode, IconTone }