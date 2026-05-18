// @ts-nocheck
import { useState, useEffect, useRef } from "react";
import { apiUrl, getToken, playerImageUrl } from "../api/client";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { AlertCircle, Sparkles, LayoutGrid, List } from "lucide-react";
import { getTeamBrandColor } from "@/fantasy/teamColors";
import {
  Tooltip,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { PitchView } from "@/components/PitchView";
import { ViewToggle } from "@/components/ui/view-toggle";

const ROLE_ORDER = ["WK", "BAT", "AR", "BOWL"];
const ROLE_LABELS = { WK: "Wicket Keeper", BAT: "Batsmen", AR: "All Rounders", BOWL: "Bowlers" };

function assignRole(index) {
  if (index === 0) return "WK";
  if (index < 4) return "BAT";
  if (index < 7) return "AR";
  return "BOWL";
}

const ROLE_NORMALIZE = {
  wk: "WK", keeper: "WK", wicketkeeper: "WK", "wicket keeper": "WK",
  bat: "BAT", batsman: "BAT", batsmen: "BAT", batter: "BAT",
  ar: "AR", allrounder: "AR", "all-rounder": "AR", "all rounder": "AR",
  bowl: "BOWL", bowler: "BOWL",
};

function normalizeRole(type, index) {
  if (!type) return assignRole(index);
  const key = String(type).toLowerCase().replace(/[-_\s]/g, "");
  if (["WK", "BAT", "AR", "BOWL"].includes(type)) return type;
  return ROLE_NORMALIZE[key] ?? assignRole(index);
}

function groupByRole(players, captainId, vcId) {
  const groups = { WK: [], BAT: [], AR: [], BOWL: [] };
  players.forEach((p, i) => {
    const role = normalizeRole(p.type, i);
    groups[role].push({
      ...p,
      isCaptain: String(p.playerid) === String(captainId),
      isViceCaptain: String(p.playerid) === String(vcId),
    });
  });
  return groups;
}

function PlayerRow({ player, isLive }) {
  const [imgErr, setImgErr] = useState(false);
  const initials = player.name?.split(" ").map((w) => w[0]).slice(0, 2).join("") || "?";
  const teamColor = getTeamBrandColor(player.team);

  return (
    <div className="group flex items-center gap-3 py-2 px-2 rounded-lg hover:bg-card/60 transition-colors">
      {/* Avatar with team-color ring */}
      <div className="relative shrink-0">
        <div
          className="h-10 w-10 rounded-full overflow-hidden bg-muted flex items-center justify-center"
          style={{
            boxShadow: `0 0 0 2px ${teamColor}, 0 0 0 4px var(--color-background)`,
          }}
        >
          {player.url && !imgErr ? (
            <img
              src={playerImageUrl(player.url)}
              alt={player.name}
              onError={() => setImgErr(true)}
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-xs font-bold text-foreground/85">{initials}</span>
          )}
        </div>
        {(player.isCaptain || player.isViceCaptain) && (
          <div
            className={`absolute -top-1 -right-1 h-[18px] min-w-[18px] px-1 rounded-full text-[9px] font-extrabold flex items-center justify-center ring-2 ring-background ${
              player.isCaptain ? "bg-gold text-black" : "bg-primary text-primary-foreground"
            }`}
          >
            {player.isCaptain ? "C" : "VC"}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate text-foreground/95">{player.name}</p>
        {player.team && (
          <p className="text-[11px] font-medium tracking-wide" style={{ color: teamColor }}>
            {player.team}
          </p>
        )}
      </div>

      {/* Points — live only */}
      {isLive && (
        <div className="flex items-baseline gap-1 shrink-0 tabular-nums">
          <span className="text-base font-bold text-foreground">
            {player.points != null ? player.points.toFixed(1) : "—"}
          </span>
          <span className="text-[10px] text-muted-foreground uppercase tracking-wider">pts</span>
        </div>
      )}
    </div>
  );
}

function RoleGroup({ role, players, isLive }) {
  if (!players?.length) return null;
  return (
    <div>
      {/* Centered hairline header — matches grid-view aesthetic */}
      <div className="flex items-center gap-3 mb-2 px-1">
        <span
          className="h-px flex-1"
          style={{
            background: "linear-gradient(90deg, transparent, var(--color-border) 60%)",
          }}
        />
        <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
          {ROLE_LABELS[role]}
        </span>
        <span
          className="h-px flex-1"
          style={{
            background: "linear-gradient(90deg, var(--color-border) 40%, transparent)",
          }}
        />
      </div>
      <div className="space-y-0.5">
        {players.map((p) => (
          <PlayerRow key={p.playerid} player={p} isLive={isLive} />
        ))}
      </div>
    </div>
  );
}

interface TeamPreviewProps {
  matchId: number;
  dreamId: number;
  lbEntry?: unknown;
  teamNames?: Record<string, string>;
  rank?: number | null;
  totalPlayers?: number | null;
  isLive?: boolean;
}

export default function TeamPreview({ matchId, dreamId, lbEntry = null, teamNames = {}, rank = null, totalPlayers = null, isLive = false }: TeamPreviewProps) {
  const [data, setData] = useState(lbEntry);
  const [loading, setLoading] = useState(!lbEntry);
  const [error, setError] = useState(null);
  const [showPitchView, setShowPitchView] = useState(true);

  // Track previous lbEntry to detect changes without triggering cascading renders
  const prevLbEntryRef = useRef(lbEntry);

  useEffect(() => {
    // If lbEntry changed, schedule state update
    if (lbEntry && lbEntry !== prevLbEntryRef.current) {
      prevLbEntryRef.current = lbEntry;
      // Use requestAnimationFrame to batch state updates and avoid cascading renders
      requestAnimationFrame(() => {
        setData(lbEntry);
        setLoading(false);
        setError(null);
      });
      return;
    }

    // Only fetch if no lbEntry is provided
    if (lbEntry) {
      return;
    }

    // Use async function to avoid setState warning for async operations
    const fetchData = async () => {
      const token = getToken();
      try {
        const response = await fetch(apiUrl(`dream/${matchId}/${dreamId}`), {
          method: "GET",
          headers: { key: token, "Content-Type": "application/json" },
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const d = await response.json();
        setData(d);
        setLoading(false);
      } catch (e) {
        setError(e.message);
        setLoading(false);
      }
    };

    setLoading(true);
    setError(null);
    fetchData();
  }, [matchId, dreamId, lbEntry]);

  if (loading) {
    return (
      <div className="flex flex-col h-full">
        {/* Header skeleton — matches loaded header */}
        <div className="p-6 pb-4 pt-5 shrink-0 space-y-4">
          <Skeleton className="h-3 w-28" />
          <div className="flex items-baseline gap-2">
            <Skeleton className="h-9 w-20" />
            <Skeleton className="h-4 w-6" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Skeleton className="h-14 rounded-lg" />
            <Skeleton className="h-14 rounded-lg" />
          </div>
          <Skeleton className="h-1.5 w-full rounded-full" />
        </div>
        <Separator className="shrink-0" />
        {/* Player rows skeleton — 11 players */}
        <div className="flex-1 min-h-0 p-6 pt-4 space-y-3">
          {Array.from({ length: 11 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="h-9 w-9 rounded-full shrink-0" />
              <div className="flex-1 space-y-1">
                <Skeleton className="h-3.5 w-28" />
                <Skeleton className="h-2.5 w-16" />
              </div>
              <Skeleton className="h-4 w-10" />
            </div>
          ))}
        </div>
        {/* Footer skeleton */}
        <div className="border-t px-6 py-3 flex items-center justify-between shrink-0">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-3 w-20" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 p-6 py-20">
        <AlertCircle className="h-8 w-8 text-destructive" />
        <p className="text-sm font-medium text-destructive">Failed to load team</p>
        <p className="text-xs text-muted-foreground">{error}</p>
      </div>
    );
  }

  const { captain, vcaptain, playerEntities = [] } = data;
  const resolveTeam = (t) => {
    if (!t) return "";
    const key = typeof t === "object" ? String(t.teamId ?? t.teamid ?? "") : String(t);
    return teamNames[key] ?? (typeof t === "object" ? (t.teamSName ?? t.teamName ?? t.teamname ?? key) : key);
  };
  const players = playerEntities.map((p) => ({ ...p, team: resolveTeam(p.team) }));
  const groups = groupByRole(players, captain, vcaptain);
  const totalPoints = players.reduce((sum, p) => sum + (p.points ?? 0), 0);

  const teamCounts = Object.values(
    players.reduce((acc, p) => {
      if (!p.team) return acc;
      acc[p.team] = acc[p.team] || { name: p.team, count: 0 };
      acc[p.team].count++;
      return acc;
    }, {})
  );

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className={`p-6 pt-5 shrink-0 pb-4`} data-drag-zone="true">
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <p className="text-[11px] text-muted-foreground tracking-wide uppercase">
              Squad
            </p>
            {data.isauto && (
              <TooltipProvider delayDuration={0}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="inline-flex items-center gap-1 rounded-md border border-amber-500/20 bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-medium text-amber-400">
                      <Sparkles className="h-2.5 w-2.5" />
                      Smart XI
                    </span>
                  </TooltipTrigger>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
          {rank != null && totalPlayers != null && (
            <p className="text-[11px] text-muted-foreground tracking-wide uppercase">
              {rank}/{totalPlayers}
            </p>
          )}
        </div>

        {/* Hero — total points (live) or player count (pre-match) + view toggle */}
        <div className="flex items-center justify-between">
          {isLive ? (
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold tabular-nums text-foreground leading-none">
                {totalPoints.toFixed(1)}
              </span>
              <span className="text-sm text-muted-foreground">pts</span>
            </div>
          ) : (
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold tabular-nums text-foreground leading-none">
                {playerEntities.length}
              </span>
              <span className="text-sm text-muted-foreground">players</span>
            </div>
          )}

          <ViewToggle
            isActive={showPitchView}
            onToggle={() => setShowPitchView(!showPitchView)}
            leftIcon={LayoutGrid}
            rightIcon={List}
          />
        </div>
      </div>

      <Separator className="shrink-0" />

      {/* Player list or Pitch view */}
      {showPitchView ? (
        <div className="flex-1 min-h-0 overflow-hidden">
          <PitchView groups={groups} rank={rank} isLive={isLive} />
        </div>
      ) : (
        <div className="flex-1 min-h-0 overflow-y-auto p-4 pt-4 space-y-5">
          {ROLE_ORDER.map((role) => (
            <RoleGroup key={role} role={role} players={groups[role]} isLive={isLive} />
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="border-t px-6 py-3 shrink-0 space-y-1.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center justify-center gap-3">
            <span className="text-xs text-muted-foreground">
              {playerEntities.length} players
            </span>
            {teamCounts.length > 0 && (
              teamCounts.map((t, i) => (
                <span
                  key={t.name}
                  className={`text-[11px] font-medium ${i === 0 ? "text-blue-400" : "text-gold"}`}
                >
                  {t.name}: {t.count}
                </span>
              ))
            )}
          </div>
          <div className={`flex items-center gap-1.5 text-xs ${isLive ? "text-emerald-400" : "text-muted-foreground"}`}>
            <span className="relative flex h-1.5 w-1.5">
              {isLive && (
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              )}
              <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${isLive ? "bg-emerald-400" : "bg-primary"}`} />
            </span>
            {isLive ? "Live updates" : "Preview only"}
          </div>
        </div>
      </div>
    </div>
  );
}
