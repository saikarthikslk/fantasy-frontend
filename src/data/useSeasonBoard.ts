import { useQuery } from '@tanstack/react-query'
import type { OverallLeaderboardEntry } from '@/types/api'

/** A leaderboard entry enriched with season-wide derived fields. */
export type SeasonPlayer = OverallLeaderboardEntry & {
  rank: number
  played: number
  wins: number
  bestFinish: number
}

export type SeasonMeta = {
  playerCount: number
  matchCount: number
  firstMatch: number
  lastMatch: number
  champion: SeasonPlayer | null
}

export type SeasonBoard = {
  players: SeasonPlayer[]
  meta: SeasonMeta
}

function derive(raw: OverallLeaderboardEntry[]): SeasonBoard {
  const sorted = [...raw].sort((a, b) => b.totalpoints - a.totalpoints)
  const players: SeasonPlayer[] = sorted.map((p, i) => {
    const positions = p.stats.map((s) => s.position)
    return {
      ...p,
      rank: i + 1,
      played: p.stats.length,
      wins: p.stats.filter((s) => s.position === 1).length,
      bestFinish: positions.length ? Math.min(...positions) : 0,
    }
  })
  const allTs = raw.flatMap((p) => p.stats.map((s) => s.timestamp))
  const matchIds = new Set(raw.flatMap((p) => p.stats.map((s) => s.matchid)))
  return {
    players,
    meta: {
      playerCount: players.length,
      matchCount: matchIds.size,
      firstMatch: allTs.length ? Math.min(...allTs) : 0,
      lastMatch: allTs.length ? Math.max(...allTs) : 0,
      champion: players[0] ?? null,
    },
  }
}

/** Loads the bundled final season board (static; never refetches). */
export function useSeasonBoard() {
  return useQuery({
    queryKey: ['season-board-2026'],
    queryFn: async (): Promise<SeasonBoard> => {
      const res = await fetch('/season-2026.json')
      if (!res.ok) throw new Error('Failed to load season data')
      const raw = (await res.json()) as OverallLeaderboardEntry[]
      return derive(raw)
    },
    staleTime: Infinity,
    gcTime: Infinity,
  })
}
