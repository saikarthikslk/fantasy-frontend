import type { ApiPlayer } from '@/types/api'
import { groupByCategory } from '@/fantasy/dream11Rules'
import { CircleCheck, ArrowLeftRight, CircleMinus } from 'lucide-react'

interface CategorySectionProps {
  players: ApiPlayer[]
  isAnnounced: boolean
  renderCard: (p: ApiPlayer) => React.ReactNode
}

const SECTION_CONFIG: Record<string, {
  label: string
  icon: typeof CircleCheck
  badgeBg: string
  badgeText: string
  borderColor: string
  wrapperBg: string
}> = {
  playing: {
    label: 'Playing XI',
    icon: CircleCheck,
    badgeBg: 'bg-emerald-500/15',
    badgeText: 'text-emerald-500',
    borderColor: 'border-emerald-500/5',
    wrapperBg: '',
  },
  substitutes: {
    label: 'Substitutes',
    icon: ArrowLeftRight,
    badgeBg: 'bg-amber-500/15',
    badgeText: 'text-amber-500',
    borderColor: 'border-amber-500/5',
    wrapperBg: 'bg-amber-500/[0.03]',
  },
  bench: {
    label: 'Bench',
    icon: CircleMinus,
    badgeBg: 'bg-muted',
    badgeText: 'text-muted-foreground',
    borderColor: 'border-border',
    wrapperBg: 'bg-muted/30',
  },
}

export function CategorySection({ players, isAnnounced, renderCard }: CategorySectionProps) {
  const groups = groupByCategory(players, isAnnounced)
  const sections = [
    { key: 'playing', list: groups.playing },
    { key: 'substitutes', list: groups.substitutes },
    { key: 'bench', list: groups.bench },
  ] as const

  return (
    <div className="space-y-4">
      {sections.map(({ key, list }) => {
        if (list.length === 0) return null
        const cfg = SECTION_CONFIG[key]
        const Icon = cfg.icon
        return (
          <div key={key} className={`rounded-lg border ${cfg.borderColor} ${cfg.wrapperBg} overflow-hidden`}>
            {/* Section header */}
            <div className={`flex items-center gap-2 px-3 py-2 ${cfg.badgeBg}`}>
              <Icon className={`h-3.5 w-3.5 ${cfg.badgeText}`} />
              <span className={`text-xs font-semibold ${cfg.badgeText}`}>
                {cfg.label}
              </span>
              <span className={`text-[10px] font-medium ${cfg.badgeText} opacity-70 tabular-nums`}>
                ({list.length})
              </span>
            </div>
            {/* Player cards */}
            <div className="p-2 space-y-1.5">
              {list.map(renderCard)}
            </div>
          </div>
        )
      })}
    </div>
  )
}
