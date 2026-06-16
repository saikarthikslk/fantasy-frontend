import { Card, CardContent } from '@/components/ui/card'
import { Users, CalendarDays, Swords, Crown } from 'lucide-react'
import type { SeasonMeta } from '@/data/useSeasonBoard'
import { formatMonthRange } from '@/lib/format'

export function AboutSection({ meta }: { meta: SeasonMeta }) {
  const cards = [
    { icon: Users, label: 'Players', value: String(meta.playerCount) },
    { icon: Swords, label: 'Matches', value: String(meta.matchCount) },
    { icon: CalendarDays, label: 'Season', value: formatMonthRange(meta.firstMatch, meta.lastMatch) },
    { icon: Crown, label: 'Champion', value: meta.champion?.name ?? '—' },
  ]
  return (
    <section className="container py-12 md:py-16">
      <div className="max-w-2xl mx-auto text-center">
        <h2 className="text-2xl md:text-3xl font-bold tracking-tight">What is ApnaXI?</h2>
        <p className="text-muted-foreground mt-3 leading-relaxed">
          A private IPL fantasy league. Each match, players drafted an XI under Dream11 rules — captain scores 2×,
          vice-captain 1.5× — with an optional one-tap Smart XI auto-pick. Points accumulated across all{' '}
          {meta.matchCount} matches into the final season table below.
        </p>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-10 max-w-3xl mx-auto">
        {cards.map((c) => (
          <Card key={c.label} className="break-inside-avoid">
            <CardContent className="flex flex-col items-center text-center gap-2 py-6">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <c.icon className="h-5 w-5 text-primary" />
              </div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground">{c.label}</p>
              <p className="font-semibold truncate max-w-full">{c.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  )
}
