import { motion } from 'framer-motion'
import LobbyReplayLibrary from './LobbyReplayLibrary'
import LobbyLeaderboard from './LobbyLeaderboard'
import LobbyPersonalBreakdown from './LobbyPersonalBreakdown'
import { LeaderboardEntry, ReplayRecord, PlayerStats } from '../../types'

interface LobbyFooterProps {
  // Replay Library Props
  replays: ReplayRecord[]
  isLoadingReplays: boolean
  
  // Leaderboard Props
  entries: LeaderboardEntry[]
  isLoadingLeaderboard: boolean
  onNavigateLeaderboard: () => void
  
  // Personal Breakdown Props
  playerStats: PlayerStats | null
  
  // Shared
  reduceMotion: boolean
}

function getRevealProps(index: number, reduceMotion: boolean) {
  if (reduceMotion) return {}
  return {
    initial: { opacity: 0, y: 20 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, amount: 0.18 },
    transition: { duration: 0.34, delay: index * 0.04 },
  }
}

export default function LobbyFooter({
  replays,
  isLoadingReplays,
  entries,
  isLoadingLeaderboard,
  onNavigateLeaderboard,
  playerStats,
  reduceMotion,
}: LobbyFooterProps) {
  const revealProps = (index: number) => getRevealProps(index, reduceMotion)

  return (
    <div className="mt-12 space-y-6">
      {/* Three Column Grid */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* First Column: Replays */}
        <motion.div {...revealProps(0)}>
          <LobbyReplayLibrary
            replays={replays}
            isLoading={isLoadingReplays}
            hasQuery={false}
            onClearQuery={() => {}}
            onNavigateReplay={() => {}}
            onNavigateAnalytics={() => {}}
            reduceMotion={reduceMotion}
          />
        </motion.div>

        {/* Second Column: Rankings */}
        <motion.div {...revealProps(1)}>
          <LobbyLeaderboard
            entries={entries}
            isLoading={isLoadingLeaderboard}
            hasQuery={false}
            onClearQuery={() => {}}
            onNavigateLeaderboard={onNavigateLeaderboard}
          />
        </motion.div>

        {/* Third Column: Personal Stats */}
        <motion.div {...revealProps(2)}>
          <LobbyPersonalBreakdown playerStats={playerStats} reduceMotion={reduceMotion} />
        </motion.div>
      </div>
    </div>
  )
}
