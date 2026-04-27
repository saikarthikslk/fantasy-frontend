import { Check } from 'lucide-react'
import { playerImageUrl } from '@/api/client'
import { creditsForPlayer, normalizeRole } from '@/fantasy/dream11Rules'
import { getTeamColors } from '@/fantasy/teamColors'
import type { ApiPlayer } from '@/types/api'

interface PlayerPoolCardProps {
  player: ApiPlayer
  isSelected: boolean
  isDisabled: boolean
  onClick: () => void
}

export function PlayerPoolCard({ player, isSelected, isDisabled, onClick }: PlayerPoolCardProps) {
  const cr = creditsForPlayer(player)
  const role = normalizeRole(player.type)
  const teamShort = player.team?.teamSName ?? player.team?.teamName ?? ''
  const colors = getTeamColors(player.team?.teamSName)

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isDisabled}
      className={`flex items-center gap-3 w-full text-left p-3 rounded-xl border transition-all cursor-pointer ${
        isSelected
          ? colors.selected
          : isDisabled
          ? 'opacity-30 cursor-not-allowed'
          : 'border-transparent bg-muted/40 hover:bg-muted/70 active:scale-[0.98]'
      }`}
    >
      {/* Avatar + team badge column */}
      <div className="flex flex-col items-center gap-1 shrink-0 w-11">
        <img
          className="h-10 w-10 rounded-full object-cover bg-muted"
          src={playerImageUrl(player.imageId)}
          alt=""
          loading="lazy"
        />
        {teamShort && (
          <span
            className="px-1.5 py-px rounded-md text-[9px] font-bold uppercase tracking-wider leading-none"
            style={{
              backgroundColor: `${colors.accent}1F`,
              color: colors.ink,
            }}
          >
            {teamShort}
          </span>
        )}
      </div>

      {/* Name + role */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{player.name}</p>
        <p className="text-[11px] text-muted-foreground">{role}</p>
      </div>

      {/* Credits + check */}
      <div className="flex items-center gap-2 shrink-0">
        <span className="text-sm font-semibold tabular-nums text-muted-foreground">{cr.toFixed(1)}</span>
        {isSelected && <Check className={`h-4 w-4 ${colors.check}`} />}
      </div>
    </button>
  )
}
