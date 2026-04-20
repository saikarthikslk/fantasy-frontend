import type { CSSProperties } from 'react'
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { usePageShortcuts, useKeyboard } from '@/keyboard/useKeyboard'
import { playerImageUrl } from '../api/client'
import type { OverallLeaderboardEntry, OverallLeaderboardStat } from '../types/api'
import { useOverallLeaderboard } from '@/hooks/useQueries'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Kbd } from '@/components/ui/kbd'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Trophy,
  Search,
  ChevronUp,
  ChevronDown,
  ChevronsLeft,
  ChevronsRight,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Users,
  TrendingUp,
  BarChart3,
  Sparkles,
} from 'lucide-react'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { getTeamColors, fixtureTint } from '@/fantasy/teamColors'

type SortKey = 'name' | 'totalpoints' | 'matches'
type SortDir = 'asc' | 'desc'

function base64ToBlobUrl(base64: string | null | undefined): string | null {
  if (!base64) return null
  try {
    const raw = window.atob(base64)
    const uInt8Array = new Uint8Array(raw.length)
    for (let i = 0; i < raw.length; ++i) uInt8Array[i] = raw.charCodeAt(i)
    const blob = new Blob([uInt8Array], { type: 'image/png' })
    return URL.createObjectURL(blob)
  } catch {
    return null
  }
}

function MatchStatsPopover({ stats }: { stats: OverallLeaderboardStat[] }) {
  const sorted = [...stats].sort((a, b) => b.timestamp - a.timestamp)
  return (
    <div className="border-t bg-muted/30 px-4 sm:px-6 py-3">
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
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
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
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
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

const LeaderboardRow = memo(function LeaderboardRow({
  row,
  rank,
  focused,
  registerClick,
  idx,
}: {
  row: OverallLeaderboardEntry
  rank: number
  focused?: boolean
  registerClick?: (idx: number, fn: () => void) => void
  idx?: number
}) {
  const [expanded, setExpanded] = useState(false)
  const avatarUrl = base64ToBlobUrl(row.imageurl)
  const rowRef = useRef<HTMLTableRowElement>(null)

  // Scroll into view when focused via keyboard
  useEffect(() => {
    if (focused && rowRef.current) {
      rowRef.current.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
    }
  }, [focused])

  // Register toggle callback for keyboard navigation
  const toggle = useCallback(() => setExpanded((v) => !v), [])
  useEffect(() => {
    if (registerClick && idx != null) registerClick(idx, toggle)
  }, [registerClick, idx, toggle])

  return (
    <tr ref={rowRef} className={`group ${expanded ? 'bg-muted/20' : ''} ${focused ? 'ring-2 ring-ring/60 ring-inset rounded-lg' : ''}`}>
      <td colSpan={6} className="p-0">
        <div
          className="flex items-center gap-3 px-3 py-2.5 transition-colors cursor-pointer hover:bg-muted/30"
          onClick={toggle}
        >
          <span className="w-8 shrink-0 text-center">
            {rank <= 3 ? (
              <span className="text-lg">{rank === 1 ? '🥇' : rank === 2 ? '🥈' : '🥉'}</span>
            ) : (
              <span className="text-sm text-muted-foreground tabular-nums">{rank}</span>
            )}
          </span>
          <Avatar className="h-8 w-8 shrink-0 hidden sm:flex">
            {avatarUrl && <AvatarImage src={avatarUrl} />}
            <AvatarFallback className="text-xs">{row.name?.charAt(0)?.toUpperCase() ?? '?'}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <span className="text-sm font-medium block truncate">{row.name}</span>
            <span className="text-xs text-muted-foreground block truncate sm:hidden">{row.stats?.length ?? 0} played</span>
            <span className="text-xs text-muted-foreground hidden sm:block truncate">{row.email}</span>
          </div>
          <Badge variant="secondary" className="shrink-0 hidden sm:inline-flex">{row.stats?.length ?? 0}</Badge>
          <span className="text-sm font-semibold tabular-nums w-16 text-right shrink-0">{row.totalpoints.toFixed(1)}</span>
          <ChevronDown className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform ${expanded ? 'rotate-180' : ''}`} />
        </div>
        {expanded && row.stats && row.stats.length > 0 && (
          <MatchStatsPopover stats={row.stats} />
        )}
      </td>
    </tr>
  )
})

export function Leaderboard() {
  const { data: rows = [], isLoading: loading, error: queryError } = useOverallLeaderboard()
  const error = queryError ? (queryError instanceof Error ? queryError.message : 'Failed to load leaderboard') : null

  const [sortKey, setSortKey] = useState<SortKey>('totalpoints')
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(15)

  const filteredSorted = useMemo(() => {
    const q = query.trim().toLowerCase()
    const filtered = q
      ? rows.filter((r) => r.name.toLowerCase().includes(q) || r.email.toLowerCase().includes(q))
      : rows
    const copy = [...filtered]
    copy.sort((a, b) => {
      const dir = sortDir === 'asc' ? 1 : -1
      if (sortKey === 'totalpoints') return (a.totalpoints - b.totalpoints) * dir
      if (sortKey === 'matches') return ((a.stats?.length ?? 0) - (b.stats?.length ?? 0)) * dir
      return a.name.localeCompare(b.name) * dir
    })
    return copy
  }, [rows, query, sortKey, sortDir])

  const totalPages = Math.max(1, Math.ceil(filteredSorted.length / pageSize))
  const safePage = Math.min(page, totalPages)
  const start = (safePage - 1) * pageSize
  const pageRows = filteredSorted.slice(start, start + pageSize)
  const [focusedIdx, setFocusedIdx] = useState(-1)
  const rowClickRefs = useRef<Map<number, () => void>>(new Map())

  // Keyboard shortcuts for leaderboard
  const { isDisabled: off } = useKeyboard()
  usePageShortcuts('leaderboard', (e: KeyboardEvent) => {
    if ((e.key === 'ArrowDown' || e.key === 'ArrowUp') && !off('lb-nav')) {
      e.preventDefault()
      setFocusedIdx((prev) =>
        e.key === 'ArrowDown'
          ? Math.min(prev + 1, pageRows.length - 1)
          : Math.max(prev - 1, -1),
      )
      return true
    }
    if (e.key === 'Enter' && !off('lb-expand') && focusedIdx >= 0) {
      const clickFn = rowClickRefs.current.get(focusedIdx)
      if (clickFn) clickFn()
      return true
    }
    if (e.key === 'e' && !off('lb-expand-e') && focusedIdx >= 0) {
      const clickFn = rowClickRefs.current.get(focusedIdx)
      if (clickFn) clickFn()
      return true
    }
    return false
  })

  const onSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    else { setSortKey(key); setSortDir(key === 'name' ? 'asc' : 'desc') }
    setPage(1)
  }

  const topThree = useMemo(() => {
    const sorted = [...rows].sort((a, b) => b.totalpoints - a.totalpoints)
    return sorted.slice(0, 3)
  }, [rows])

  return (
    <div className="container px-4 sm:px-8 py-6 sm:py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Season Leaderboard</h1>
        <p className="text-muted-foreground mt-1">Combined fantasy points across every match this season</p>
      </div>

      {loading && (
        <div className="space-y-6">
          {/* Podium skeleton */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-2xl mx-auto">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="rounded-xl border bg-card p-6 flex flex-col items-center gap-3">
                <Skeleton className="h-6 w-6 rounded-full" />
                <Skeleton className="h-14 w-14 rounded-full" />
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-5 w-12" />
              </div>
            ))}
          </div>
          {/* Stats skeleton */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="rounded-xl border bg-card p-4 flex items-center gap-3">
                <Skeleton className="h-9 w-9 rounded-lg" />
                <div className="space-y-1.5">
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-5 w-10" />
                </div>
              </div>
            ))}
          </div>
          {/* Rows skeleton */}
          <div className="space-y-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full rounded-lg" />
            ))}
          </div>
        </div>
      )}

      {error && (
        <Card className="border-destructive/50">
          <CardContent className="flex items-center gap-3 pt-6 text-destructive">
            <AlertCircle className="h-5 w-5 shrink-0" />
            {error}
          </CardContent>
        </Card>
      )}

      {!loading && !error && rows.length === 0 && (
        <div className="flex flex-col items-center py-20 text-center">
          <Trophy className="h-12 w-12 text-muted-foreground/30 mb-4" />
          <h3 className="font-semibold text-lg">No season data yet</h3>
          <p className="text-muted-foreground text-sm mt-1">Rankings will appear after the first match is scored</p>
        </div>
      )}

      {!loading && !error && rows.length > 0 && (
        <>
          {/* Podium */}
          {topThree.length >= 3 && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8 max-w-2xl mx-auto">
              {[topThree[1], topThree[0], topThree[2]].map((entry, vi) => {
                const actualRank = vi === 0 ? 2 : vi === 1 ? 1 : 3
                const avatarUrl = base64ToBlobUrl(entry.imageurl)
                const ringColor = actualRank === 1 ? 'ring-gold' : actualRank === 2 ? 'ring-silver' : 'ring-bronze'
                return (
                  <Card key={entry.email} className={`text-center ${actualRank === 1 ? 'sm:-mt-4 border-gold/30' : actualRank === 3 ? 'sm:mt-4' : ''}`}>
                    <CardContent className="pt-6 pb-4">
                      <div className="text-2xl mb-2">
                        {actualRank === 1 ? '🥇' : actualRank === 2 ? '🥈' : '🥉'}
                      </div>
                      <Avatar className={`h-14 w-14 mx-auto ring-2 ${ringColor}`}>
                        {avatarUrl && <AvatarImage src={avatarUrl} />}
                        <AvatarFallback className="text-lg font-bold">
                          {entry.name?.charAt(0)?.toUpperCase() ?? '?'}
                        </AvatarFallback>
                      </Avatar>
                      <h3 className="font-semibold mt-3 text-sm truncate">{entry.name}</h3>
                      <p className="text-lg font-bold text-primary tabular-nums">{entry.totalpoints.toFixed(1)}</p>
                      <p className="text-xs text-muted-foreground">
                        {entry.stats?.length ?? 0} played
                      </p>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}

          {/* Summary stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
            {[
              { label: 'Total players', value: rows.length, icon: Users },
              { label: 'Season high', value: Math.max(...rows.map((r) => r.totalpoints)).toFixed(1), icon: TrendingUp },
              { label: 'Season avg', value: (rows.reduce((s, r) => s + r.totalpoints, 0) / rows.length).toFixed(1), icon: BarChart3 },
            ].map((stat) => (
              <Card key={stat.label}>
                <CardContent className="flex items-center gap-3 pt-4 pb-4">
                  <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <stat.icon className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">{stat.label}</p>
                    <p className="text-lg font-bold tabular-nums">{stat.value}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Toolbar */}
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between mb-4">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                data-search=""
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by name or email..."
                className="pl-9 pr-8"
              />
              <Kbd className="absolute right-2.5 top-1/2 -translate-y-1/2">/</Kbd>
            </div>
            <Select value={String(pageSize)} onValueChange={(v) => setPageSize(Number(v))}>
              <SelectTrigger className="w-[110px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">5 rows</SelectItem>
                <SelectItem value="10">10 rows</SelectItem>
                <SelectItem value="15">15 rows</SelectItem>
                <SelectItem value="20">20 rows</SelectItem>
                <SelectItem value="50">50 rows</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="p-0">
                    <div className="flex items-center gap-3 px-3 py-2.5 text-xs font-medium text-muted-foreground">
                      <span className="w-8 shrink-0 text-center">#</span>
                      <span className="w-8 shrink-0 hidden sm:block"></span>
                      <button type="button" className="flex-1 text-left flex items-center gap-1 hover:text-foreground cursor-pointer" onClick={() => onSort('name')}>
                        Name
                        {sortKey === 'name' && (sortDir === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />)}
                      </button>
                      <button type="button" className="shrink-0 hidden sm:flex items-center gap-1 hover:text-foreground cursor-pointer" onClick={() => onSort('matches')}>
                        Played
                        {sortKey === 'matches' && (sortDir === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />)}
                      </button>
                      <button type="button" className="w-16 shrink-0 text-right flex items-center gap-1 justify-end hover:text-foreground cursor-pointer" onClick={() => onSort('totalpoints')}>
                        Pts
                        {sortKey === 'totalpoints' && (sortDir === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />)}
                      </button>
                      <span className="w-7 shrink-0"></span>
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {pageRows.map((row, i) => (
                  <LeaderboardRow
                    key={row.email}
                    row={row}
                    rank={start + i + 1}
                    focused={i === focusedIdx}
                    idx={i}
                    registerClick={(idx, fn) => rowClickRefs.current.set(idx, fn)}
                  />
                ))}
                {pageRows.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-muted-foreground">
                      No results match your search
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination — only show when more than one page */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-1 mt-4">
              <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setPage(1)} disabled={safePage <= 1}>
                <ChevronsLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={safePage <= 1}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm px-3 tabular-nums">{safePage} / {totalPages}</span>
              <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={safePage >= totalPages}>
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setPage(totalPages)} disabled={safePage >= totalPages}>
                <ChevronsRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
