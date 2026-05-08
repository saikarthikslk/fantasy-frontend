import { useId } from 'react'

export type SparklineForm = 'hot' | 'up' | 'cold' | 'steady'

const FORM_LINE_COLOR: Record<SparklineForm, string> = {
  hot: 'oklch(0.85 0.18 85)',
  up: 'oklch(0.78 0.17 145)',
  cold: 'oklch(0.7 0.18 25)',
  steady: 'oklch(0.6 0 0)',
}

const FORM_LAST_FILL: Record<SparklineForm, string> = {
  hot: 'oklch(0.85 0.18 85)',
  up: 'oklch(0.78 0.17 145)',
  cold: 'oklch(0.7 0.18 25)',
  steady: 'oklch(0.85 0 0)',
}

export interface SparklinePoint {
  opp: string
  total: number
}

export interface SparklineSize {
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

// eslint-disable-next-line react-refresh/only-export-components
export const SPARKLINE_SIZE_SM: SparklineSize = {
  w: 140, h: 60, padX: 8, yTop: 4, yBottom: 30,
  numbersY: 41, labelsY: 53, dotR: 2.3, dotRLast: 3.2,
  lineWidth: 1.6, numFont: 9, labelFont: 7,
}

// eslint-disable-next-line react-refresh/only-export-components
export const SPARKLINE_SIZE_LG: SparklineSize = {
  w: 224, h: 68, padX: 12, yTop: 8, yBottom: 42,
  numbersY: 54, labelsY: 63, dotR: 2.6, dotRLast: 3.6,
  lineWidth: 1.8, numFont: 9.5, labelFont: 7.5,
}

// eslint-disable-next-line react-refresh/only-export-components
export const SPARKLINE_SIZE_SHEET: SparklineSize = {
  w: 280, h: 56, padX: 14, yTop: 6, yBottom: 36,
  numbersY: 47, labelsY: 54, dotR: 2.8, dotRLast: 3.6,
  lineWidth: 2, numFont: 10, labelFont: 7.5,
}

// eslint-disable-next-line react-refresh/only-export-components
export const SPARKLINE_SIZE_INLINE: SparklineSize = {
  w: 56, h: 14, padX: 4, yTop: 2, yBottom: 12,
  numbersY: 0, labelsY: null, dotR: 1.6, dotRLast: 2,
  lineWidth: 1.4, numFont: 0, labelFont: 0,
}

function computePositions(values: number[], spec: SparklineSize): { x: number; y: number }[] {
  const plotW = spec.w - 2 * spec.padX
  const plotH = spec.yBottom - spec.yTop
  const max = Math.max(...values)
  const min = Math.min(...values)
  const range = max - min || 1
  const flat = range === 1 && max === min
  return values.map((v, i) => {
    const x = values.length === 1 ? spec.w / 2 : spec.padX + (i / (values.length - 1)) * plotW
    const y = flat ? (spec.yTop + spec.yBottom) / 2 : spec.yBottom - ((v - min) / range) * plotH
    return { x, y }
  })
}

function buildLinePath(positions: { x: number; y: number }[]): string {
  if (positions.length < 2) return ''
  return positions.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x},${p.y}`).join(' ')
}

interface Props {
  points: SparklinePoint[]
  form: SparklineForm
  size: SparklineSize
  /** When true, fill area under line. Default: true. Set false for tiny inline variant. */
  fillArea?: boolean
  /** When true, render numeric labels above each point. Default: true. Set false for inline. */
  showNumbers?: boolean
  /** When true, render opponent labels at first/last points. Default: true. */
  showOppLabels?: boolean
}

export function Sparkline({
  points, form, size,
  fillArea = true, showNumbers = true, showOppLabels = true,
}: Props) {
  const baseId = useId()
  const gradientId = `${baseId}-grad`
  const values = points.map((p) => p.total)
  const positions = computePositions(values, size)
  const linePath = buildLinePath(positions)
  const areaPath =
    linePath && positions.length >= 2 && fillArea
      ? `${linePath} L ${positions[positions.length - 1].x},${size.yBottom} L ${positions[0].x},${size.yBottom} Z`
      : ''
  const lineColor = FORM_LINE_COLOR[form]

  return (
    <svg
      viewBox={`0 0 ${size.w} ${size.h}`}
      width="100%"
      height="100%"
      className="block"
      aria-hidden
    >
      {areaPath && (
        <>
          <defs>
            <linearGradient id={gradientId} x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor={lineColor} stopOpacity="0.42" />
              <stop offset="100%" stopColor={lineColor} stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d={areaPath} fill={`url(#${gradientId})`} />
        </>
      )}
      {linePath && (
        <path
          d={linePath}
          stroke={lineColor}
          strokeWidth={size.lineWidth}
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
            r={isLast ? size.dotRLast : size.dotR}
            fill={lineColor}
            stroke={fillArea ? 'oklch(0.07 0 0)' : 'none'}
            strokeWidth={isLast || !fillArea ? 0 : 1.2}
          >
            <title>{`vs ${points[i].opp} — ${points[i].total} pts`}</title>
          </circle>
        )
      })}
      {showNumbers && (
        <g
          fontFamily="Inter, system-ui"
          fontWeight={800}
          fontSize={size.numFont}
          style={{ fontVariantNumeric: 'tabular-nums' }}
        >
          {positions.map((pos, i) => {
            const isLast = i === positions.length - 1
            return (
              <text
                key={i}
                x={pos.x}
                y={size.numbersY}
                textAnchor="middle"
                fill={isLast ? FORM_LAST_FILL[form] : 'oklch(0.7 0 0)'}
              >
                {points[i].total}
              </text>
            )
          })}
        </g>
      )}
      {showOppLabels && size.labelsY !== null && positions.length >= 2 && (
        <g
          fontFamily="Inter, system-ui"
          fontWeight={700}
          fontSize={size.labelFont}
          letterSpacing={0.5}
        >
          <text x={positions[0].x} y={size.labelsY} textAnchor="middle" fill="oklch(0.42 0 0)">
            vs {points[0].opp}
          </text>
          <text
            x={positions[positions.length - 1].x}
            y={size.labelsY}
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
