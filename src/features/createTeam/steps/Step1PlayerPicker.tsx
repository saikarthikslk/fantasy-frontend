import { useState, useMemo, useRef, useEffect } from 'react'
import type { ApiMatch, ApiPlayer } from '@/types/api'
import { normalizeRole, playerKey, tryAddPlayer, SQUAD_SIZE, type FantasyRole } from '@/fantasy/dream11Rules'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { RoleFilterTabs } from '../components/RoleFilterTabs'
import { PlayerPoolCard } from '../components/PlayerPoolCard'
import { PlayerPool } from '../components/PlayerPool'
import { StatusBanner } from '../components/StatusBanner'
import { ChevronRight, Sparkles } from 'lucide-react'
import { Kbd } from '@/components/ui/kbd'

interface Step1Props {
  players: ApiPlayer[]
  matchMeta: ApiMatch | null
  byId: Map<string, ApiPlayer>
  selected: Set<string>
  selectedList: ApiPlayer[]
  roleCounts: Record<FantasyRole, number>
  hint: string | null
  squadValid: boolean
  validationErrors: string[]
  t1: string
  t2: string
  t1Id: number | undefined
  t2Id: number | undefined
  onPick: (p: ApiPlayer) => void
  onClearAll: () => void
  onNext: () => void
  onSmartXI?: () => void
  smartXILoading?: boolean
  captainId: string | null
  viceCaptainId: string | null
  apiError: string | null
  isAnnounced: boolean
  smartXIIds?: Set<string>
}

export function Step1PlayerPicker({
  players, matchMeta, byId, selected, selectedList, roleCounts,
  hint, squadValid, validationErrors,
  onPick, onClearAll, onNext, onSmartXI, smartXILoading,
  apiError, isAnnounced, smartXIIds = new Set(),
}: Step1Props) {
  const [roleFilter, setRoleFilter] = useState<'ALL' | FantasyRole>('WK')
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    scrollRef.current?.scrollTo(0, 0)
  }, [roleFilter])

  const pool = useMemo(() => {
    return roleFilter === 'ALL' ? players : players.filter((p) => normalizeRole(p.type) === roleFilter)
  }, [players, roleFilter])

  const renderCard = (p: ApiPlayer) => {
    const pk = playerKey(p)
    const on = selected.has(pk)
    const res = on ? ({ ok: true } as const) : tryAddPlayer(p, selected, byId, matchMeta)
    const disabled = !on && !res.ok
    const isSmartXI = smartXIIds.has(String(p.id))
    return (
      <PlayerPoolCard
        key={pk}
        player={p}
        isSelected={on}
        isDisabled={disabled}
        onClick={() => onPick(p)}
        isSmartXI={isSmartXI}
      />
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Status feedback */}
      <StatusBanner
        apiError={apiError}
        hint={hint}
        validationError={selectedList.length === SQUAD_SIZE && validationErrors.length > 0 ? validationErrors[0] : null}
        captainViceError={null}
      />

      {/* Role filters */}
      <RoleFilterTabs
        active={roleFilter}
        roleCounts={roleCounts}
        onChange={setRoleFilter}
        showClearAll={selectedList.length > 0}
        onClearAll={onClearAll}
      />

      {/* Player pool — single list with categories */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto min-h-0">
        <div className="pt-3 pb-2">
          <PlayerPool
            players={pool}
            roleFilter={roleFilter}
            isAnnounced={isAnnounced}
            renderCard={renderCard}
            useEdgeToEdgeBanners={true}
          />
        </div>
      </div>

      {/* Sticky bottom bar */}
      <div className="shrink-0 border-t bg-background/95 backdrop-blur-sm">
        {/* Stats + Next CTA */}
        <div className="flex items-center gap-3 px-4 py-3">
          {/* Progress */}
          <div className="shrink-0">
            <div className="flex items-baseline gap-0.5">
              <span className="text-lg font-bold tabular-nums">{selectedList.length}</span>
              <span className="text-xs text-muted-foreground">/{SQUAD_SIZE}</span>
            </div>
            <Progress value={(selectedList.length / SQUAD_SIZE) * 100} className="h-1 w-14 mt-0.5" />
          </div>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Smart XI */}
          {onSmartXI && (
            <Button
              variant="outline"
              disabled={smartXILoading}
              onClick={onSmartXI}
              title="Auto-pick a balanced XI based on role balance and team diversity"
              className="gap-1.5 h-11 rounded-xl text-sm font-semibold"
            >
              <Sparkles className="h-4 w-4" />
              {smartXILoading ? 'Picking…' : 'Smart XI'}
              <Kbd>S</Kbd>
            </Button>
          )}

          {/* Next button */}
          <Button
            disabled={!squadValid}
            onClick={onNext}
            className="gap-1.5 px-6 h-11 rounded-xl text-sm font-semibold"
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
