import { useMemo } from 'react'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { base64ToBlobUrl, initials } from '@/lib/avatar'
import { formatPoints } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { SeasonPlayer } from '@/data/useSeasonBoard'

export function StandingsTable({ players }: { players: SeasonPlayer[] }) {
  const urls = useMemo(() => players.map((p) => base64ToBlobUrl(p.imageurl)), [players])
  return (
    <section className="container py-8 md:py-12">
      <h2 className="text-2xl md:text-3xl font-bold tracking-tight mb-6 text-center">Final Standings</h2>
      <div className="rounded-xl border bg-card overflow-hidden max-w-3xl mx-auto">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-12 text-center">#</TableHead>
              <TableHead>Player</TableHead>
              <TableHead className="text-right">Points</TableHead>
              <TableHead className="text-right hidden sm:table-cell">Wins</TableHead>
              <TableHead className="text-right hidden sm:table-cell">Played</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {players.map((p, i) => {
              const medal =
                p.rank === 1
                  ? 'text-gold'
                  : p.rank === 2
                    ? 'text-silver'
                    : p.rank === 3
                      ? 'text-bronze'
                      : 'text-muted-foreground'
              return (
                <TableRow key={p.email} className={cn('break-inside-avoid', p.rank <= 3 && 'bg-muted/30')}>
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
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>
    </section>
  )
}
