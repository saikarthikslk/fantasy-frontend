/** IPL team selection tint styles keyed by short name */

export type TeamColorStyle = {
  selected: string
  check: string
  dot: string
  /** Raw hex accent used for inline gradients / text tints on dark surfaces. */
  accent: string
  /** Lighter variant suitable for body text on dark backgrounds. */
  ink: string
}

const TEAM_COLOR_MAP: Record<string, TeamColorStyle> = {
  RCB:  { selected: 'border-red-400/30 bg-red-500/8 shadow-sm',    check: 'text-red-500',    dot: 'bg-red-500',    accent: '#EF4444', ink: '#FCA5A5' },
  DC:   { selected: 'border-sky-400/30 bg-sky-500/8 shadow-sm',    check: 'text-sky-500',    dot: 'bg-sky-500',    accent: '#0EA5E9', ink: '#7DD3FC' },
  RR:   { selected: 'border-pink-400/30 bg-pink-500/8 shadow-sm',  check: 'text-pink-500',   dot: 'bg-pink-500',   accent: '#EC4899', ink: '#F9A8D4' },
  CSK:  { selected: 'border-yellow-400/30 bg-yellow-500/8 shadow-sm', check: 'text-yellow-500', dot: 'bg-yellow-500', accent: '#EAB308', ink: '#FCD34D' },
  SRH:  { selected: 'border-orange-400/30 bg-orange-500/8 shadow-sm', check: 'text-orange-500', dot: 'bg-orange-500', accent: '#F97316', ink: '#FDBA74' },
  LSG:  { selected: 'border-cyan-400/30 bg-cyan-500/8 shadow-sm',  check: 'text-cyan-500',   dot: 'bg-cyan-500',   accent: '#06B6D4', ink: '#67E8F9' },
  GT:   { selected: 'border-violet-400/30 bg-violet-500/8 shadow-sm', check: 'text-violet-500', dot: 'bg-violet-500', accent: '#8B5CF6', ink: '#C4B5FD' },
  MI:   { selected: 'border-blue-400/30 bg-blue-500/8 shadow-sm',  check: 'text-blue-500',   dot: 'bg-blue-500',   accent: '#3B82F6', ink: '#93C5FD' },
  PBKS: { selected: 'border-slate-300/30 bg-slate-400/8 shadow-sm', check: 'text-slate-400',  dot: 'bg-slate-400',  accent: '#94A3B8', ink: '#CBD5E1' },
  KKR:  { selected: 'border-amber-400/30 bg-amber-500/8 shadow-sm', check: 'text-amber-500',  dot: 'bg-amber-500',  accent: '#F59E0B', ink: '#FCD34D' },
}

const FALLBACK: TeamColorStyle = {
  selected: 'border-primary/20 bg-primary/5 shadow-sm',
  check: 'text-primary',
  dot: 'bg-primary',
  accent: '#71717A',
  ink: '#A1A1AA',
}

/** Resolve team color styles from a short name like "RCB", "CSK", etc. */
export function getTeamColors(teamShortName: string | undefined | null): TeamColorStyle {
  if (!teamShortName) return FALLBACK
  return TEAM_COLOR_MAP[teamShortName.toUpperCase()] ?? FALLBACK
}

/**
 * Build a subtle dual-team tint for a fixture card / row.
 * - `bg`: horizontal gradient from team1 → neutral → team2
 * - `borderLeft` / `borderRight`: thin team-coloured accents on each edge
 */
export function fixtureTint(
  t1ShortName: string | undefined | null,
  t2ShortName: string | undefined | null,
  opts: { intensity?: 'subtle' | 'medium' } = {},
): { background: string } {
  const c1 = getTeamColors(t1ShortName)
  const c2 = getTeamColors(t2ShortName)
  const [edge, fade] = opts.intensity === 'medium' ? ['2A', '10'] : ['1F', '08']
  return {
    background: `linear-gradient(90deg, ${c1.accent}${edge} 0%, ${c1.accent}${fade} 25%, transparent 45%, transparent 55%, ${c2.accent}${fade} 75%, ${c2.accent}${edge} 100%)`,
  }
}

/**
 * Build a subtle single-team tint — a faint side-faded gradient plus a
 * coloured left-edge accent. Ideal for player rows where the player belongs
 * to exactly one team.
 */
export function playerTint(
  teamShortName: string | undefined | null,
  opts: { intensity?: 'subtle' | 'medium' } = {},
): { background: string } {
  const c = getTeamColors(teamShortName)
  const [edge, fade] = opts.intensity === 'medium' ? ['24', '0C'] : ['18', '06']
  return {
    background: `linear-gradient(90deg, ${c.accent}${edge} 0%, ${c.accent}${fade} 40%, transparent 100%)`,
  }
}
