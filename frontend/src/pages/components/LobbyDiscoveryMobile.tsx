import { motion } from 'framer-motion'
import { useState } from 'react'

interface LobbyDiscoveryMobileProps {
  onSearch: (query: string) => void
  recentSearches: string[]
  onSelectRecent: (search: string) => void
  trendingPlayers: Array<{
    name: string
    rating: number
    avatar?: string
  }>
  onSelectPlayer: (name: string) => void
}

export default function LobbyDiscoveryMobile({
  onSearch,
  recentSearches,
  onSelectRecent,
  trendingPlayers,
  onSelectPlayer,
}: LobbyDiscoveryMobileProps) {
  const [searchQuery, setSearchQuery] = useState('')

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.3 }}
      className="space-y-4 rounded-xl border border-cyan-900/20 bg-gradient-to-br from-slate-950 to-slate-900 p-4"
    >
      {/* Search Input */}
      <div className="space-y-2">
        <p className="text-xs font-medium uppercase tracking-widest text-cyan-400/60">
          Discover Players
        </p>
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value)
              onSearch(e.target.value)
            }}
            placeholder="Search players..."
            className="w-full rounded-lg border border-cyan-500/30 bg-slate-950 px-4 py-3 text-white placeholder-cyan-500/40 focus:border-cyan-500 focus:outline-none"
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-cyan-500/40">
            🔍
          </span>
        </div>
      </div>

      {/* Recent Searches */}
      {recentSearches.length > 0 && (
        <div className="space-y-2 border-t border-cyan-900/20 pt-4">
          <p className="text-xs font-medium uppercase tracking-widest text-cyan-400/60">
            Recent
          </p>
          <div className="flex flex-wrap gap-2">
            {recentSearches.slice(0, 4).map((search) => (
              <motion.button
                key={search}
                onClick={() => {
                  setSearchQuery(search)
                  onSelectRecent(search)
                }}
                className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-xs text-cyan-400 hover:border-cyan-500/60 hover:bg-cyan-500/20"
                whileTap={{ scale: 0.95 }}
              >
                {search}
              </motion.button>
            ))}
          </div>
        </div>
      )}

      {/* Trending Players */}
      {trendingPlayers.length > 0 && (
        <div className="space-y-2 border-t border-cyan-900/20 pt-4">
          <p className="text-xs font-medium uppercase tracking-widest text-cyan-400/60">
            Trending
          </p>
          <div className="space-y-2">
            {trendingPlayers.slice(0, 5).map((player, idx) => (
              <motion.button
                key={player.name}
                onClick={() => onSelectPlayer(player.name)}
                className="w-full rounded-lg border border-cyan-500/20 bg-cyan-500/5 px-4 py-2 text-left transition-all hover:border-cyan-500/40 hover:bg-cyan-500/10"
                whileTap={{ scale: 0.97 }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full bg-gradient-to-br from-cyan-500 to-blue-500" />
                    <div>
                      <p className="text-sm font-semibold text-cyan-300">
                        {player.name}
                      </p>
                      <p className="text-xs text-cyan-500/60">
                        Rating: {player.rating}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs text-cyan-400/60">#{idx + 1}</span>
                </div>
              </motion.button>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  )
}
