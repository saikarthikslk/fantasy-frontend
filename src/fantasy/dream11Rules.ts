import type { ApiMatch, ApiPlayer } from '../types/api'

/** Squad rules aligned with common cricket fantasy apps (Dream11-style). */
export const SQUAD_SIZE = 11
/** Max players from one real team in the fixture. */
export const MAX_PLAYERS_PER_SIDE = 7

export type FantasyRole = 'WK' | 'BAT' | 'AR' | 'BOWL'

export const ROLE_LIMITS: Record<FantasyRole, { min: number; max: number }> = {
  WK: { min: 1, max: 8 },
  BAT: { min: 1, max: 8 },
  AR: { min: 1, max: 8 },
  BOWL: { min: 1, max: 8 },
}

export function normalizeRole(raw: string | undefined): FantasyRole {
  const s = (raw ?? 'BAT').toUpperCase().trim()
  if (/WK|WICKET|KEEPER/.test(s)) return 'WK'
  if (/BOWL|BOWLER/.test(s)) return 'BOWL'
  if (/^AR$|ALL|ALL-?ROUND/.test(s)) return 'AR'
  if (/BAT|BATS/.test(s)) return 'BAT'
  return 'BAT'
}

export function roleLabel(r: FantasyRole): string {
  const labels: Record<FantasyRole, string> = {
    WK: 'WK',
    BAT: 'BAT',
    AR: 'AR',
    BOWL: 'BOWL',
  }
  return labels[r]
}

export function countRoles(players: ApiPlayer[]): Record<FantasyRole, number> {
  const c = { WK: 0, BAT: 0, AR: 0, BOWL: 0 } as Record<FantasyRole, number>
  for (const p of players) {
    c[normalizeRole(p.type)] += 1
  }
  return c
}

export function countByTeamId(
  players: ApiPlayer[],
): Map<number, number> {
  const m = new Map<number, number>()
  for (const p of players) {
    const tid = p.team?.teamId
    if (tid == null) continue
    m.set(tid, (m.get(tid) ?? 0) + 1)
  }
  return m
}

export type AddBlockReason =
  | 'full'
  | 'team_cap'
  | 'role_max'

/** Normalize player id for Set/Map keys (JSON may use string or number). */
export function playerKey(p: ApiPlayer): string {
  return String(p.id)
}

export function tryAddPlayer(
  p: ApiPlayer,
  selectedIds: Set<string>,
  byId: Map<string, ApiPlayer>,
  match: ApiMatch | null,
): { ok: true } | { ok: false; reason: AddBlockReason } {
  if (selectedIds.has(playerKey(p))) return { ok: true }
  if (selectedIds.size >= SQUAD_SIZE) return { ok: false, reason: 'full' }

  const selected = [...selectedIds].map((id) => byId.get(id)!).filter(Boolean)
  const next = [...selected, p]

  const role = normalizeRole(p.type)
  const roles = countRoles(next)
  if (roles[role] > ROLE_LIMITS[role].max)
    return { ok: false, reason: 'role_max' }

  const tid = p.team?.teamId
  if (tid != null && match?.team1?.teamId != null && match?.team2?.teamId != null) {
    const allowed = new Set([match.team1.teamId, match.team2.teamId])
    if (allowed.has(tid)) {
      const byTeam = countByTeamId(next)
      if ((byTeam.get(tid) ?? 0) > MAX_PLAYERS_PER_SIDE)
        return { ok: false, reason: 'team_cap' }
    }
  }

  return { ok: true }
}

export function validateCompleteSquad(players: ApiPlayer[]): string[] {
  const errors: string[] = []
  if (players.length !== SQUAD_SIZE) {
    errors.push(`Pick exactly ${SQUAD_SIZE} players (currently ${players.length}).`)
    return errors
  }

  const roles = countRoles(players)
    ; (Object.keys(ROLE_LIMITS) as FantasyRole[]).forEach((r) => {
      const { min, max } = ROLE_LIMITS[r]
      const n = roles[r]
      if (n < min)
        errors.push(`Need at least ${min} ${roleLabel(r)} (have ${n}).`)
      if (n > max) errors.push(`At most ${max} ${roleLabel(r)} (have ${n}).`)
    })

  const byTeam = countByTeamId(players)
  for (const [tid, n] of byTeam) {
    if (n > MAX_PLAYERS_PER_SIDE) {
      errors.push(
        `Max ${MAX_PLAYERS_PER_SIDE} players from one real team (team id ${tid}: ${n}).`,
      )
    }
  }

  return errors
}

export type PlayerCategory = 'playing XI' | 'substitutes' | 'bench'

/** Get effective category: use `category` when lineup is announced, else `prevcategory`. null → bench. */
export function getEffectiveCategory(p: ApiPlayer, isAnnounced: boolean): PlayerCategory {
  const raw = isAnnounced ? p.category : p.prevcategory
  if (!raw) return 'bench'
  const lower = raw.toLowerCase().trim()
  if (lower === 'playing xi') return 'playing XI'
  if (lower === 'substitutes') return 'substitutes'
  return 'bench'
}

/** Group players into Playing / Substitutes / Bench buckets. */
export function groupByCategory(
  players: ApiPlayer[],
  isAnnounced: boolean,
): { playing: ApiPlayer[]; substitutes: ApiPlayer[]; bench: ApiPlayer[] } {
  const playing: ApiPlayer[] = []
  const substitutes: ApiPlayer[] = []
  const bench: ApiPlayer[] = []
  for (const p of players) {
    const cat = getEffectiveCategory(p, isAnnounced)
    if (cat === 'playing XI') playing.push(p)
    else if (cat === 'substitutes') substitutes.push(p)
    else bench.push(p)
  }
  return { playing, substitutes, bench }
}

export const RULES_SUMMARY_LINES = [
  `${SQUAD_SIZE} players`,
  `WK ${ROLE_LIMITS.WK.min}–${ROLE_LIMITS.WK.max} · BAT ${ROLE_LIMITS.BAT.min}–${ROLE_LIMITS.BAT.max} · AR ${ROLE_LIMITS.AR.min}–${ROLE_LIMITS.AR.max} · BOWL ${ROLE_LIMITS.BOWL.min}–${ROLE_LIMITS.BOWL.max}`,
  `Max ${MAX_PLAYERS_PER_SIDE} players from one side`,
  'Choose 1 captain (C) and 1 vice-captain (VC) from your XI — different players',
] as const
