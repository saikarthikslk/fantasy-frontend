import type { ApiMatch, ApiPlayer } from '@/types/api'
import {
  creditsForPlayer,
  normalizeRole,
  playerKey,
  ROLE_LIMITS,
  SQUAD_SIZE,
  TOTAL_CREDITS_CAP,
  MAX_PLAYERS_PER_SIDE,
  type FantasyRole,
} from './dream11Rules'

export interface SmartXIResult {
  selected: ApiPlayer[]
  captain: ApiPlayer
  viceCaptain: ApiPlayer
}

/** Score a player for ranking. Higher = better pick. */
function scorePlayer(p: ApiPlayer): number {
  const credits = creditsForPlayer(p)
  const role = normalizeRole(p.type)
  // All-rounders contribute with bat + ball → slight bonus
  const arBonus = role === 'AR' ? 0.3 : 0
  // Small jitter so repeated calls can produce variety (±0.15)
  const jitter = (Math.random() - 0.5) * 0.3
  return credits + arBonus + jitter
}

/**
 * Target composition — balanced meta XI.
 * Required slots filled first, then flex slots go to best remaining.
 */
const TARGET_COMPOSITION: Record<FantasyRole, number> = {
  WK: 1,
  BAT: 3,
  AR: 2,
  BOWL: 3,
}
const FLEX_SLOTS = SQUAD_SIZE - Object.values(TARGET_COMPOSITION).reduce((a, b) => a + b, 0) // 2

/**
 * Generate a strong, balanced XI from the player pool.
 *
 * Algorithm:
 * 1. Score & sort players within each role bucket
 * 2. Fill required slots per role (highest scored first)
 * 3. Fill flex slots from remaining players (any role, max 8 per role)
 * 4. Validate constraints (credits, team cap)
 * 5. If over budget, swap expensive players for cheaper alternatives
 * 6. Pick C/VC from top 2 scored in final XI
 */
export function generateSmartXI(
  players: ApiPlayer[],
  match: ApiMatch | null,
): SmartXIResult | null {
  if (players.length < SQUAD_SIZE) return null

  const t1Id = match?.team1?.teamId
  const t2Id = match?.team2?.teamId

  // Group by role with scores
  type Scored = { player: ApiPlayer; score: number; key: string }
  const byRole: Record<FantasyRole, Scored[]> = { WK: [], BAT: [], AR: [], BOWL: [] }

  for (const p of players) {
    const role = normalizeRole(p.type)
    byRole[role].push({ player: p, score: scorePlayer(p), key: playerKey(p) })
  }

  // Sort each bucket descending by score
  for (const role of Object.keys(byRole) as FantasyRole[]) {
    byRole[role].sort((a, b) => b.score - a.score)
  }

  const picked: Scored[] = []
  const pickedKeys = new Set<string>()
  const teamCount = new Map<number, number>()

  function canAdd(p: ApiPlayer): boolean {
    const tid = p.team?.teamId
    if (tid != null) {
      const count = teamCount.get(tid) ?? 0
      if (count >= MAX_PLAYERS_PER_SIDE) return false
    }
    return true
  }

  function addPlayer(s: Scored) {
    picked.push(s)
    pickedKeys.add(s.key)
    const tid = s.player.team?.teamId
    if (tid != null) teamCount.set(tid, (teamCount.get(tid) ?? 0) + 1)
  }

  // Step 1: Fill required slots per role
  for (const role of ['WK', 'BAT', 'AR', 'BOWL'] as FantasyRole[]) {
    const target = TARGET_COMPOSITION[role]
    let filled = 0
    for (const s of byRole[role]) {
      if (filled >= target) break
      if (pickedKeys.has(s.key)) continue
      if (!canAdd(s.player)) continue
      addPlayer(s)
      filled++
    }
    // If we can't fill required slots for this role, algo can't produce valid team
    if (filled < target) return null
  }

  // Step 2: Fill flex slots from best remaining (any role, respect max 8 per role)
  const remaining: Scored[] = []
  for (const role of Object.keys(byRole) as FantasyRole[]) {
    for (const s of byRole[role]) {
      if (!pickedKeys.has(s.key)) remaining.push(s)
    }
  }
  remaining.sort((a, b) => b.score - a.score)

  const roleCounts: Record<FantasyRole, number> = { WK: 0, BAT: 0, AR: 0, BOWL: 0 }
  for (const s of picked) roleCounts[normalizeRole(s.player.type)]++

  let flexFilled = 0
  for (const s of remaining) {
    if (flexFilled >= FLEX_SLOTS) break
    if (pickedKeys.has(s.key)) continue
    if (!canAdd(s.player)) continue
    const role = normalizeRole(s.player.type)
    if (roleCounts[role] >= ROLE_LIMITS[role].max) continue
    addPlayer(s)
    roleCounts[role]++
    flexFilled++
  }

  if (picked.length < SQUAD_SIZE) return null

  // Step 3: Check credit cap — if over, try swapping expensive picks for cheaper alts
  let totalCreds = picked.reduce((sum, s) => sum + creditsForPlayer(s.player), 0)

  if (totalCreds > TOTAL_CREDITS_CAP) {
    // Sort picked by score ascending (weakest first = best swap candidates)
    const sortedPicked = [...picked].sort((a, b) => a.score - b.score)

    for (const weak of sortedPicked) {
      if (totalCreds <= TOTAL_CREDITS_CAP) break
      const role = normalizeRole(weak.player.type)
      const weakCredits = creditsForPlayer(weak.player)

      // Temporarily remove weak player so canAdd sees accurate team counts
      const weakTid = weak.player.team?.teamId
      if (weakTid != null) teamCount.set(weakTid, (teamCount.get(weakTid) ?? 0) - 1)

      // Find a cheaper alternative in the same role
      const alt = byRole[role].find(
        (s) =>
          !pickedKeys.has(s.key) &&
          canAdd(s.player) &&
          creditsForPlayer(s.player) < weakCredits,
      )
      if (alt) {
        // Swap
        const idx = picked.indexOf(weak)
        pickedKeys.delete(weak.key)

        picked[idx] = alt
        pickedKeys.add(alt.key)
        const altTid = alt.player.team?.teamId
        if (altTid != null) teamCount.set(altTid, (teamCount.get(altTid) ?? 0) + 1)

        totalCreds = totalCreds - weakCredits + creditsForPlayer(alt.player)
      } else {
        // Restore the count — no swap happened
        if (weakTid != null) teamCount.set(weakTid, (teamCount.get(weakTid) ?? 0) + 1)
      }
    }

    // Still over budget → can't produce valid team
    if (totalCreds > TOTAL_CREDITS_CAP + 1e-6) return null
  }

  // Step 4: Balanced team check — ensure both teams represented
  if (t1Id != null && t2Id != null) {
    const c1 = teamCount.get(t1Id) ?? 0
    const c2 = teamCount.get(t2Id) ?? 0
    if (c1 === 0 || c2 === 0) return null // degenerate case
  }

  // Step 5: Pick captain & vice-captain (top 2 by score)
  picked.sort((a, b) => b.score - a.score)
  const captain = picked[0].player
  const viceCaptain = picked[1].player

  return {
    selected: picked.map((s) => s.player),
    captain,
    viceCaptain,
  }
}
