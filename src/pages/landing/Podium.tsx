import { useMemo } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { base64ToBlobUrl, initials } from '@/lib/avatar'
import { formatPoints } from '@/lib/format'
import type { SeasonPlayer } from '@/data/useSeasonBoard'

export function Podium({ players }: { players: SeasonPlayer[] }) {
  const top = useMemo(() => players.slice(0, 3), [players])
  const urls = useMemo(() => top.map((p) => base64ToBlobUrl(p.imageurl)), [top])
  if (top.length < 3) return null
  return (
    <section className="container py-8">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-2xl mx-auto">
        {top.map((p, i) => {
          const rank = i + 1
          const orderClass =
            rank === 1 ? 'order-1 sm:order-2' : rank === 2 ? 'order-2 sm:order-1' : 'order-3'
          const ring = rank === 1 ? 'ring-gold' : rank === 2 ? 'ring-silver' : 'ring-bronze'
          const medal = rank === 1 ? '🥇' : rank === 2 ? '🥈' : '🥉'
          const lift = rank === 1 ? 'sm:-mt-4 border-gold/30' : rank === 3 ? 'sm:mt-4' : ''
          return (
            <Card key={p.email} className={`text-center break-inside-avoid ${orderClass} ${lift}`}>
              <CardContent className="pt-6 pb-4">
                <div className="text-2xl mb-2">{medal}</div>
                <Avatar className={`h-16 w-16 mx-auto ring-2 ${ring}`}>
                  {urls[i] && <AvatarImage src={urls[i]!} />}
                  <AvatarFallback className="text-lg font-bold">{initials(p.name)}</AvatarFallback>
                </Avatar>
                <h3 className="font-semibold mt-3 text-sm truncate">{p.name}</h3>
                <p className="text-lg font-bold text-gold tabular-nums">{formatPoints(p.totalpoints)}</p>
                <p className="text-xs text-muted-foreground">
                  {p.wins} wins · {p.played} played
                </p>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </section>
  )
}
