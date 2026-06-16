import { useState } from 'react'
import { useSeasonBoard } from '@/data/useSeasonBoard'
import { LandingHero } from './landing/LandingHero'
import { Podium } from './landing/Podium'
import { StandingsTable } from './landing/StandingsTable'
import { SeasonReport } from './landing/SeasonReport'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { PointsRulebookDialog } from '@/components/PointsRulebookDialog'
import { AlertCircle } from 'lucide-react'
import { formatPoints, formatMonthRange } from '@/lib/format'

export function Home() {
  const { data, isLoading, isError, refetch } = useSeasonBoard()
  const [rulebookOpen, setRulebookOpen] = useState(false)

  if (isLoading) {
    return (
      <div className="container py-20 flex flex-col items-center gap-6">
        <Skeleton className="h-16 w-16 rounded-2xl" />
        <Skeleton className="h-14 w-72 max-w-full" />
        <Skeleton className="h-6 w-96 max-w-full" />
        <Skeleton className="h-96 w-full max-w-3xl rounded-xl mt-8" />
      </div>
    )
  }

  if (isError || !data) {
    return (
      <div className="container py-20 flex justify-center">
        <Card className="border-destructive/50 max-w-md w-full">
          <CardContent className="flex flex-col items-center text-center gap-4 pt-6">
            <AlertCircle className="h-8 w-8 text-destructive" />
            <p className="text-sm text-muted-foreground">Couldn't load the season results.</p>
            <Button variant="outline" onClick={() => refetch()}>
              Try again
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const { players, meta } = data
  return (
    <>
      {/* Interactive landing — hidden when printing */}
      <div className="flex flex-col print:hidden">
        {/* 1 — ApnaXI, highlighted first */}
        <LandingHero
          meta={meta}
          onDownload={() => window.print()}
          onOpenRulebook={() => setRulebookOpen(true)}
        />

        <div className="container">
          <div className="h-px bg-linear-to-r from-transparent via-border to-transparent" />
        </div>

        {/* 2 — the results */}
        <section className="container pt-14 md:pt-20 text-center">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight">The season is settled.</h2>
          {meta.champion && (
            <p className="text-muted-foreground mt-3 text-lg">
              <span className="text-foreground font-semibold">{meta.champion.name}</span> takes the crown with{' '}
              <span className="text-gold font-semibold tabular-nums">{formatPoints(meta.champion.totalpoints)}</span>{' '}
              points.
            </p>
          )}
        </section>
        <Podium players={players} />
        <StandingsTable players={players} />

        <div className="container py-10 text-center text-xs text-muted-foreground">
          Season closed · {meta.matchCount} matches · {formatMonthRange(meta.firstMatch, meta.lastMatch)}
        </div>
      </div>

      {/* PDF export — the only content that prints */}
      <SeasonReport players={players} meta={meta} />

      <PointsRulebookDialog open={rulebookOpen} onOpenChange={setRulebookOpen} />
    </>
  )
}
