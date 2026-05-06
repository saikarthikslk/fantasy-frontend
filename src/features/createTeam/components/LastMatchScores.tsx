import { Flame } from 'lucide-react'
import { cn } from '@/lib/utils'
import { getTeamBrandColor } from '@/fantasy/teamColors'
import type { PlayerMatchStat } from '@/types/api'

interface LastMatchScoresProps {
  stats: PlayerMatchStat[] | undefined
  myTeam: string | undefined
  /** 'compact' = labelled mini-card row (player pool); 'inline' = horizontal chip row */
  variant?: 'compact' | 'inline'
}

type Tier = 'hot' | 'good' | 'okay' | 'low' | 'zero'

function tierOf(total: number): Tier {
  if (total >= 80) return 'hot'
  if (total >= 50) return 'good'
  if (total >= 25) return 'okay'
  if (total > 0) return 'low'
  return 'zero'
}

function ptsTone(tier: Tier): string {
  switch (tier) {
    case 'hot':
      return 'text-gold'
    case 'good':
      return 'text-emerald-400'
    case 'okay':
      return 'text-foreground'
    case 'low':
      return 'text-muted-foreground'
    case 'zero':
      return 'text-muted-foreground/40'
  }
}

function chipBg(tier: Tier): string {
  switch (tier) {
    case 'hot':
      return 'border-gold/35 bg-linear-to-b from-gold/15 via-gold/5 to-transparent shadow-sm shadow-gold/15'
    case 'good':
      return 'border-emerald-500/25 bg-linear-to-b from-emerald-500/12 via-emerald-500/3 to-transparent'
    case 'okay':
      return 'border-border/50 bg-card'
    case 'low':
      return 'border-border/40 bg-muted/25'
    case 'zero':
      return 'border-dashed border-border/40 bg-muted/15'
  }
}

function opponentOf(stat: PlayerMatchStat, myTeam: string | undefined): string {
  const t1 = stat.team1 ?? ''
  const t2 = stat.team2 ?? ''
  if (!myTeam) return t2 || t1 || '—'
  return (t1 === myTeam ? t2 : t1) || '—'
}

export function LastMatchScores({ stats, myTeam, variant = 'compact' }: LastMatchScoresProps) {
  if (!stats || stats.length === 0) return null

  // First 3 entries by pos (pos=1 is most recent) — most recent leftmost.
  const last3 = [...stats].sort((a, b) => (a.pos ?? 0) - (b.pos ?? 0)).slice(0, 3)

  if (variant === 'inline') {
    return (
      <span
        className="inline-flex items-center gap-1.5"
        aria-label="Fantasy points in the last 3 matches"
      >
        <span className="text-[8px] font-bold uppercase tracking-widest text-muted-foreground/55 leading-none">
          Last 3
        </span>
        <span className="inline-flex items-center gap-1">
          {last3.map((s, i) => {
            const opp = opponentOf(s, myTeam)
            const teamColor = getTeamBrandColor(opp)
            const total = (s.score ?? 0) + (s.scoregiven ?? 0)
            const tier = tierOf(total)
            return (
              <span
                key={`${s.pos}-${i}`}
                title={`vs ${opp} — ${total} pts`}
                className={cn(
                  'relative inline-flex items-center gap-1 h-[20px] pl-2 pr-1.5 rounded-md border overflow-hidden',
                  chipBg(tier),
                )}
              >
                <span
                  aria-hidden
                  className="absolute left-0 inset-y-0 w-[2px]"
                  style={{ backgroundColor: teamColor }}
                />
                <span className="text-[9px] uppercase tracking-tight text-muted-foreground/85 leading-none">
                  <span className="font-light italic opacity-60 normal-case">vs</span>
                  <span className="font-bold ml-0.5">{opp}</span>
                </span>
                <span
                  className={cn(
                    'text-[11px] font-extrabold tabular-nums leading-none',
                    ptsTone(tier),
                  )}
                >
                  {total}
                </span>
                {tier === 'hot' && (
                  <Flame className="h-2.5 w-2.5 text-gold fill-gold/50 shrink-0" aria-hidden />
                )}
              </span>
            )
          })}
        </span>
      </span>
    )
  }

  // Compact: refined header + row of vibrant mini cards.
  return (
    <div
      className="flex flex-col items-end shrink-0 gap-1.5"
      aria-label="Fantasy points in the last 3 matches"
    >
      <span className="text-[7.5px] font-bold uppercase tracking-[0.14em] text-muted-foreground/60 leading-none">
        Last 3 games
      </span>
      <div className="flex items-stretch gap-1">
        {last3.map((s, i) => {
          const opp = opponentOf(s, myTeam)
          const teamColor = getTeamBrandColor(opp)
          const total = (s.score ?? 0) + (s.scoregiven ?? 0)
          const tier = tierOf(total)
          return (
            <div
              key={`${s.pos}-${i}`}
              title={`vs ${opp} — ${total} pts`}
              className={cn(
                'relative flex flex-col items-center justify-center min-w-[44px] h-[46px] rounded-lg border overflow-hidden',
                chipBg(tier),
              )}
            >
              <span
                aria-hidden
                className="absolute top-0 inset-x-0 h-[2px]"
                style={{ backgroundColor: teamColor }}
              />
              {tier === 'hot' && (
                <Flame
                  className="absolute top-1 right-1 h-2.5 w-2.5 text-gold fill-gold/50"
                  aria-hidden
                />
              )}
              <span
                className={cn(
                  'text-[16px] font-extrabold tabular-nums leading-none tracking-tight',
                  ptsTone(tier),
                )}
              >
                {total}
              </span>
              <span className="mt-1 text-[8px] uppercase tracking-tight leading-none">
                <span className="font-light italic text-muted-foreground/55 normal-case">vs</span>
                <span className="font-bold text-muted-foreground/85 ml-0.5">{opp}</span>
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
