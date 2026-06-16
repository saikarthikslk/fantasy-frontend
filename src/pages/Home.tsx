import { useState } from 'react'
import { useSeasonBoard } from '@/data/useSeasonBoard'
import { LandingHero } from './landing/LandingHero'
import { AboutSection } from './landing/AboutSection'
import { Podium } from './landing/Podium'
import { StandingsTable } from './landing/StandingsTable'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { PointsRulebookDialog } from '@/components/PointsRulebookDialog'
import { AlertCircle, Trophy } from 'lucide-react'
import { formatMonthRange } from '@/lib/format'

export function Home() {
  const { data, isLoading, isError, refetch } = useSeasonBoard()
  const [rulebookOpen, setRulebookOpen] = useState(false)

  if (isLoading) {
    return (
      <div className="container py-20 flex flex-col items-center gap-6">
        <Skeleton className="h-12 w-80 max-w-full" />
        <Skeleton className="h-6 w-96 max-w-full" />
        <div className="grid sm:grid-cols-3 gap-3 w-full max-w-2xl mt-8">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-40 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-96 w-full max-w-3xl rounded-xl" />
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
    <div className="flex flex-col">
      {/* Print-only report header (shown only when printing to PDF) */}
      <div className="hidden print:block container pt-6 pb-2">
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Trophy className="h-5 w-5 text-gold" />
          IPL Fantasy 2026 — Final Standings
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {meta.playerCount} players · {meta.matchCount} matches · {formatMonthRange(meta.firstMatch, meta.lastMatch)}
        </p>
      </div>

      <LandingHero
        champion={meta.champion}
        onDownload={() => window.print()}
        onOpenRulebook={() => setRulebookOpen(true)}
      />
      <AboutSection meta={meta} />
      <Podium players={players} />
      <StandingsTable players={players} />

      <div className="container py-10 text-center text-xs text-muted-foreground print:hidden">
        Season closed · {meta.matchCount} matches · {formatMonthRange(meta.firstMatch, meta.lastMatch)}
      </div>

      <PointsRulebookDialog open={rulebookOpen} onOpenChange={setRulebookOpen} />
    </div>
  )
}
