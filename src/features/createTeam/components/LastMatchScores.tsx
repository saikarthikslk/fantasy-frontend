import { cn } from '@/lib/utils'
import type { PlayerMatchStat } from '@/types/api'
import {
  Sparkline,
  SPARKLINE_SIZE_SM,
  SPARKLINE_SIZE_LG,
  SPARKLINE_SIZE_INLINE,
  type SparklinePoint,
  type SparklineForm,
} from '@/components/ui/Sparkline'

interface LastMatchScoresProps {
  stats: PlayerMatchStat[] | undefined
  myTeam: string | undefined
  /** 'compact' = sparkline card (player pool, unselected); 'inline' = trend pill (selected / captain) */
  variant?: 'compact' | 'inline'
}

const FORM_TONE: Record<SparklineForm, string> = {
  hot: 'text-gold',
  up: 'text-emerald-400',
  cold: 'text-rose-400',
  steady: 'text-muted-foreground',
}

const FORM_ARROW: Record<SparklineForm, string> = {
  hot: '▲', up: '▲', cold: '▼', steady: '→',
}

const FORM_LABEL: Record<SparklineForm, string> = {
  hot: 'Hot Form', up: 'Up', cold: 'Cold', steady: 'Steady',
}

function opponentOf(stat: PlayerMatchStat, myTeam: string | undefined): string {
  const t1 = stat.team1 ?? ''
  const t2 = stat.team2 ?? ''
  if (!myTeam) return t2 || t1 || '—'
  return (t1 === myTeam ? t2 : t1) || '—'
}

function buildPoints(stats: PlayerMatchStat[], myTeam: string | undefined): SparklinePoint[] {
  return [...stats]
    .reverse()
    .slice(-5)
    .map((s) => ({
      opp: opponentOf(s, myTeam),
      total: (s.score ?? 0) + (s.scoregiven ?? 0),
    }))
}

function classifyForm(values: number[]): SparklineForm {
  if (values.length < 2) return 'steady'
  const first = values[0]
  const last = values[values.length - 1]
  const avg = values.reduce((a, b) => a + b, 0) / values.length
  if (avg >= 60 && last >= avg) return 'hot'
  if (last - first >= 15) return 'up'
  if (first - last >= 15) return 'cold'
  return 'steady'
}

export function LastMatchScores({ stats, myTeam, variant = 'compact' }: LastMatchScoresProps) {
  if (!stats || stats.length === 0) return null
  const points = buildPoints(stats, myTeam)
  if (points.length === 0) return null
  const values = points.map((p) => p.total)
  const form = classifyForm(values)
  const last = points[points.length - 1]
  const avg = Math.round(values.reduce((a, b) => a + b, 0) / values.length)

  if (variant === 'inline') {
    return (
      <span
        className="inline-flex items-center gap-1.5 h-[22px] pl-2 pr-2.5 rounded-full bg-card/60 border border-border/60"
        title={`${FORM_LABEL[form]} · vs ${last.opp} — ${last.total} pts`}
        aria-label={`Last ${points.length} matches, ${FORM_LABEL[form]}, latest ${last.total} points vs ${last.opp}`}
      >
        <span className="block shrink-0" style={{ width: 56, height: 14 }}>
          <Sparkline
            points={points}
            form={form}
            size={SPARKLINE_SIZE_INLINE}
            fillArea={false}
            showNumbers={false}
            showOppLabels={false}
          />
        </span>
        <span className={cn('text-[11px] font-extrabold tabular-nums leading-none -tracking-[0.02em]', FORM_TONE[form])}>
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
        <Sparkline points={points} form={form} size={SPARKLINE_SIZE_SM} />
      </div>
      {/* Desktop */}
      <div className="hidden px-1 sm:block relative w-[240px] h-[68px] rounded-xl border border-border/60 bg-linear-to-b from-card to-background overflow-hidden">
        <Sparkline points={points} form={form} size={SPARKLINE_SIZE_LG} />
      </div>
    </div>
  )
}
