import { withOpacity, adjustForDarkBackground, getContrastText } from './colorUtils'

/** Official IPL team brand colors */
export const TEAM_COLORS = {
  RCB:  '#cd0d13',
  DC:   '#06245F',
  CSK:  '#FECA05',
  MI:   '#1535C1',
  SRH:  '#EF4024',
  PBKS: '#D8D8D8',
  KKR:  '#3A235D',
  RR:   '#E50493',
  LSG:  '#F22B3F',
  GT:   '#263B5A',
} as const

export type TeamShortName = keyof typeof TEAM_COLORS

export type TeamColorStyle = {
  selected: string
  check: string
  dot: string
  accent: string
  ink: string
}

const FALLBACK_COLOR = '#71717A'

/** Get the brand color hex for a team */
export function getTeamBrandColor(teamShortName: string | undefined | null): string {
  if (!teamShortName) return FALLBACK_COLOR
  return TEAM_COLORS[teamShortName.toUpperCase() as TeamShortName] ?? FALLBACK_COLOR
}

/** Legacy: Get team color styles (using specific helpers) */
export function getTeamColors(teamShortName: string | undefined | null): TeamColorStyle {
  const color = getTeamBrandColor(teamShortName)
  return {
    selected: 'shadow-sm',
    check: '',
    dot: '',
    accent: color,
    ink: adjustForDarkBackground(color),
  }
}

/** Get chip styles with auto-calculated text contrast */
export function getTeamChipStyles(teamShortName: string | undefined | null) {
  const bg = getTeamBrandColor(teamShortName)
  return {
    backgroundColor: bg,
    color: getContrastText(bg),
  }
}

/** Get selected card styles with team color and opacity */
export function getTeamSelectedStyles(teamShortName: string | undefined | null) {
  const color = getTeamBrandColor(teamShortName)
  return {
    borderColor: withOpacity(color, 0.3),
    backgroundColor: withOpacity(color, 0.08),
  }
}

/** Get check icon color */
export const getTeamCheckColor = (teamShortName: string | undefined | null) =>
  getTeamBrandColor(teamShortName)

/** Get dot/indicator background style */
export const getTeamDotStyle = (teamShortName: string | undefined | null) => ({
  backgroundColor: getTeamBrandColor(teamShortName),
})

/** Build dual-team gradient for fixture cards */
export function fixtureTint(
  t1: string | undefined | null,
  t2: string | undefined | null,
  opts: { intensity?: 'subtle' | 'medium' } = {},
) {
  const c1 = getTeamBrandColor(t1)
  const c2 = getTeamBrandColor(t2)
  const [edge, fade] = opts.intensity === 'medium' ? ['2A', '10'] : ['1F', '08']

  return {
    background: `linear-gradient(90deg, ${c1}${edge} 0%, ${c1}${fade} 25%, transparent 45%, transparent 55%, ${c2}${fade} 75%, ${c2}${edge} 100%)`,
  }
}

/** Build single-team gradient for player rows */
export function playerTint(
  team: string | undefined | null,
  opts: { intensity?: 'subtle' | 'medium' } = {},
) {
  const color = getTeamBrandColor(team)
  const [edge, fade] = opts.intensity === 'medium' ? ['24', '0C'] : ['18', '06']

  return {
    background: `linear-gradient(90deg, ${color}${edge} 0%, ${color}${fade} 40%, transparent 100%)`,
  }
}
