import { useMemo } from 'react'
import type { ApiPlayer } from '@/types/api'
import {
  groupByCategory,
  normalizeRole,
  roleLabel,
  type FantasyRole,
} from '@/fantasy/dream11Rules'
import { CircleCheck, ArrowLeftRight, CircleMinus } from 'lucide-react'

interface PlayerPoolProps {
  players: ApiPlayer[]
  roleFilter: 'ALL' | FantasyRole
  isAnnounced: boolean
  renderCard: (p: ApiPlayer) => React.ReactNode
  /** Tailwind grid classes for the card grid. Defaults to single column. */
  gridClass?: string
}

const CATEGORY_CONFIG = {
  playing: {
    label: 'Playing XI',
    icon: CircleCheck,
    badgeBg: 'bg-emerald-500/15',
    badgeText: 'text-emerald-500',
  },
  substitutes: {
    label: 'Substitutes',
    icon: ArrowLeftRight,
    badgeBg: 'bg-amber-500/15',
    badgeText: 'text-amber-500',
  },
  bench: {
    label: 'Bench',
    icon: CircleMinus,
    badgeBg: 'bg-muted',
    badgeText: 'text-muted-foreground',
  },
} as const

const ROLE_ORDER: FantasyRole[] = ['WK', 'BAT', 'AR', 'BOWL']

const ROLE_NAME: Record<FantasyRole, string> = {
  WK: 'Wicket-Keepers',
  BAT: 'Batters',
  AR: 'All-Rounders',
  BOWL: 'Bowlers',
}

function CategoryBlock({
  list,
  variant,
  renderCard,
  gridClass,
}: {
  list: ApiPlayer[]
  variant: keyof typeof CATEGORY_CONFIG
  renderCard: (p: ApiPlayer) => React.ReactNode
  gridClass: string
}) {
  if (list.length === 0) return null
  const cfg = CATEGORY_CONFIG[variant]
  const Icon = cfg.icon
  return (
    <div className="space-y-2.5">
      <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md ${cfg.badgeBg}`}>
        <Icon className={`h-3.5 w-3.5 ${cfg.badgeText}`} />
        <span className={`text-[11px] font-semibold ${cfg.badgeText}`}>{cfg.label}</span>
        <span className={`text-[10px] font-medium ${cfg.badgeText} opacity-70 tabular-nums`}>
          {list.length}
        </span>
      </div>
      <div className={`grid gap-2.5 ${gridClass}`}>
        {list.map(renderCard)}
      </div>
    </div>
  )
}

function CategoryStack({
  players,
  isAnnounced,
  renderCard,
  gridClass,
}: {
  players: ApiPlayer[]
  isAnnounced: boolean
  renderCard: (p: ApiPlayer) => React.ReactNode
  gridClass: string
}) {
  const groups = groupByCategory(players, isAnnounced)
  return (
    <div className="space-y-5">
      <CategoryBlock list={groups.playing} variant="playing" renderCard={renderCard} gridClass={gridClass} />
      <CategoryBlock list={groups.substitutes} variant="substitutes" renderCard={renderCard} gridClass={gridClass} />
      <CategoryBlock list={groups.bench} variant="bench" renderCard={renderCard} gridClass={gridClass} />
    </div>
  )
}

export function PlayerPool({
  players,
  roleFilter,
  isAnnounced,
  renderCard,
  gridClass = 'grid-cols-1',
}: PlayerPoolProps) {
  const byRole = useMemo(() => {
    const m: Record<FantasyRole, ApiPlayer[]> = { WK: [], BAT: [], AR: [], BOWL: [] }
    for (const p of players) m[normalizeRole(p.type)].push(p)
    return m
  }, [players])

  if (players.length === 0) {
    return (
      <p className="text-xs text-muted-foreground py-8 text-center">No players for this role</p>
    )
  }

  if (roleFilter !== 'ALL') {
    return <CategoryStack players={players} isAnnounced={isAnnounced} renderCard={renderCard} gridClass={gridClass} />
  }

  return (
    <div className="space-y-7">
      {ROLE_ORDER.map((role) => {
        const list = byRole[role]
        if (list.length === 0) return null
        return (
          <section key={role} className="space-y-3">
            <header className="flex items-baseline gap-2">
              <h3 className="text-sm font-semibold tracking-tight">{ROLE_NAME[role]}</h3>
              <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                {roleLabel(role)}
              </span>
              <span className="text-[11px] text-muted-foreground tabular-nums ml-auto">
                {list.length}
              </span>
            </header>
            <CategoryStack
              players={list}
              isAnnounced={isAnnounced}
              renderCard={renderCard}
              gridClass={gridClass}
            />
          </section>
        )
      })}
    </div>
  )
}
