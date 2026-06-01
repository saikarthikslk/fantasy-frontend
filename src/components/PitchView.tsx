import { useState } from "react";
import { playerImageUrl } from "@/api/client";
import { getTeamBrandColor } from "@/fantasy/teamColors";
import { cn, shortPlayerName } from "@/lib/utils";

interface Player {
  playerid: string;
  name: string;
  points?: number;
  url?: string;
  team?: string;
  isCaptain?: boolean;
  isViceCaptain?: boolean;
}

type RoleKey = "WK" | "BAT" | "AR" | "BOWL";

interface PitchViewProps {
  groups: Record<RoleKey, Player[]>;
  rank?: number | null;
  isLive?: boolean;
}

const ROLE_ORDER: RoleKey[] = ["WK", "BAT", "AR", "BOWL"];
const ROLE_LABELS: Record<RoleKey, string> = {
  WK: "WK",
  BAT: "BAT",
  AR: "AR",
  BOWL: "BOWL",
};

function PlayerToken({ player }: { player: Player }) {
  const [imgErr, setImgErr] = useState(false);
  const initials =
    player.name?.split(" ").map((w) => w[0]).slice(0, 2).join("") || "?";
  const teamColor = getTeamBrandColor(player.team);

  return (
    <div className="ptoken flex flex-col items-center min-w-0 group">
      <div className="relative shrink-0">
        <div
          className="avatar rounded-full overflow-hidden bg-muted transition-transform duration-200 group-hover:scale-105 flex items-center justify-center"
          style={{
            boxShadow: `0 0 0 2px ${teamColor}, 0 0 0 4px var(--color-background)`,
          }}
        >
          {player.url && !imgErr ? (
            <img
              src={playerImageUrl(Number(player.url))}
              alt={player.name}
              onError={() => setImgErr(true)}
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="initials font-bold text-foreground/85">
              {initials}
            </span>
          )}
        </div>

        {(player.isCaptain || player.isViceCaptain) && (
          <div
            className={cn(
              "cv-pill absolute font-extrabold flex items-center justify-center",
              player.isCaptain
                ? "bg-gold text-black"
                : "bg-primary text-primary-foreground"
            )}
          >
            {player.isCaptain ? "C" : "VC"}
          </div>
        )}
      </div>

      <p className="pname font-semibold text-foreground/90 truncate leading-tight" title={player.name}>
        {shortPlayerName(player.name, 0)}
      </p>

      {player.points != null && (
        <p className="ppts font-semibold tabular-nums text-muted-foreground leading-none">
          {player.points.toFixed(0)} pts
        </p>
      )}
    </div>
  );
}

function RoleRow({
  role,
  players,
}: {
  role: RoleKey;
  players: Player[];
}) {
  if (!players.length) return null;
  const lanes = players.length >= 5 ? 2 : 1;

  return (
    <div
      className={cn(
        "role-row flex flex-row items-center min-h-0 gap-2 px-1",
        lanes === 2 ? "flex-[2_1_0]" : "flex-[1_1_0]"
      )}
    >
      <span className="role-label-side shrink-0 text-center font-bold uppercase text-muted-foreground tracking-[0.12em] leading-tight">
        {ROLE_LABELS[role]}
      </span>
      <div
        className={cn(
          "row-players flex-1 flex flex-wrap items-center justify-center content-center min-h-0 px-0.5",
          lanes === 2 ? "row-players-2" : "row-players-1"
        )}
      >
        {players.map((p) => (
          <PlayerToken key={p.playerid} player={p} />
        ))}
      </div>
      <span className="role-label-side shrink-0 opacity-0 pointer-events-none" aria-hidden>
        {ROLE_LABELS[role]}
      </span>
    </div>
  );
}

/** Very subtle cricket-field backdrop — soft green tint, faint pitch strip, atmospheric glow. */
function SubtleBackdrop() {
  return (
    <>
      {/* Base green wash — gentle, brightest at top center */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 90% 75% at 50% -10%, oklch(0.18 0.07 155) 0%, oklch(0.11 0.03 155) 45%, oklch(0.07 0.01 155) 100%)",
        }}
        aria-hidden
      />

      {/* Pitch strip — tan ribbon down the center, soft glow */}
      <div
        className="absolute top-[6%] bottom-[6%] left-1/2 -translate-x-1/2 w-[14%] pointer-events-none"
        style={{
          background:
            "linear-gradient(180deg, transparent 0%, oklch(0.55 0.06 80 / 0.09) 22%, oklch(0.55 0.06 80 / 0.12) 50%, oklch(0.55 0.06 80 / 0.09) 78%, transparent 100%)",
          borderLeft: "1px dashed oklch(0.65 0.06 80 / 0.14)",
          borderRight: "1px dashed oklch(0.65 0.06 80 / 0.14)",
        }}
        aria-hidden
      />

      {/* Atmospheric top glow — stadium-light depth */}
      <div
        className="absolute top-0 left-0 right-0 h-[38%] pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 65% 100% at 50% 0%, oklch(0.55 0.1 155 / 0.12) 0%, transparent 70%)",
        }}
        aria-hidden
      />

      {/* Dot grid — outfield texture, fades from center */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.06]"
        style={{
          backgroundImage:
            "radial-gradient(oklch(0.985 0 0) 1px, transparent 1px)",
          backgroundSize: "24px 24px",
          maskImage:
            "radial-gradient(ellipse 75% 85% at 50% 50%, transparent 20%, black 85%)",
          WebkitMaskImage:
            "radial-gradient(ellipse 75% 85% at 50% 50%, transparent 20%, black 85%)",
        }}
        aria-hidden
      />

      {/* Edge vignette — focuses attention center */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 100% 100% at 50% 50%, transparent 55%, oklch(0.05 0.005 155 / 0.6) 100%)",
        }}
        aria-hidden
      />
    </>
  );
}

export function PitchView({ groups, rank, isLive = false }: PitchViewProps) {
  return (
    <div className="pitch-view relative w-full h-full overflow-hidden">
      <style>{PITCH_STYLES}</style>

      <SubtleBackdrop />

      {/* Rank watermark — large, very faint, top-right */}
      {rank != null && (
        <div className="absolute top-3 right-4 pointer-events-none select-none z-10">
          <p className="text-[44px] font-black text-foreground/5 leading-none tracking-tighter">
            #{rank}
          </p>
        </div>
      )}

      <div className="roster relative h-full flex flex-col px-2.5 py-3 gap-1">
        {ROLE_ORDER.map((role) => (
          <RoleRow
            key={role}
            role={role}
            players={groups[role]}
          />
        ))}
      </div>
    </div>
  );
}

/**
 * Container-query-driven sizing.
 * The roster element is the container; avatar/text/gaps scale with its size.
 * Targets phone sheet heights from ~400px (worst case Chrome Android, URL bar visible)
 * up to ~700px+ (large devices, URL bar collapsed).
 */
const PITCH_STYLES = `
  .pitch-view .roster {
    container-type: size;
    container-name: roster;
  }

  /* base (smallest) — works down to ~360px container height */
  .pitch-view .avatar { width: 30px; height: 30px; }
  .pitch-view .initials { font-size: 10px; }
  .pitch-view .pname { font-size: 9.5px; max-width: 64px; margin-top: 3px; }
  .pitch-view .ppts { font-size: 8.5px; margin-top: 2px; }
  .pitch-view .role-label-side { font-size: 8.5px; width: 30px; }
  .pitch-view .cv-pill {
    top: -3px; right: -4px;
    height: 13px; min-width: 13px; padding: 0 2px;
    border-radius: 9999px;
    font-size: 7px;
    box-shadow: 0 0 0 2px var(--color-background);
  }
  .pitch-view .row-players { gap: 4px 3px; }
  .pitch-view .row-players-2 { gap: 6px 3px; }
  .pitch-view .row-players-2 .ptoken { flex-basis: calc(33.333% - 4px); flex-grow: 0; flex-shrink: 1; }
  .pitch-view .row-players-1 .ptoken { flex-basis: 0; flex-grow: 1; max-width: 84px; }
  .pitch-view .ptoken { padding: 1px; }

  /* medium container — ~440px+ container height */
  @container roster (min-height: 440px) {
    .pitch-view .avatar { width: 36px; height: 36px; }
    .pitch-view .initials { font-size: 11px; }
    .pitch-view .pname { font-size: 10.5px; max-width: 72px; margin-top: 4px; }
    .pitch-view .ppts { font-size: 9.5px; margin-top: 2px; }
    .pitch-view .role-label-side { font-size: 9px; width: 32px; }
    .pitch-view .cv-pill { height: 15px; min-width: 15px; font-size: 7.5px; }
    .pitch-view .row-players { gap: 6px 4px; }
    .pitch-view .row-players-2 { gap: 10px 4px; }
  }

  /* large container — ~560px+ container height */
  @container roster (min-height: 560px) {
    .pitch-view .avatar { width: 42px; height: 42px; }
    .pitch-view .initials { font-size: 12px; }
    .pitch-view .pname { font-size: 11px; max-width: 80px; margin-top: 5px; }
    .pitch-view .ppts { font-size: 10px; margin-top: 3px; }
    .pitch-view .role-label-side { font-size: 9.5px; width: 36px; }
    .pitch-view .cv-pill { height: 17px; min-width: 17px; font-size: 8.5px; }
    .pitch-view .row-players-2 { gap: 16px 6px; }
  }
`;
