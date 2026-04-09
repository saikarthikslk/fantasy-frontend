/** IPL team selection tint styles keyed by short name */

export type TeamColorStyle = {
  selected: string
  check: string
  dot: string
}

const TEAM_COLOR_MAP: Record<string, TeamColorStyle> = {
  RCB:  { selected: 'border-red-400/30 bg-red-500/8 shadow-sm',    check: 'text-red-500',    dot: 'bg-red-500' },
  DC:   { selected: 'border-sky-400/30 bg-sky-500/8 shadow-sm',    check: 'text-sky-500',    dot: 'bg-sky-500' },
  RR:   { selected: 'border-pink-400/30 bg-pink-500/8 shadow-sm',  check: 'text-pink-500',   dot: 'bg-pink-500' },
  CSK:  { selected: 'border-yellow-400/30 bg-yellow-500/8 shadow-sm', check: 'text-yellow-500', dot: 'bg-yellow-500' },
  SRH:  { selected: 'border-orange-400/30 bg-orange-500/8 shadow-sm', check: 'text-orange-500', dot: 'bg-orange-500' },
  LSG:  { selected: 'border-cyan-400/30 bg-cyan-500/8 shadow-sm',  check: 'text-cyan-500',   dot: 'bg-cyan-500' },
  GT:   { selected: 'border-violet-400/30 bg-violet-500/8 shadow-sm', check: 'text-violet-500', dot: 'bg-violet-500' },
  MI:   { selected: 'border-blue-400/30 bg-blue-500/8 shadow-sm',  check: 'text-blue-500',   dot: 'bg-blue-500' },
  PBKS: { selected: 'border-slate-300/30 bg-slate-400/8 shadow-sm', check: 'text-slate-400',  dot: 'bg-slate-400' },
  KKR:  { selected: 'border-amber-400/30 bg-amber-500/8 shadow-sm', check: 'text-amber-500',  dot: 'bg-amber-500' },
}

const FALLBACK: TeamColorStyle = {
  selected: 'border-primary/20 bg-primary/5 shadow-sm',
  check: 'text-primary',
  dot: 'bg-primary',
}

/** Resolve team color styles from a short name like "RCB", "CSK", etc. */
export function getTeamColors(teamShortName: string | undefined | null): TeamColorStyle {
  if (!teamShortName) return FALLBACK
  return TEAM_COLOR_MAP[teamShortName.toUpperCase()] ?? FALLBACK
}
