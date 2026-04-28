import { useState } from "react";
import { playerImageUrl } from "@/api/client";
import { getTeamBrandColor } from "@/fantasy/teamColors";
import { cn } from "@/lib/utils";

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

const ROLE_LABELS: Record<keyof PitchViewProps["groups"], string> = {
  WK: "Wicket-Keepers",
  BAT: "Batters",
  AR: "All-Rounders",
  BOWL: "Bowlers",
};

function PlayerCard({ player }: { player: Player }) {
  const [imgErr, setImgErr] = useState(false);
  const initials =
    player.name?.split(" ").map((w) => w[0]).slice(0, 2).join("") || "?";
  const teamColor = getTeamBrandColor(player.team);

  return (
    <div className="flex flex-col items-center gap-1.5 min-w-0 group">
      <div className="relative">
        {/* Avatar with team-brand-colored ring (via boxShadow for dynamic colors) */}
        <div
          className="h-11 w-11 rounded-full overflow-hidden bg-muted transition-transform duration-200 group-hover:scale-105"
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
            <span className="w-full h-full flex items-center justify-center text-[11px] font-bold text-foreground">
              {initials}
            </span>
          )}
        </div>

        {/* Captain / Vice-Captain badge */}
        {(player.isCaptain || player.isViceCaptain) && (
          <div
            className={cn(
              "absolute -top-1 -right-1 h-[18px] w-[18px] rounded-full text-[9px] font-extrabold flex items-center justify-center ring-2 ring-background shadow-sm",
              player.isCaptain
                ? "bg-gold text-black"
                : "bg-primary text-primary-foreground"
            )}
          >
            {player.isCaptain ? "C" : "VC"}
          </div>
        )}
      </div>

      {/* Name */}
      <p className="text-[11px] font-medium text-foreground/90 max-w-[72px] truncate leading-tight">
        {player.name.split(" ").slice(-1)[0]}
      </p>

      {/* Points */}
      <p className="text-[10px] font-semibold tabular-nums text-muted-foreground leading-none">
        {player.points != null ? `${player.points.toFixed(0)} pts` : "— pts"}
      </p>
    </div>
  );
}

function RoleSection({
  label,
  players,
}: {
  label: string;
  players: Player[];
}) {
  if (!players.length) return null;
  return (
    <div className="flex-1 min-h-0 flex flex-col justify-center gap-2.5">
      {/* Section header with hairline separators */}
      <div className="flex items-center gap-2.5">
        <div className="h-px flex-1 bg-linear-to-r from-transparent to-border" />
        <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          {label}
        </span>
        <span className="text-[9px] font-bold tabular-nums text-foreground/30 px-1.5 py-0.5 rounded-full border border-border/60">
          {players.length}
        </span>
        <div className="h-px flex-1 bg-linear-to-l from-transparent to-border" />
      </div>

      {/* Players row */}
      <div className="flex justify-around items-start gap-2 flex-wrap">
        {players.map((p) => (
          <PlayerCard key={p.playerid} player={p} />
        ))}
      </div>
    </div>
  );
}

/** Cricket field — stumps with bails, popping + return creases. */
function Wicket({ position }: { position: "top" | "bottom" }) {
  const isTop = position === "top";
  return (
    <div
      className={cn(
        "absolute left-1/2 -translate-x-1/2 pointer-events-none flex flex-col items-center",
        isTop ? "top-[10.5%]" : "bottom-[10.5%] flex-col-reverse"
      )}
      aria-hidden
    >
      {/* Popping crease with return crease ticks */}
      <div className="relative w-[44px] h-px bg-foreground/20">
        <span className="absolute -left-px top-1/2 -translate-y-1/2 w-px h-2 bg-foreground/15" />
        <span className="absolute -right-px top-1/2 -translate-y-1/2 w-px h-2 bg-foreground/15" />
      </div>
      {/* Bowling crease (closer to stumps) */}
      <div className={cn("w-[32px] h-px bg-foreground/12", isTop ? "mt-1.5" : "mb-1.5")} />
      {/* Bails */}
      <div
        className={cn(
          "w-3 h-px bg-foreground/30 shadow-[0_0_2px_oklch(0.985_0_0/0.3)]",
          isTop ? "mt-0.5" : "mb-0.5"
        )}
      />
      {/* Stumps */}
      <div className={cn("flex gap-[3px]", isTop ? "mt-px" : "mb-px")}>
        <span className="w-px h-2 bg-foreground/35" />
        <span className="w-px h-2 bg-foreground/35" />
        <span className="w-px h-2 bg-foreground/35" />
      </div>
    </div>
  );
}

/** Cricket-themed backdrop — boundary, 30-yard circle, pitch strip, wickets, vignette. */
function CricketBackdrop() {
  return (
    <>
      {/* Base radial spotlight — green tint, brightest at top */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 85% 65% at 50% -5%, oklch(0.20 0.05 155) 0%, oklch(0.10 0.02 155) 50%, oklch(0.07 0.01 155) 100%)",
        }}
      />

      {/* Field markings — outer boundary, inner boundary (dashed), 30-yard circle */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none"
        viewBox="0 0 100 140"
        preserveAspectRatio="none"
        aria-hidden
      >
        <defs>
          <radialGradient id="fieldGlow" cx="50%" cy="0%" r="80%">
            <stop offset="0%" stopColor="oklch(0.30 0.08 155)" stopOpacity="0.18" />
            <stop offset="60%" stopColor="oklch(0.20 0.05 155)" stopOpacity="0.06" />
            <stop offset="100%" stopColor="oklch(0.10 0.02 155)" stopOpacity="0" />
          </radialGradient>
        </defs>
        {/* Subtle field illumination */}
        <ellipse cx="50" cy="70" rx="46" ry="64" fill="url(#fieldGlow)" />
        {/* Outer boundary — solid */}
        <ellipse
          cx="50"
          cy="70"
          rx="46"
          ry="64"
          fill="none"
          stroke="oklch(0.55 0.08 155)"
          strokeOpacity="0.18"
          strokeWidth="0.22"
        />
        {/* Inner soft boundary — dashed */}
        <ellipse
          cx="50"
          cy="70"
          rx="42"
          ry="58"
          fill="none"
          stroke="oklch(0.55 0.08 155)"
          strokeOpacity="0.10"
          strokeWidth="0.1"
          strokeDasharray="0.6 1.8"
        />
        {/* 30-yard inner circle — fielding restriction */}
        <ellipse
          cx="50"
          cy="70"
          rx="24"
          ry="34"
          fill="none"
          stroke="oklch(0.55 0.08 155)"
          strokeOpacity="0.09"
          strokeWidth="0.1"
          strokeDasharray="0.8 1.4"
        />
      </svg>

      {/* Pitch strip — warm tan ribbon (worn wicket) layered over green */}
      <div
        className="absolute top-[8%] bottom-[8%] left-1/2 -translate-x-1/2 w-[18%] pointer-events-none rounded-[1px]"
        style={{
          background: [
            // Worn-wicket centerline (warm tan)
            "linear-gradient(180deg, transparent 0%, oklch(0.50 0.06 80 / 0.05) 15%, oklch(0.55 0.07 80 / 0.07) 50%, oklch(0.50 0.06 80 / 0.05) 85%, transparent 100%)",
            // Green tint underneath for the wicket grass
            "linear-gradient(180deg, transparent 0%, oklch(0.45 0.10 155 / 0.04) 15%, oklch(0.45 0.10 155 / 0.04) 85%, transparent 100%)",
          ].join(", "),
          borderLeft: "1px dashed oklch(0.65 0.06 80 / 0.10)",
          borderRight: "1px dashed oklch(0.65 0.06 80 / 0.10)",
          boxShadow: "inset 0 0 24px oklch(0.45 0.10 155 / 0.06)",
        }}
      />

      {/* Wickets — top + bottom (popping crease, bowling crease, bails, stumps) */}
      <Wicket position="top" />
      <Wicket position="bottom" />

      {/* Subtle dot grid (outfield texture) — fades toward center for legibility */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.045]"
        style={{
          backgroundImage:
            "radial-gradient(oklch(0.985 0 0) 1px, transparent 1px)",
          backgroundSize: "22px 22px",
          maskImage:
            "radial-gradient(ellipse 70% 80% at 50% 50%, transparent 20%, black 80%)",
          WebkitMaskImage:
            "radial-gradient(ellipse 70% 80% at 50% 50%, transparent 20%, black 80%)",
        }}
      />

      {/* Corner vignette — adds depth + focuses attention */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 100% 100% at 50% 50%, transparent 50%, oklch(0.06 0.01 155 / 0.55) 100%)",
        }}
      />

      {/* Top stadium-light glow — adds atmosphere */}
      <div
        className="absolute top-0 left-0 right-0 h-[40%] pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 60% 100% at 50% 0%, oklch(0.55 0.08 155 / 0.07) 0%, transparent 70%)",
        }}
      />
    </>
  );
}

export function PitchView({ groups, rank }: PitchViewProps) {
  return (
    <div className="relative w-full h-full overflow-hidden">
      <CricketBackdrop />

      {/* Rank watermark — large, very faint, top-right */}
      {rank != null && (
        <div className="absolute top-3 right-4 pointer-events-none select-none z-10">
          <p className="text-[44px] font-black text-foreground/5 leading-none tracking-tighter">
            #{rank}
          </p>
        </div>
      )}

      {/* Content — 4 role tiers distributed evenly */}
      <div className="relative h-full flex flex-col px-4 py-3">
        {(["WK", "BAT", "AR", "BOWL"] as const).map((role) => (
          <RoleSection
            key={role}
            label={ROLE_LABELS[role]}
            players={groups[role]}
          />
        ))}
      </div>
    </div>
  );
}
