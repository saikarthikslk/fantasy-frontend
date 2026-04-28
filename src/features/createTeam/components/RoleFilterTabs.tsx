import { roleLabel, type FantasyRole } from '@/fantasy/dream11Rules'

const TABS: Array<'ALL' | FantasyRole> = ['WK', 'BAT', 'AR', 'BOWL', 'ALL']

interface RoleFilterTabsProps {
  active: 'ALL' | FantasyRole
  roleCounts: Record<FantasyRole, number>
  onChange: (tab: 'ALL' | FantasyRole) => void
  showClearAll: boolean
  onClearAll: () => void
}

export function RoleFilterTabs({ active, roleCounts, onChange, showClearAll, onClearAll }: RoleFilterTabsProps) {
  const activeIndex = TABS.indexOf(active)

  return (
    <div className="shrink-0 border-b overflow-x-auto">
      <div className="flex items-center">
        {/* Role tabs with sliding underline indicator */}
        <div className="relative flex flex-1 min-w-0">
          {TABS.map((tab) => {
            const isActive = active === tab
            const count = tab === 'ALL' ? null : roleCounts[tab]
            return (
              <button
                key={tab}
                type="button"
                onClick={() => onChange(tab)}
                className="relative flex-1 flex items-center justify-center gap-1 sm:gap-1.5 px-2 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm font-medium transition-colors cursor-pointer whitespace-nowrap"
              >
                <span className={isActive ? 'text-foreground' : 'text-muted-foreground'}>
                  {tab === 'ALL' ? 'All' : roleLabel(tab)}
                </span>
                {count != null && count > 0 && (
                  <span className={`text-[9px] sm:text-[10px] tabular-nums ${isActive ? 'text-foreground/60' : 'text-muted-foreground/60'}`}>
                    {count}
                  </span>
                )}
              </button>
            )
          })}

          {/* Sliding underline */}
          <span
            className="absolute bottom-0 h-0.5 bg-foreground transition-all duration-300 ease-out"
            style={{
              left: `${(activeIndex / TABS.length) * 100}%`,
              width: `${100 / TABS.length}%`
            }}
          />
        </div>

        {/* Clear All button */}
        {showClearAll && (
          <>
            <div className="w-px h-4 sm:h-5 bg-border shrink-0 mx-1 sm:mx-2" />
            <button
              type="button"
              onClick={onClearAll}
              className="px-2 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm font-medium text-destructive hover:text-destructive/80 transition-colors cursor-pointer whitespace-nowrap"
            >
              Clear
            </button>
          </>
        )}
      </div>
    </div>
  )
}
