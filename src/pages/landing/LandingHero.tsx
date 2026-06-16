import { Button } from '@/components/ui/button'
import { Download, BookOpen, Swords } from 'lucide-react'
import { formatMonthRange } from '@/lib/format'
import type { SeasonMeta } from '@/data/useSeasonBoard'

export function LandingHero({
  meta,
  onDownload,
  onOpenRulebook,
}: {
  meta: SeasonMeta
  onDownload: () => void
  onOpenRulebook: () => void
}) {
  const chips = [
    `${meta.playerCount} Players`,
    `${meta.matchCount} Matches`,
    formatMonthRange(meta.firstMatch, meta.lastMatch),
  ].filter(Boolean)

  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_55%_at_50%_-10%,rgba(255,255,255,0.07),transparent)]" />
      <div className="container relative py-24 md:py-36 flex flex-col items-center text-center gap-6">
        {/* Brand mark */}
        <div className="h-16 w-16 rounded-2xl bg-primary-foreground flex items-center justify-center ring-1 ring-border shadow-lg shadow-white/5">
          <Swords className="h-8 w-8 text-primary" />
        </div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-muted-foreground">
          IPL Fantasy · 2026 Season
        </p>
        <h1 className="text-6xl md:text-8xl font-bold tracking-tight leading-none">ApnaXI</h1>
        <p className="text-muted-foreground text-lg md:text-xl max-w-2xl leading-relaxed">
          A private IPL fantasy league. Each match, players drafted an XI under Dream11 rules — captain
          scores 2×, vice-captain 1.5× — with an optional one-tap Smart XI auto-pick. Points accumulated
          across the season into the standings below.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-2 mt-1">
          {chips.map((c) => (
            <span
              key={c}
              className="rounded-full border bg-muted/40 px-3.5 py-1 text-xs font-medium text-muted-foreground"
            >
              {c}
            </span>
          ))}
        </div>
        <div className="flex flex-wrap items-center justify-center gap-3 mt-3">
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
