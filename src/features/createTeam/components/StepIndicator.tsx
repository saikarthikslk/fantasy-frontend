import { ChevronLeft } from 'lucide-react'
import { getTeamColors } from '@/fantasy/teamColors'

interface StepIndicatorProps {
  step: 1 | 2
  onBack: () => void
  title: string
  subtitle: string
  teamCounts?: { t1: string; t2: string; nTeam1: number; nTeam2: number }
}

function TeamDots({ label, count, max, filledClass }: { label: string; count: number; max: number; filledClass: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider w-8 text-right shrink-0">{label}</span>
      <div className="flex items-center gap-[3px]">
        {Array.from({ length: max }).map((_, i) => (
          <div
            key={i}
            className={`h-[6px] w-[6px] rounded-full transition-all duration-200 ${
              i < count ? filledClass : 'bg-muted-foreground/15'
            } ${i < count ? 'scale-110' : ''}`}
          />
        ))}
      </div>
      <span className={`text-[10px] font-bold tabular-nums ${count >= max ? 'text-destructive' : count > 0 ? 'text-foreground' : 'text-muted-foreground/40'}`}>{count}</span>
    </div>
  )
}

export { TeamDots }

export function StepIndicator({ step, onBack, title, subtitle, teamCounts }: StepIndicatorProps) {
  return (
    <header className="shrink-0 border-b bg-background">
      <div className="flex items-center gap-3 px-4 py-3">
        <button
          onClick={onBack}
          className="flex items-center justify-center h-9 w-9 -ml-1 rounded-full hover:bg-muted transition-colors cursor-pointer shrink-0"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>

        <div className="flex-1 min-w-0">
          <p className="text-base font-semibold truncate">{title}</p>
          <p className="text-[11px] text-muted-foreground truncate">{subtitle}</p>
        </div>

        {teamCounts && (
          <div className="flex flex-col gap-0.5 shrink-0">
            <TeamDots label={teamCounts.t1} count={teamCounts.nTeam1} max={7} filledClass={getTeamColors(teamCounts.t1).dot} />
            <TeamDots label={teamCounts.t2} count={teamCounts.nTeam2} max={7} filledClass={getTeamColors(teamCounts.t2).dot} />
          </div>
        )}

        {!teamCounts && (
          <div className="flex items-center gap-1.5 shrink-0">
            {[1, 2].map((s) => (
              <div
                key={s}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  s === step ? 'w-6 bg-primary' : s < step ? 'w-4 bg-primary/40' : 'w-4 bg-muted'
                }`}
              />
            ))}
            <span className="text-[10px] text-muted-foreground ml-1 tabular-nums">{step}/2</span>
          </div>
        )}
      </div>
    </header>
  )
}
