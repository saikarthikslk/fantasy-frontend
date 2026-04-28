import { useState } from "react";
import { playerImageUrl } from "@/api/client";

interface Player {
  playerid: string;
  name: string;
  points?: number;
  url?: string;
  team?: string;
  isCaptain?: boolean;
  isViceCaptain?: boolean;
}

interface PitchViewProps {
  groups: {
    WK: Player[];
    BAT: Player[];
    AR: Player[];
    BOWL: Player[];
  };
  rank?: number | null;
}

// Helper to determine first team (will be considered "team 1")
function getFirstTeam(groups: PitchViewProps['groups']): string | undefined {
  const allPlayers = [...groups.WK, ...groups.BAT, ...groups.AR, ...groups.BOWL];
  return allPlayers.find(p => p.team)?.team;
}

function PlayerCard({ player, isTeam1 }: { player: Player; isTeam1: boolean }) {
  const [imgErr, setImgErr] = useState(false);
  const initials = player.name?.split(" ").map((w) => w[0]).slice(0, 2).join("") || "?";

  // Team 1: dark chip with white text, Team 2: light chip with black text
  const chipBgColor = isTeam1 ? '#1a1a1a' : '#ffffff';
  const chipTextColor = isTeam1 ? '#ffffff' : '#000000';

  return (
    <div className="flex flex-col items-center gap-1.5 relative">
      {/* Captain/VC Badge */}
      {(player.isCaptain || player.isViceCaptain) && (
        <div
          className={`absolute -top-1 -left-1 h-5 w-5 rounded-full text-[10px] font-extrabold flex items-center justify-center z-10 ${
            player.isCaptain ? "bg-gold text-black" : "bg-primary text-primary-foreground"
          }`}
        >
          {player.isCaptain ? "C" : "VC"}
        </div>
      )}

      {/* Player Avatar */}
      <div className="relative mb-3">
        <div className="h-14 w-14 rounded-full overflow-hidden flex items-center justify-center bg-muted border-2 border-white/20">
          {player.url && !imgErr ? (
            <img
              src={playerImageUrl(Number(player.url))}
              alt={player.name}
              onError={() => setImgErr(true)}
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-sm font-bold text-white">{initials}</span>
          )}
        </div>

        {/* Player Name - overlapping above avatar */}
        <div
          className="absolute left-1/2 -translate-x-1/2 px-2 py-0.5 text-center z-20 whitespace-nowrap"
          style={{ bottom: '-10px', borderRadius: '4px', backgroundColor: chipBgColor }}
        >
          <p className="text-[9px] font-semibold" style={{ color: chipTextColor }}>
            {player.name.split(" ").slice(-1)[0]}
          </p>
        </div>
      </div>

      {/* Points */}
      <p className="text-[11px] font-bold text-white tabular-nums">
        {player.points != null ? `${player.points.toFixed(0)} Pts` : "— Pts"}
      </p>
    </div>
  );
}

export function PitchView({ groups, rank }: PitchViewProps) {
  // Determine the first team and get team names
  const firstTeam = getFirstTeam(groups);
  const allPlayers = [...groups.WK, ...groups.BAT, ...groups.AR, ...groups.BOWL];
  const team1Name = firstTeam || 'Team 1';
  const team2Name = allPlayers.find(p => p.team && p.team !== firstTeam)?.team || 'Team 2';

  return (
    <div className="relative w-full h-full overflow-y-auto">
      {/* Pitch background */}
      <div
        className="min-h-full p-6 pb-12 relative"
        style={{
          background: '#011c00',
          backgroundImage: `
            repeating-linear-gradient(90deg, #011c00, #011c00 52.5px, #011400 52.5px, #011400 105px)
          `,
        }}
      >
        {/* Wicket Keepers */}
        {groups.WK.length > 0 && (
          <div className="mb-6 relative">
            {/* Rank display - top left, center-aligned with heading */}
            {rank != null && (
              <div className="absolute left-0 top-0 flex items-center h-[11px]">
                <p className="text-[32px] font-bold text-white/50 leading-none">
                  #{rank}
                </p>
              </div>
            )}
            <h3 className="text-[11px] font-bold text-white/70 text-center mb-4 uppercase tracking-wider">
              Wicket-Keepers
            </h3>
            <div className="flex justify-center gap-6">
              {groups.WK.map((player) => (
                <PlayerCard key={player.playerid} player={player} isTeam1={player.team === firstTeam} />
              ))}
            </div>
          </div>
        )}

        {/* Batsmen */}
        {groups.BAT.length > 0 && (
          <div className="mb-6">
            <h3 className="text-[11px] font-bold text-white/70 text-center mb-4 uppercase tracking-wider">
              Batters
            </h3>
            <div className="flex justify-center gap-6 flex-wrap">
              {groups.BAT.map((player) => (
                <PlayerCard key={player.playerid} player={player} isTeam1={player.team === firstTeam} />
              ))}
            </div>
          </div>
        )}

        {/* All-Rounders */}
        {groups.AR.length > 0 && (
          <div className="mb-6">
            <h3 className="text-[11px] font-bold text-white/70 text-center mb-4 uppercase tracking-wider">
              All-Rounders
            </h3>
            <div className="flex justify-center gap-6 flex-wrap">
              {groups.AR.map((player) => (
                <PlayerCard key={player.playerid} player={player} isTeam1={player.team === firstTeam} />
              ))}
            </div>
          </div>
        )}

        {/* Bowlers */}
        {groups.BOWL.length > 0 && (
          <div>
            <h3 className="text-[11px] font-bold text-white/70 text-center mb-4 uppercase tracking-wider">
              Bowlers
            </h3>
            <div className="flex justify-center gap-6">
              {groups.BOWL.map((player) => (
                <PlayerCard key={player.playerid} player={player} isTeam1={player.team === firstTeam} />
              ))}
            </div>
          </div>
        )}

        {/* Legend */}
        <div className="absolute bottom-6 left-6 flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#1a1a1a' }} />
            <span className="text-[10px] font-medium text-white/80">{team1Name}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-white" />
            <span className="text-[10px] font-medium text-white/80">{team2Name}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
