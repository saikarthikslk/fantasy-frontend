import { useId } from 'react'
import { cn } from '@/lib/utils'
import type { PlayerMatchStat } from '@/types/api'

interface LastMatchScoresProps {
  stats: PlayerMatchStat[] | undefined
  myTeam: string | undefined
  /** 'compact' = sparkline card (player pool, unselected); 'inline' = trend pill (selected / captain) */
  variant?: 'compact' | 'inline'
}

type Form = 'hot' | 'up' | 'cold' | 'steady'

interface Point {
  opp: string
  total: number
}

const FORM_LINE_COLOR: Record<Form, string> = {
  hot: 'oklch(0.85 0.18 85)',
  up: 'oklch(0.78 0.17 145)',
  cold: 'oklch(0.7 0.18 25)',
  steady: 'oklch(0.6 0 0)',
}

const FORM_LAST_FILL: Record<Form, string> = {
  hot: 'oklch(0.85 0.18 85)',
  up: 'oklch(0.78 0.17 145)',
  cold: 'oklch(0.7 0.18 25)',
  steady: 'oklch(0.85 0 0)',
}

const FORM_TONE: Record<Form, string> = {
  hot: 'text-gold',
  up: 'text-emerald-400',
  cold: 'text-rose-400',
  steady: 'text-muted-foreground',
}

const FORM_ARROW: Record<Form, string> = {
  hot: '▲',
  up: '▲',
  cold: '▼',
  steady: '→',
}

const FORM_LABEL: Record<Form, string> = {
  hot: 'Hot Form',
  up: 'Up',
  cold: 'Cold',
  steady: 'Steady',
}

interface SizeSpec {
  w: number
  h: number
  padX: number
  yTop: number
  yBottom: number
  numbersY: number
  labelsY: number | null
  dotR: number
  dotRLast: number
  lineWidth: number
  numFont: number
  labelFont: number
}

const SM: SizeSpec = {
  w: 140,
  h: 60,
  padX: 8,
  yTop: 4,
  yBottom: 30,
  numbersY: 41,
  labelsY: 53,
  dotR: 2.3,
  dotRLast: 3.2,
  lineWidth: 1.6,
  numFont: 9,
  labelFont: 7,
}

const LG: SizeSpec = {
  w: 224,
  h: 68,
  padX: 12,
  yTop: 8,
  yBottom: 42,
  numbersY: 54,
  labelsY: 63,
  dotR: 2.6,
  dotRLast: 3.6,
  lineWidth: 1.8,
  numFont: 9.5,
  labelFont: 7.5,
}

function opponentOf(stat: PlayerMatchStat, myTeam: string | undefined): string {
  const t1 = stat.team1 ?? ''
  const t2 = stat.team2 ?? ''
  if (!myTeam) return t2 || t1 || '—'
  return (t1 === myTeam ? t2 : t1) || '—'
}

function buildPoints(stats: PlayerMatchStat[], myTeam: string | undefined): Point[] {
  // pos: lower = older, higher = more recent (per PlayerMatchStat type).
  // Take 5 highest-pos rows = 5 most recent, in ascending order so timeline reads oldest → newest L-to-R.
  return [...stats]
    .reverse()
    .slice(-5)
    .map((s) => ({
      opp: opponentOf(s, myTeam),
      total: (s.score ?? 0) + (s.scoregiven ?? 0),
    }))
}

function classifyForm(values: number[]): Form {
  if (values.length < 2) return 'steady'
  const first = values[0]
  const last = values[values.length - 1]
  const avg = values.reduce((a, b) => a + b, 0) / values.length
  if (avg >= 60 && last >= avg) return 'hot'
  if (last - first >= 15) return 'up'
  if (first - last >= 15) return 'cold'
  return 'steady'
}

function computePositions(values: number[], spec: SizeSpec): { x: number; y: number }[] {
  const plotW = spec.w - 2 * spec.padX
  const plotH = spec.yBottom - spec.yTop
  const max = Math.max(...values)
  const min = Math.min(...values)
  const range = max - min || 1
  const flat = range === 1 && max === min
  return values.map((v, i) => {
    const x =
      values.length === 1 ? spec.w / 2 : spec.padX + (i / (values.length - 1)) * plotW
    const y = flat ? (spec.yTop + spec.yBottom) / 2 : spec.yBottom - ((v - min) / range) * plotH
    return { x, y }
  })
}

function buildLinePath(positions: { x: number; y: number }[]): string {
  if (positions.length < 2) return ''
  return positions.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x},${p.y}`).join(' ')
}

interface SparklineCardProps {
  points: Point[]
  values: number[]
  form: Form
  spec: SizeSpec
  gradientId: string
}

function SparklineCard({ points, values, form, spec, gradientId }: SparklineCardProps) {
  const positions = computePositions(values, spec)
  const linePath = buildLinePath(positions)
  const areaPath =
    linePath && positions.length >= 2
      ? `${linePath} L ${positions[positions.length - 1].x},${spec.yBottom} L ${positions[0].x},${spec.yBottom} Z`
      : ''
  const lineColor = FORM_LINE_COLOR[form]

  return (
    <svg
      viewBox={`0 0 ${spec.w} ${spec.h}`}
      width="100%"
      height="100%"
      className="block"
      aria-hidden
    >
      <defs>
        <linearGradient id={gradientId} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={lineColor} stopOpacity="0.42" />
          <stop offset="100%" stopColor={lineColor} stopOpacity="0" />
        </linearGradient>
      </defs>
      {areaPath && <path d={areaPath} fill={`url(#${gradientId})`} />}
      {linePath && (
        <path
          d={linePath}
          stroke={lineColor}
          strokeWidth={spec.lineWidth}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}
      {positions.map((pos, i) => {
        const isLast = i === positions.length - 1
        return (
          <circle
            key={i}
            cx={pos.x}
            cy={pos.y}
            r={isLast ? spec.dotRLast : spec.dotR}
            fill={lineColor}
            stroke="oklch(0.07 0 0)"
            strokeWidth={isLast ? 0 : 1.2}
          >
            <title>{`vs ${points[i].opp} — ${points[i].total} pts`}</title>
          </circle>
        )
      })}
      <g
        fontFamily="Inter, system-ui"
        fontWeight={800}
        fontSize={spec.numFont}
        style={{ fontVariantNumeric: 'tabular-nums' }}
      >
        {positions.map((pos, i) => {
          const isLast = i === positions.length - 1
          return (
            <text
              key={i}
              x={pos.x}
              y={spec.numbersY}
              textAnchor="middle"
              fill={isLast ? FORM_LAST_FILL[form] : 'oklch(0.7 0 0)'}
            >
              {points[i].total}
            </text>
          )
        })}
      </g>
      {spec.labelsY !== null && positions.length >= 2 && (
        <g
          fontFamily="Inter, system-ui"
          fontWeight={700}
          fontSize={spec.labelFont}
          letterSpacing={0.5}
        >
          <text x={positions[0].x} y={spec.labelsY} textAnchor="middle" fill="oklch(0.42 0 0)">
            vs {points[0].opp}
          </text>
          <text
            x={positions[positions.length - 1].x}
            y={spec.labelsY}
            textAnchor="middle"
            fill="oklch(0.42 0 0)"
          >
            vs {points[points.length - 1].opp}
          </text>
        </g>
      )}
    </svg>
  )
}

export function LastMatchScores({ stats, myTeam, variant = 'compact' }: LastMatchScoresProps) {
  const baseId = useId()
  if (!stats || stats.length === 0) return null
  const points = buildPoints(stats, myTeam)
  if (points.length === 0) return null
  const values = points.map((p) => p.total)
  const form = classifyForm(values)
  const last = points[points.length - 1]
  const avg = Math.round(values.reduce((a, b) => a + b, 0) / values.length)

  if (variant === 'inline') {
    const w = 56
    const h = 14
    const positions = computePositions(values, {
      w,
      h,
      padX: 4,
      yTop: 2,
      yBottom: 12,
      numbersY: 0,
      labelsY: null,
      dotR: 1.6,
      dotRLast: 2,
      lineWidth: 1.4,
      numFont: 0,
      labelFont: 0,
    })
    const linePath = buildLinePath(positions)
    const lineColor = FORM_LINE_COLOR[form]

    return (
      <span
        className="inline-flex items-center gap-1.5 h-[22px] pl-2 pr-2.5 rounded-full bg-card/60 border border-border/60"
        title={`${FORM_LABEL[form]} · vs ${last.opp} — ${last.total} pts`}
        aria-label={`Last ${points.length} matches, ${FORM_LABEL[form]}, latest ${last.total} points vs ${last.opp}`}
      >
        <svg
          width={w}
          height={h}
          viewBox={`0 0 ${w} ${h}`}
          className="block shrink-0"
          aria-hidden
        >
          {linePath && (
            <path
              d={linePath}
              stroke={lineColor}
              strokeWidth={1.4}
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}
          {positions.map((pos, i) => {
            const isLast = i === positions.length - 1
            return (
              <circle
                key={i}
                cx={pos.x}
                cy={pos.y}
                r={isLast ? 2 : 1.6}
                fill={lineColor}
              />
            )
          })}
        </svg>
        <span
          className={cn(
            'text-[11px] font-extrabold tabular-nums leading-none -tracking-[0.02em]',
            FORM_TONE[form],
          )}
        >
          {FORM_ARROW[form]} {last.total}
        </span>
        <span className="text-[8px] font-bold uppercase tracking-wider leading-none text-muted-foreground/70">
          vs {last.opp}
        </span>
      </span>
    )
  }

  // ===== Compact: responsive sparkline card =====
  return (
    <div
      className="flex flex-col items-end shrink-0 gap-1 sm:gap-1.5"
      aria-label={`Fantasy points in last ${points.length} matches, ${FORM_LABEL[form]}`}
    >
      <span className="inline-flex items-baseline gap-1 px-1 text-[8.5px] font-bold uppercase tracking-[0.14em] leading-none text-muted-foreground/65">
        <span className={cn('text-[10px] leading-none', FORM_TONE[form])}>{FORM_ARROW[form]}</span>
        Last {points.length}
        <span className="text-muted-foreground/35">·</span>
        <span className={cn('tabular-nums', FORM_TONE[form])}>{avg}</span>
        <span className="text-muted-foreground/55">avg pts</span>
      </span>
      {/* Mobile */}
      <div className="block sm:hidden px-1 relative w-[160px] h-[60px] rounded-lg border border-border/60 bg-linear-to-b from-card to-background overflow-hidden">
        <SparklineCard
          points={points}
          values={values}
          form={form}
          spec={SM}
          gradientId={`${baseId}-sm`}
        />
      </div>
      {/* Desktop */}
      <div className="hidden px-1 sm:block relative w-[240px] h-[68px] rounded-xl border border-border/60 bg-linear-to-b from-card to-background overflow-hidden">
        <SparklineCard
          points={points}
          values={values}
          form={form}
          spec={LG}
          gradientId={`${baseId}-lg`}
        />
      </div>
    </div>
  )
}
