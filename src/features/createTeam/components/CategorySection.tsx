import type { ApiPlayer } from '@/types/api'
import { groupByCategory } from '@/fantasy/dream11Rules'

interface CategorySectionProps {
  players: ApiPlayer[]
  isAnnounced: boolean
  renderCard: (p: ApiPlayer) => React.ReactNode
}

const SECTION_LABEL: Record<string, string> = {
  playing: 'Playing',
  substitutes: 'Substitutes',
  bench: 'Bench',
}

const SECTION_STYLE: Record<string, string> = {
  playing: 'text-emerald-500',
  substitutes: 'text-amber-500',
  bench: 'text-muted-foreground',
}

export function CategorySection({ players, isAnnounced, renderCard }: CategorySectionProps) {
  const groups = groupByCategory(players, isAnnounced)
  const sections = [
    { key: 'playing', list: groups.playing },
    { key: 'substitutes', list: groups.substitutes },
    { key: 'bench', list: groups.bench },
  ] as const

  return (
    <>
      {sections.map(({ key, list }) => {
        if (list.length === 0) return null
        return (
          <div key={key}>
            <div className="flex items-center gap-2 mt-3 mb-1.5">
              <span className={`text-[10px] font-semibold uppercase tracking-wider ${SECTION_STYLE[key]}`}>
                {SECTION_LABEL[key]}
              </span>
              <span className="text-[10px] text-muted-foreground/50 tabular-nums">{list.length}</span>
              <div className="flex-1 border-b border-border/30" />
            </div>
            <div className="space-y-1.5">
              {list.map(renderCard)}
            </div>
          </div>
        )
      })}
    </>
  )
}
