import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { ScreenHero, SectionHeader, StatTile } from '../components/WebUI'
import { nakamaService } from '../services/nakama.service'
import { AnalyticsData, ReplayRecord } from '../types'
import StatusScreen from '../components/StatusScreen'

const PIE_COLORS = ['#4a8dff', '#ff9a3d', '#33b37c', '#8092a6', '#b8c6d8']

export default function AnalyticsPage() {
  const navigate = useNavigate()
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [recentReplays, setRecentReplays] = useState<ReplayRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadAnalytics = async () => {
      try {
        setIsLoading(true)
        const [data, replays] = await Promise.all([
          nakamaService.getAnalytics(),
          nakamaService.getRecentReplays(8),
        ])
        setAnalytics(data)
        setRecentReplays(replays)
      } catch (error) {
        console.error('Failed to load analytics:', error)
        setAnalytics(null)
      } finally {
        setIsLoading(false)
      }
    }

    void loadAnalytics()
  }, [])

  const modeChartData = useMemo(() => {
    if (!analytics) return []
    return Object.entries(analytics.modeCounts).map(([mode, value]) => ({
      mode: mode.replace(/_/g, ' '),
      value,
    }))
  }, [analytics])

  const cellChartData = useMemo(() => {
    if (!analytics) return []
    return analytics.cellClicks.map((clicks, index) => ({
      cell: String(index),
      clicks,
    }))
  }, [analytics])

  if (isLoading) {
    return <StatusScreen title="Loading Analytics" message="Collecting match trends and gameplay metrics." isLoading />
  }

  if (!analytics) {
    return (
      <StatusScreen
        title="Analytics Unavailable"
        message="Unable to load analytics right now."
        primaryActionLabel="Back to Lobby"
        onPrimaryAction={() => navigate('/lobby')}
      />
    )
  }

  return (
    <div className="min-h-screen px-4 py-6">
      <div className="stage-shell--narrow">
        <div className="mb-6">
          <ScreenHero
            tag="Analytics"
            title="How players are using the board."
            description="Explore mode balance, click patterns, and the replay feed without leaving the premium board view."
            dark
          />
        </div>

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {[
            ['Total matches', analytics.totalMatches, 'var(--ink)'],
            ['Active now', analytics.activeMatches, 'var(--success)'],
            ['Average duration', `${Math.round(analytics.averageDurationMs / 1000)}s`, 'var(--o)'],
            ['Total moves', analytics.totalMoves, 'var(--x)'],
          ].map(([label, value, color]) => (
            <StatTile key={String(label)} label={String(label)} value={value} tone={String(color)} />
          ))}
        </div>

        <div className="mt-6 grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
          <section className="premium-card p-6">
            <SectionHeader eyebrow="Mode share" title="Game modes" />
            <div className="mt-6 flex flex-col items-center gap-4">
              <PieChart width={220} height={220}>
                <Pie
                  data={modeChartData}
                  dataKey="value"
                  nameKey="mode"
                  cx="50%"
                  cy="50%"
                  outerRadius={78}
                  innerRadius={42}
                  paddingAngle={2}
                >
                  {modeChartData.map((entry, idx) => (
                    <Cell key={`${entry.mode}-${idx}`} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    borderRadius: 16,
                    border: '1px solid rgba(122, 138, 157, 0.18)',
                    background: '#fbf8f3',
                    boxShadow: '0 18px 30px rgba(8, 23, 34, 0.16)',
                  }}
                />
              </PieChart>

              <div className="grid w-full gap-3">
                {modeChartData.map((entry, index) => (
                  <div key={entry.mode} className="premium-stat flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <span className="h-3 w-3 rounded-full" style={{ background: PIE_COLORS[index % PIE_COLORS.length] }} />
                      <span className="font-semibold capitalize text-[var(--ink)]">{entry.mode}</span>
                    </div>
                    <span className="text-sm font-semibold text-[var(--ink-soft)]">{entry.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="premium-card p-6">
            <SectionHeader eyebrow="Cell heat" title="Board interactions" />
            <div className="mt-6 h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={cellChartData} margin={{ top: 8, right: 8, left: -16, bottom: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(122, 138, 157, 0.18)" />
                  <XAxis dataKey="cell" stroke="#8d99a8" />
                  <YAxis stroke="#8d99a8" />
                  <Tooltip
                    contentStyle={{
                      borderRadius: 16,
                      border: '1px solid rgba(122, 138, 157, 0.18)',
                      background: '#fbf8f3',
                      boxShadow: '0 18px 30px rgba(8, 23, 34, 0.16)',
                    }}
                  />
                  <Bar dataKey="clicks" fill="#4a8dff" radius={[10, 10, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[0.65fr_1.35fr]">
          <section className="premium-card p-6">
            <SectionHeader eyebrow="Integrity" title="Game health" />
            <div className="mt-5 space-y-3">
              <div className="premium-stat flex items-center justify-between">
                <span className="font-semibold text-[var(--ink)]">Quantum moves</span>
                <span className="font-[var(--font-display)] text-2xl font-bold tracking-[-0.04em] text-[var(--x)]">{analytics.quantumMoves}</span>
              </div>
              <div className="premium-stat flex items-center justify-between">
                <span className="font-semibold text-[var(--ink)]">Suspicious moves</span>
                <span className="font-[var(--font-display)] text-2xl font-bold tracking-[-0.04em] text-[var(--danger)]">{analytics.suspiciousMoves}</span>
              </div>
              <div className="premium-stat flex items-center justify-between">
                <span className="font-semibold text-[var(--ink)]">Shadow bans</span>
                <span className="font-[var(--font-display)] text-2xl font-bold tracking-[-0.04em] text-[var(--o)]">{analytics.shadowBans}</span>
              </div>
            </div>
          </section>

          <section className="premium-card p-6">
            <SectionHeader
              eyebrow="Replay feed"
              title="Recent sessions"
              action={
                <button onClick={() => navigate('/lobby')} className="premium-btn premium-btn-secondary px-4 py-2">
                  Back to Lobby
                </button>
              }
            />

            <div className="space-y-3">
              {recentReplays.map((replay) => (
                <div key={replay.matchId} className="premium-stat flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <div className="font-semibold text-[var(--ink)]">{replay.players.map((player) => player.username).join(' vs ')}</div>
                    <div className="mt-1 text-sm capitalize text-[var(--ink-soft)]">
                      {replay.mode.replace(/_/g, ' ')} • {Math.round(replay.durationMs / 1000)}s
                    </div>
                  </div>
                  <div className="text-sm font-semibold text-[var(--ink-muted)]">{new Date(replay.startedAt).toLocaleString()}</div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
