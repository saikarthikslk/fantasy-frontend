import { Check, Sparkles } from 'lucide-react'
import { playerImageUrl } from '@/api/client'
import { creditsForPlayer, normalizeRole } from '@/fantasy/dream11Rules'
import { getTeamChipStyles, getTeamSelectedStyles, getTeamCheckColor } from '@/fantasy/teamColors'
import { cn } from '@/lib/utils'
import type { ApiPlayer } from '@/types/api'

interface PlayerPoolCardProps {
  player: ApiPlayer
  isSelected: boolean
  isDisabled: boolean
  onClick: () => void
  isSmartXI?: boolean
}

export function PlayerPoolCard({ player, isSelected, isDisabled, onClick, isSmartXI = false }: PlayerPoolCardProps) {
  const cr = creditsForPlayer(player)
  const role = normalizeRole(player.type)
  const teamShortName = player.team?.teamSName || player.team?.teamName || ''

  // Get team brand colors
  const chipStyles = getTeamChipStyles(player.team?.teamSName)
  const selectedStyles = isSelected ? getTeamSelectedStyles(player.team?.teamSName) : {}
  const checkColor = getTeamCheckColor(player.team?.teamSName)

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isDisabled}
      className={cn(
        'flex items-center gap-3 w-full text-left py-2 px-3 rounded-xl border transition-all cursor-pointer',
        isSelected
          ? 'shadow-sm'
          : isDisabled
          ? 'opacity-30 cursor-not-allowed'
          : 'border-transparent bg-muted/40 hover:bg-muted/70 active:scale-[0.98]'
      )}
      style={isSelected ? selectedStyles : undefined}
    >
      {/* Avatar with team chip */}
      <div className="relative h-[50px] w-[50px] shrink-0 flex items-center justify-center">
        <img
          className="h-10 w-10 rounded-full object-cover bg-muted"
          src={playerImageUrl(player.imageId)}
          alt=""
          loading="lazy"
        />
        {/* Team chip badge */}
        {teamShortName && (
          <span
            className="absolute bottom-0 left-0 px-1.5 py-0.5 rounded text-[7px] font-bold uppercase tracking-tight shadow-sm"
            style={chipStyles}
          >
            {teamShortName}
          </span>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{player.name}</p>
        <div className="flex items-center gap-1.5 mt-0.5">
          <span className="text-[11px] text-muted-foreground">{role}</span>
          {isSmartXI && (
            <span className="inline-flex items-center gap-0.5 rounded-md border border-gold/40 bg-gold/15 px-1.5 py-px text-[9px] font-bold uppercase tracking-wider text-gold">
              <Sparkles className="h-2.5 w-2.5 fill-gold" />
              Smart XI
            </span>
          )}
        </div>
      </div>
      <span className="text-sm font-semibold tabular-nums shrink-0 text-muted-foreground">{cr.toFixed(1)}</span>
      {isSelected && <Check className="h-4 w-4 shrink-0" style={{ color: checkColor }} />}
    </button>
  )
}
