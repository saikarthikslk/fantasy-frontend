import { FlameIcon } from '@/components/icons/FlameIcon'
import { playerImageUrl } from '@/api/client'
import { normalizeRole } from '@/fantasy/dream11Rules'
import type { ApiPlayer } from '@/types/api'

interface CaptainCardProps {
  player: ApiPlayer
  isCaptain: boolean
  isViceCaptain: boolean
  onClick: () => void
}

export function CaptainCard({ player, isCaptain, isViceCaptain, onClick }: CaptainCardProps) {
  const role = normalizeRole(player.type)
  const assigned = isCaptain || isViceCaptain

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={assigned}
      className={`relative flex items-center gap-3.5 w-full text-left p-4 rounded-2xl border-2 transition-all cursor-pointer active:scale-[0.97] ${
        isCaptain
          ? 'border-gold/20 bg-gold/5 shadow-md shadow-gold/10'
          : isViceCaptain
          ? 'border-primary/20 bg-primary/5 shadow-md shadow-primary/10'
          : 'border-border bg-card hover:border-muted-foreground/30 hover:bg-muted/30'
      }`}
    >
      {/* Avatar with ring */}
      <div className="relative shrink-0">
        <div
          className={`h-14 w-14 rounded-full overflow-hidden bg-muted ${
            isCaptain ? 'ring-[3px] ring-gold' : isViceCaptain ? 'ring-[3px] ring-primary' : 'ring-1 ring-border'
          }`}
        >
          <img
            src={playerImageUrl(player.imageId)}
            alt={player.name}
            className="w-full h-full object-cover"
          />
        </div>
        {/* Role badge overlay */}
        {assigned && (
          <span
            className={`absolute -bottom-1 -right-1 h-6 w-6 rounded-full text-[10px] font-extrabold flex items-center justify-center shadow-sm ${
              isCaptain ? 'bg-blue-500 text-white' : 'bg-violet-500 text-white'
            }`}
          >
            {isCaptain ? 'C' : 'VC'}
          </span>
        )}
      </div>

      {/* Name + meta */}
      <div className="flex-1 min-w-0">
        <p className="text-[15px] font-semibold truncate">{player.name}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <p className="text-xs text-muted-foreground">
            {role} · {player.team?.teamSName ?? player.team?.teamName ?? ''}
          </p>
          {player.totalpoints != null && player.totalpoints > 0 && (
            <span
              className="inline-flex items-center gap-0.5 text-[11px] font-bold text-gold tabular-nums"
              title="Total fantasy points earned this season"
              aria-label={`${player.totalpoints} fantasy points earned this season`}
            >
              <FlameIcon className="h-2.5 w-2.5" />
              {player.totalpoints}
            </span>
          )}
        </div>
      </div>

      {/* Multiplier badge */}
      {assigned ? (
        <span
          className={`shrink-0 px-3 py-1.5 rounded-full text-sm font-bold ${
            isCaptain
              ? 'bg-gold text-black'
              : 'bg-primary text-primary-foreground'
          }`}
        >
          {isCaptain ? '2x' : '1.5x'}
        </span>
      ) : (
        <span className="shrink-0 px-2.5 py-1 rounded-full text-xs text-muted-foreground/50 border border-dashed border-border">
          Tap
        </span>
      )}
    </button>
  )
}
