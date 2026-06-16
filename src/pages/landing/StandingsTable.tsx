import { Fragment, useMemo, useState } from 'react'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { base64ToBlobUrl, initials } from '@/lib/avatar'
import { formatPoints } from '@/lib/format'
import { cn } from '@/lib/utils'
import { ChevronDown } from 'lucide-react'
import { MatchBreakdown } from './MatchBreakdown'
import type { SeasonPlayer } from '@/data/useSeasonBoard'

export function StandingsTable({ players }: { players: SeasonPlayer[] }) {
  const urls = useMemo(() => players.map((p) => base64ToBlobUrl(p.imageurl)), [players])
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const toggle = (email: string) =>
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(email)) next.delete(email)
      else next.add(email)
      return next
    })

  return (
    <section className="container py-8 md:py-12">
      <h2 className="text-2xl md:text-3xl font-bold tracking-tight mb-2 text-center">Final Standings</h2>
      <p className="text-xs text-muted-foreground text-center mb-6">
        Tap a player to see their match-by-match scores
      </p>
      <div className="rounded-xl border bg-card overflow-hidden max-w-3xl mx-auto">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-12 text-center">#</TableHead>
              <TableHead>Player</TableHead>
              <TableHead className="text-right">Points</TableHead>
              <TableHead className="text-right hidden sm:table-cell">Wins</TableHead>
              <TableHead className="text-right hidden sm:table-cell">Played</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {players.map((p, i) => {
              const isOpen = expanded.has(p.email)
              const medal =
                p.rank === 1
                  ? 'text-gold'
                  : p.rank === 2
                    ? 'text-silver'
                    : p.rank === 3
                      ? 'text-bronze'
                      : 'text-muted-foreground'
              return (
                <Fragment key={p.email}>
                  <TableRow
                    onClick={() => toggle(p.email)}
                    className={cn('cursor-pointer', p.rank <= 3 && 'bg-muted/30', isOpen && 'bg-muted/50')}
                  >
                    <TableCell className={cn('text-center font-bold tabular-nums', medal)}>{p.rank}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          {urls[i] && <AvatarImage src={urls[i]!} />}
                          <AvatarFallback className="text-xs font-medium">{initials(p.name)}</AvatarFallback>
                        </Avatar>
                        <span className="font-medium truncate">{p.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-semibold tabular-nums">{formatPoints(p.totalpoints)}</TableCell>
                    <TableCell className="text-right tabular-nums hidden sm:table-cell text-muted-foreground">{p.wins}</TableCell>
                    <TableCell className="text-right tabular-nums hidden sm:table-cell text-muted-foreground">{p.played}</TableCell>
                    <TableCell className="text-right">
                      <ChevronDown
                        className={cn('h-4 w-4 inline text-muted-foreground transition-transform', isOpen && 'rotate-180')}
                      />
                    </TableCell>
                  </TableRow>
                  {isOpen && (
                    <TableRow className="hover:bg-transparent">
                      <TableCell colSpan={6} className="p-0">
                        <MatchBreakdown stats={p.stats} />
                      </TableCell>
                    </TableRow>
                  )}
                </Fragment>
              )
            })}
          </TableBody>
        </Table>
      </div>
    </section>
  )
}
