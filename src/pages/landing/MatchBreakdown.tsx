import type { CSSProperties } from 'react'
import { Sparkles } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { playerImageUrl } from '@/api/client'
import { getTeamColors, fixtureTint } from '@/fantasy/teamColors'
import type { OverallLeaderboardStat } from '@/types/api'

/** Per-match score breakdown shown when a standings row is expanded. */
export function MatchBreakdown({ stats }: { stats: OverallLeaderboardStat[] }) {
  const sorted = [...stats].sort((a, b) => b.timestamp - a.timestamp)
  return (
    <div className="bg-muted/30 px-4 sm:px-6 py-3">
      <div className="grid grid-cols-[1fr_auto_auto_auto] text-[11px] font-medium text-muted-foreground mb-1.5 gap-x-3 px-2">
        <span>Fixture</span>
        <span></span>
        <span className="text-center">Rank</span>
        <span className="text-right">Pts</span>
      </div>
      <div className="space-y-1">
        {sorted.map((s) => {
          const c1 = getTeamColors(s.t1.teamSName)
          const c2 = getTeamColors(s.t2.teamSName)
          const rowStyle: CSSProperties = fixtureTint(s.t1.teamSName, s.t2.teamSName)
          return (
            <div
              key={s.matchid}
              className="grid grid-cols-[1fr_auto_auto_auto] items-center text-xs py-2 px-2 gap-x-3 rounded-md transition-all hover:brightness-125"
              style={rowStyle}
            >
              <div className="flex items-center gap-1.5 min-w-0">
                <img
                  src={playerImageUrl(s.t1.imageId!)}
                  alt=""
                  className="h-5 w-5 rounded-full shrink-0 ring-1"
                  style={{ boxShadow: `0 0 0 1px ${c1.accent}80` }}
                  onError={(e) => {
                    ;(e.target as HTMLImageElement).style.display = 'none'
                  }}
                />
                <span className="truncate min-w-0 font-semibold tracking-wide" style={{ color: c1.ink }}>
                  {s.t1.teamSName}
                </span>
                <span className="text-muted-foreground/70 shrink-0 text-[10px]">vs</span>
                <img
                  src={playerImageUrl(s.t2.imageId!)}
                  alt=""
                  className="h-5 w-5 rounded-full shrink-0"
                  style={{ boxShadow: `0 0 0 1px ${c2.accent}80` }}
                  onError={(e) => {
                    ;(e.target as HTMLImageElement).style.display = 'none'
                  }}
                />
                <span className="truncate min-w-0 font-semibold tracking-wide" style={{ color: c2.ink }}>
                  {s.t2.teamSName}
                </span>
              </div>
              <div className="shrink-0">
                {s.isauto && (
                  <TooltipProvider delayDuration={0}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="inline-flex items-center gap-1 rounded-md border border-amber-500/20 bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-medium text-amber-400">
                          <Sparkles className="h-2.5 w-2.5" />
                          Smart XI
                        </span>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="max-w-60 text-center">
                        Auto-selected lineup — score reflects a 10% deduction.
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </div>
              <span className="text-center text-muted-foreground shrink-0 tabular-nums">#{s.position}</span>
              <span className="text-right font-semibold tabular-nums shrink-0">{s.points.toFixed(1)}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
