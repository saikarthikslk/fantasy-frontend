import { cn } from '@/lib/utils'
import { formatPoints, formatMonthRange } from '@/lib/format'
import { initials } from '@/lib/avatar'
import type { SeasonPlayer, SeasonMeta } from '@/data/useSeasonBoard'

/**
 * Print-only season report: a self-contained, redesigned document showing ONLY the
 * final standings. Hidden on screen (`print:block`); the rest of the landing page is
 * `print:hidden`, so this is the entire content of the exported PDF.
 */
export function SeasonReport({ players, meta }: { players: SeasonPlayer[]; meta: SeasonMeta }) {
  return (
    <div className="hidden print:block px-1">
      {/* Masthead */}
      <div className="flex items-end justify-between border-b border-gold/40 pb-4 mb-5">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-gold">IPL Fantasy · 2026 Season</p>
          <h1 className="text-3xl font-bold tracking-tight mt-1">Final Standings</h1>
        </div>
        <div className="text-right text-[10px] text-muted-foreground leading-relaxed">
          <p>{meta.playerCount} players · {meta.matchCount} matches</p>
          <p>{formatMonthRange(meta.firstMatch, meta.lastMatch)}</p>
        </div>
      </div>

      {/* Champion callout */}
      {meta.champion && (
        <div className="flex items-center justify-between rounded-lg border border-gold/30 bg-gold/5 px-5 py-3 mb-5">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🏆</span>
            <div>
              <p className="text-[9px] uppercase tracking-[0.2em] text-gold">Champion</p>
              <p className="text-lg font-bold leading-tight">{meta.champion.name}</p>
            </div>
          </div>
          <p className="text-2xl font-bold text-gold tabular-nums">{formatPoints(meta.champion.totalpoints)}</p>
        </div>
      )}

      {/* Standings table */}
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-border text-[10px] uppercase tracking-wider text-muted-foreground">
            <th className="w-8 py-2 text-center font-medium">#</th>
            <th className="py-2 text-left font-medium">Player</th>
            <th className="py-2 text-right font-medium">Total Points</th>
            <th className="py-2 text-right font-medium">Wins</th>
            <th className="py-2 text-right font-medium">Played</th>
          </tr>
        </thead>
        <tbody>
          {players.map((p) => {
            const medal =
              p.rank === 1 ? 'text-gold' : p.rank === 2 ? 'text-silver' : p.rank === 3 ? 'text-bronze' : ''
            return (
              <tr
                key={p.email}
                className={cn('border-b border-border/60', p.rank <= 3 && 'bg-muted/20')}
                style={{ breakInside: 'avoid' }}
              >
                <td className={cn('py-1.5 text-center font-bold tabular-nums', medal)}>{p.rank}</td>
                <td className="py-1.5">
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-[10px] font-semibold">
                      {initials(p.name)}
                    </span>
                    <span className="font-medium">{p.name}</span>
                  </div>
                </td>
                <td className="py-1.5 text-right font-semibold tabular-nums">{formatPoints(p.totalpoints)}</td>
                <td className="py-1.5 text-right tabular-nums text-muted-foreground">{p.wins}</td>
                <td className="py-1.5 text-right tabular-nums text-muted-foreground">{p.played}</td>
              </tr>
            )
          })}
        </tbody>
      </table>

      {/* Footer */}
      <div className="mt-5 flex justify-between border-t border-border pt-3 text-[10px] text-muted-foreground">
        <span>ApnaXI — IPL Fantasy League</span>
        <span>Season 2026 · Final Standings</span>
      </div>
    </div>
  )
}
