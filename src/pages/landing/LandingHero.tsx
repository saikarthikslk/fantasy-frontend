import { Button } from '@/components/ui/button'
import { Download, Trophy, BookOpen } from 'lucide-react'
import { formatPoints } from '@/lib/format'
import type { SeasonPlayer } from '@/data/useSeasonBoard'

export function LandingHero({
  champion,
  onDownload,
  onOpenRulebook,
}: {
  champion: SeasonPlayer | null
  onDownload: () => void
  onOpenRulebook: () => void
}) {
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(255,255,255,0.06),transparent)] print:hidden" />
      <div className="container relative py-20 md:py-32 flex flex-col items-center text-center gap-6">
        <div className="inline-flex items-center gap-2 rounded-full border bg-muted/50 px-4 py-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          <Trophy className="h-3.5 w-3.5 text-gold" />
          IPL Fantasy · 2026 Season
        </div>
        <h1 className="text-4xl md:text-6xl font-bold tracking-tight max-w-3xl leading-[1.1]">
          The season is settled.
        </h1>
        {champion && (
          <p className="text-muted-foreground text-lg md:text-xl max-w-2xl leading-relaxed">
            <span className="text-foreground font-semibold">{champion.name}</span> takes the crown with{' '}
            <span className="text-gold font-semibold tabular-nums">{formatPoints(champion.totalpoints)}</span>{' '}
            points across the season.
          </p>
        )}
        <div className="flex flex-wrap items-center justify-center gap-3 mt-2 print:hidden">
          <Button size="lg" className="gap-2" onClick={onDownload}>
            <Download className="h-4 w-4" />
            Download Results (PDF)
          </Button>
          <Button variant="outline" size="lg" className="gap-2" onClick={onOpenRulebook}>
            <BookOpen className="h-4 w-4" />
            Points Rulebook
          </Button>
        </div>
      </div>
    </section>
  )
}
