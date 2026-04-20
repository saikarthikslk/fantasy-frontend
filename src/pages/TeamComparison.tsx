import { useMemo, useState } from "react";
import type { MatchLeaderboardEntry, MatchLbPlayer, ScorecardInnings } from "@/types/api";
import { playerImageUrl } from "@/api/client";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Check, ArrowLeftRight, TrendingUp, TrendingDown, Minus, ChevronLeft, ChevronRight, Users, Sparkles } from "lucide-react";
import {
  Tooltip,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

/* ── Constants ── */

const ROLE_ORDER = ["WK", "BAT", "AR", "BOWL"] as const;
const ROLE_LABELS: Record<string, string> = {
  WK: "Keeper",
  BAT: "Batsmen",
  AR: "All-rounders",
  BOWL: "Bowlers",
};

/* ── Types ── */

type DiffPair = { mine?: MatchLbPlayer; theirs?: MatchLbPlayer; role: string };
type ComparisonContext = "mine" | "theirs" | "common";
type SelectedPlayerState = { player: MatchLbPlayer; context: ComparisonContext } | null;
type RoleDiffGroup = {
  role: string;
  mine: MatchLbPlayer[];
  theirs: MatchLbPlayer[];
  minePts: number;
  theirsPts: number;
  delta: number;
};
type BattingStat = { runs: number; balls: number; fours: number; sixes: number; sr: number };
type BowlingStat = { overs: number; wickets: number; runs: number; economy: number };

/* ── Core comparison logic ── */

function buildComparison(my: MatchLeaderboardEntry, their: MatchLeaderboardEntry) {
  const myIds = new Set(my.playerEntities.map((p) => p.playerid));
  const theirIds = new Set(their.playerEntities.map((p) => p.playerid));

  const common = my.playerEntities.filter((p) => theirIds.has(p.playerid));
  const onlyMine = my.playerEntities.filter((p) => !theirIds.has(p.playerid));
  const onlyTheirs = their.playerEntities.filter((p) => !myIds.has(p.playerid));

  const myByRole: Record<string, MatchLbPlayer[]> = {};
  const theirByRole: Record<string, MatchLbPlayer[]> = {};
  for (const p of onlyMine) (myByRole[p.type] ??= []).push(p);
  for (const p of onlyTheirs) (theirByRole[p.type] ??= []).push(p);

  const allRoles = new Set([...Object.keys(myByRole), ...Object.keys(theirByRole)]);
  const pairs: DiffPair[] = [];
  for (const role of ROLE_ORDER) {
    if (!allRoles.has(role)) continue;
    const m = myByRole[role] ?? [];
    const t = theirByRole[role] ?? [];
    for (let i = 0; i < Math.max(m.length, t.length); i++)
      pairs.push({ mine: m[i], theirs: t[i], role });
  }
  for (const role of allRoles) {
    if ((ROLE_ORDER as readonly string[]).includes(role)) continue;
    const m = myByRole[role] ?? [];
    const t = theirByRole[role] ?? [];
    for (let i = 0; i < Math.max(m.length, t.length); i++)
      pairs.push({ mine: m[i], theirs: t[i], role });
  }

  const captainSame = String(my.captain) === String(their.captain);
  const vcaptainSame = String(my.vcaptain) === String(their.vcaptain);

  return {
    common,
    onlyMine,
    onlyTheirs,
    pairs,
    captainSame,
    vcaptainSame,
    myCaptain: my.playerEntities.find((p) => String(p.playerid) === String(my.captain)),
    theirCaptain: their.playerEntities.find((p) => String(p.playerid) === String(their.captain)),
    myVc: my.playerEntities.find((p) => String(p.playerid) === String(my.vcaptain)),
    theirVc: their.playerEntities.find((p) => String(p.playerid) === String(their.vcaptain)),
  };
}

/* ── Stats helpers ── */

function normName(n: string): string {
  return n.toLowerCase().replace(/[^a-z]/g, "");
}

function buildStatsLookup(
  innings1: ScorecardInnings | null | undefined,
  innings2: ScorecardInnings | null | undefined,
) {
  const battingMap = new Map<string, BattingStat>();
  const bowlingMap = new Map<string, BowlingStat>();
  for (const inn of [innings1, innings2]) {
    if (!inn) continue;
    for (const b of inn.batting) {
      const key = normName(b.name);
      const existing = battingMap.get(key);
      if (existing) {
        existing.runs += b.runs;
        existing.balls += b.balls;
        existing.fours += b.fours;
        existing.sixes += b.sixes;
        existing.sr = existing.balls > 0 ? (existing.runs / existing.balls) * 100 : 0;
      } else {
        battingMap.set(key, { runs: b.runs, balls: b.balls, fours: b.fours, sixes: b.sixes, sr: b.sr });
      }
    }
    for (const bw of inn.bowling) {
      const key = normName(bw.name);
      const existing = bowlingMap.get(key);
      if (existing) {
        existing.overs += bw.overs;
        existing.wickets += bw.wickets;
        existing.runs += bw.runs;
        existing.economy = existing.overs > 0 ? existing.runs / existing.overs : 0;
      } else {
        bowlingMap.set(key, { overs: bw.overs, wickets: bw.wickets, runs: bw.runs, economy: bw.economy });
      }
    }
  }
  return { battingMap, bowlingMap };
}

type SelectedByUser = {
  name: string;
  email: string;
  totalpoints: number;
  asCaptain: boolean;
  asViceCaptain: boolean;
};

function buildSelectedByMap(lbRows: MatchLeaderboardEntry[]): Map<string, SelectedByUser[]> {
  const map = new Map<string, SelectedByUser[]>();
  for (const row of lbRows) {
    for (const p of row.playerEntities ?? []) {
      let list = map.get(p.playerid);
      if (!list) { list = []; map.set(p.playerid, list); }
      list.push({
        name: row.name || row.email,
        email: row.email,
        totalpoints: row.totalpoints,
        asCaptain: p.playerid === row.captain,
        asViceCaptain: p.playerid === row.vcaptain,
      });
    }
  }
  for (const list of map.values()) {
    list.sort((a, b) => b.totalpoints - a.totalpoints);
  }
  return map;
}

/* ── Shared helpers ── */

function Av({ url, name, className = "h-8 w-8" }: { url?: string | number; name: string; className?: string }) {
  const initials = name?.split(" ").map((w) => w[0]).slice(0, 2).join("") || "?";
  const src = url ? playerImageUrl(typeof url === "number" ? url : Number(url)) : null;
  return (
    <Avatar className={`shrink-0 ${className}`}>
      {src && <AvatarImage src={src} alt={name} />}
      <AvatarFallback className="text-[10px] font-bold">{initials}</AvatarFallback>
    </Avatar>
  );
}

function Delta({ a, b }: { a: number; b: number }) {
  const d = a - b;
  if (Math.abs(d) < 0.05) return null;
  return (
    <span className={`text-[10px] tabular-nums font-medium ${d > 0 ? "text-emerald-500" : "text-red-400"}`}>
      {d > 0 ? "+" : ""}{d.toFixed(1)}
    </span>
  );
}

/* ── Role-grouped diff components ── */

function DiffPlayerRow({
  player,
  teamNames,
  onClick,
}: {
  player: MatchLbPlayer;
  teamNames: Record<string, string>;
  onClick: () => void;
}) {
  const team = teamNames[String(player.team)] ?? player.team;
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full flex items-center gap-2.5 px-3 py-2 text-left transition-colors cursor-pointer hover:bg-white/4"
    >
      <Av url={player.url} name={player.name} className="h-7 w-7" />
      <div className="flex-1 min-w-0">
        <p className="text-[12px] font-medium truncate leading-tight">{player.name}</p>
        <p className="text-[10px] text-muted-foreground leading-tight">{team}</p>
      </div>
      <span className="text-[12px] font-semibold tabular-nums shrink-0">{player.points?.toFixed(1) ?? "—"}</span>
      <ChevronRight className="h-3 w-3 text-muted-foreground/25 shrink-0" />
    </button>
  );
}

function DiffRoleCard({
  group,
  teamNames,
  onSelectPlayer,
}: {
  group: RoleDiffGroup;
  teamNames: Record<string, string>;
  onSelectPlayer: (player: MatchLbPlayer, context: ComparisonContext) => void;
}) {
  const { role, mine, theirs, minePts, theirsPts, delta } = group;
  const mineAhead = delta > 0.05;

  return (
    <div className="rounded-xl border border-border/25 overflow-hidden">
      {/* Role header bar */}
      <div className="flex items-center justify-between px-3.5 py-2 bg-foreground/3 border-b border-border/20">
        <span className="text-[11px] font-bold tracking-wide text-foreground/60">
          {ROLE_LABELS[role] ?? role}
        </span>
        {Math.abs(delta) >= 0.05 && (
          <span className={`text-[9px] inline-flex items-center gap-0.5 tabular-nums font-semibold ${mineAhead ? "text-emerald-400/50" : "text-red-400/50"}`}>
            {Math.abs(delta).toFixed(1)}
            {mineAhead ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
          </span>
        )}
      </div>

      {/* Your section */}
      {mine.length > 0 && (
        <div className="m-2 rounded-lg bg-sky-500/8 overflow-hidden">
          <div className="flex items-center justify-between px-3 pt-2 pb-0.5">
            <span className="text-[9px] font-semibold uppercase tracking-wider text-sky-300/60">Your</span>
            <span className="text-[10px] tabular-nums text-sky-300/40">{minePts.toFixed(1)}</span>
          </div>
          {mine.map((p) => (
            <DiffPlayerRow
              key={p.playerid}
              player={p}
              teamNames={teamNames}
              onClick={() => onSelectPlayer(p, "mine")}
            />
          ))}
          <div className="h-0.5" />
        </div>
      )}

      {/* Them section */}
      {theirs.length > 0 && (
        <div className="m-2 mt-0 rounded-lg bg-amber-500/8 overflow-hidden">
          <div className="flex items-center justify-between px-3 pt-2 pb-0.5">
            <span className="text-[9px] font-semibold uppercase tracking-wider text-amber-300/60">Them</span>
            <span className="text-[10px] tabular-nums text-amber-300/40">{theirsPts.toFixed(1)}</span>
          </div>
          <div className="opacity-65">
            {theirs.map((p) => (
              <DiffPlayerRow
                key={p.playerid}
                player={p}
                teamNames={teamNames}
                onClick={() => onSelectPlayer(p, "theirs")}
              />
            ))}
          </div>
          <div className="h-0.5" />
        </div>
      )}
    </div>
  );
}

/* ── ComparisonPlayerContent ── */

function ComparisonPlayerContent({
  player,
  context,
  teamNames,
  batting,
  bowling,
  users,
  totalUsers,
  onClose,
}: {
  player: MatchLbPlayer;
  context: ComparisonContext;
  teamNames: Record<string, string>;
  batting?: BattingStat;
  bowling?: BowlingStat;
  users: SelectedByUser[];
  totalUsers: number;
  onClose: () => void;
}) {
  const team = teamNames[String(player.team)] ?? player.team;
  const pct = totalUsers > 0 ? Math.round((users.length / totalUsers) * 100) : 0;
  const captains = users.filter((u) => u.asCaptain);
  const viceCaptains = users.filter((u) => u.asViceCaptain);
  const contextLabel = context === "mine" ? "Your pick" : context === "theirs" ? "Their pick" : "Common pick";

  return (
    <div className="flex flex-col h-full">
      {/* Back */}
      <button
        type="button"
        onClick={onClose}
        className="flex items-center gap-1.5 px-5 pt-3 pb-2 text-[13px] text-muted-foreground hover:text-foreground transition-colors cursor-pointer self-start"
      >
        <ChevronLeft className="h-4 w-4" />
        Back
      </button>

      {/* Player identity */}
      <div className="px-5 pb-4">
        <div className="flex items-center gap-4 mb-4">
          <Avatar className="h-14 w-14 shrink-0">
            {player.url && <AvatarImage src={playerImageUrl(Number(player.url))} alt={player.name} />}
            <AvatarFallback className="text-base font-bold">
              {player.name?.split(" ").map((w) => w[0]).slice(0, 2).join("") || "?"}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-xl font-bold truncate leading-tight">{player.name}</p>
            <p className="text-[12px] text-muted-foreground mt-0.5">
              {team} · {ROLE_LABELS[player.type] ?? player.type}
            </p>
          </div>
        </div>

        {/* Points */}
        <div className="flex items-center justify-between rounded-xl bg-muted/10 border border-border/20 px-4 py-3.5 mb-3">
          <span className="text-[13px] text-muted-foreground">Fantasy Points</span>
          <span className="text-2xl font-bold tabular-nums">{player.points?.toFixed(1) ?? "—"}</span>
        </div>

        {/* Context chip */}
        <div className="inline-flex items-center rounded-full bg-muted/15 border border-border/20 px-3 py-1.5">
          <span className="text-[11px] font-medium text-muted-foreground">{contextLabel}</span>
        </div>
      </div>

      <Separator />

      {/* Scrollable stats + user list */}
      <div className="flex-1 min-h-0 overflow-y-auto px-5 py-4 space-y-5">
        {/* Batting */}
        {batting && (
          <div>
            <p className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground mb-2.5">Batting</p>
            <div className="grid grid-cols-4 gap-2">
              {[
                { val: batting.runs, label: "Runs" },
                { val: batting.balls, label: "Balls" },
                { val: `${batting.fours}/${batting.sixes}`, label: "4s/6s" },
                { val: batting.sr.toFixed(0), label: "SR" },
              ].map((s) => (
                <div key={s.label} className="rounded-lg bg-muted/10 border border-border/10 px-2 py-2 text-center">
                  <p className="text-base font-bold tabular-nums">{s.val}</p>
                  <p className="text-[9px] text-muted-foreground uppercase">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Bowling */}
        {bowling && bowling.overs > 0 && (
          <div>
            <p className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground mb-2.5">Bowling</p>
            <div className="grid grid-cols-4 gap-2">
              {[
                { val: bowling.wickets, label: "Wkts" },
                { val: bowling.runs, label: "Runs" },
                { val: bowling.overs, label: "Overs" },
                { val: bowling.economy.toFixed(1), label: "Econ" },
              ].map((s) => (
                <div key={s.label} className="rounded-lg bg-muted/10 border border-border/10 px-2 py-2 text-center">
                  <p className="text-base font-bold tabular-nums">{s.val}</p>
                  <p className="text-[9px] text-muted-foreground uppercase">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Captain / VC chips */}
        {users.length > 0 && (
          <div className="grid grid-cols-2 gap-2">
            <div className="flex items-center gap-2.5 rounded-lg border px-3 py-2.5 bg-gold/5 border-gold/20">
              <div className="h-6 w-6 rounded-full text-[10px] font-extrabold flex items-center justify-center shrink-0 bg-gold text-black">
                C
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium tabular-nums">{captains.length}</p>
                <p className="text-[10px] text-gold/60">as captain</p>
              </div>
            </div>
            <div className="flex items-center gap-2.5 rounded-lg border px-3 py-2.5 bg-primary/5 border-primary/20">
              <div className="h-6 w-6 rounded-full text-[10px] font-extrabold flex items-center justify-center shrink-0 bg-primary text-primary-foreground">
                VC
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium tabular-nums">{viceCaptains.length}</p>
                <p className="text-[10px] text-primary/60">as vice-captain</p>
              </div>
            </div>
          </div>
        )}

        {/* Selection bar */}
        {totalUsers > 0 && (
          <div>
            <p className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground mb-2.5">Selection</p>
            <div className="flex items-center gap-2.5 rounded-lg bg-muted/10 border border-border/10 px-3.5 py-3">
              <Users className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              <span className="text-[13px] font-semibold tabular-nums">{users.length}</span>
              <span className="text-[12px] text-muted-foreground">of {totalUsers}</span>
              <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                <div className="h-full rounded-full bg-foreground/50 transition-all" style={{ width: `${pct}%` }} />
              </div>
              <span className="text-[12px] font-semibold tabular-nums">{pct}%</span>
            </div>
          </div>
        )}

        {/* Selected-by user list */}
        {users.length > 0 && (
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
              Selected by
            </p>
            <div>
              {users.map((u) => (
                <div key={u.email} className="flex items-center gap-3 py-2">
                  <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${
                    u.asCaptain
                      ? "ring-2 ring-gold bg-gold/10 text-gold"
                      : u.asViceCaptain
                        ? "ring-2 ring-primary bg-primary/10 text-primary"
                        : "ring-1 ring-border bg-muted text-muted-foreground"
                  }`}>
                    {u.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-medium truncate">{u.name}</p>
                    {u.asCaptain && (
                      <p className="text-[10px] text-gold/60">Captain · 2x pts</p>
                    )}
                    {u.asViceCaptain && (
                      <p className="text-[10px] text-primary/60">Vice-captain · 1.5x pts</p>
                    )}
                    {!u.asCaptain && !u.asViceCaptain && (
                      <p className="text-[10px] text-muted-foreground">Player</p>
                    )}
                  </div>
                  <span className="text-[13px] font-semibold tabular-nums shrink-0">
                    {u.totalpoints.toFixed(1)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {!batting && !(bowling && bowling.overs > 0) && users.length === 0 && (
          <div className="text-center py-6">
            <p className="text-[13px] text-muted-foreground">No additional stats available</p>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Main ── */

export default function TeamComparison({
  myEntry,
  theirEntry,
  theirRank,
  teamNames = {},
  lbRows = [],
  innings1,
  innings2,
}: {
  myEntry: MatchLeaderboardEntry;
  theirEntry: MatchLeaderboardEntry;
  theirRank: number;
  teamNames?: Record<string, string>;
  lbRows?: MatchLeaderboardEntry[];
  innings1?: ScorecardInnings | null;
  innings2?: ScorecardInnings | null;
}) {
  const [selectedPlayer, setSelectedPlayer] = useState<SelectedPlayerState>(null);

  const c = useMemo(() => buildComparison(myEntry, theirEntry), [myEntry, theirEntry]);

  // Group different picks by role
  const roleGroups: RoleDiffGroup[] = useMemo(() => {
    const myByRole: Record<string, MatchLbPlayer[]> = {};
    const theirByRole: Record<string, MatchLbPlayer[]> = {};
    for (const p of c.onlyMine) (myByRole[p.type] ??= []).push(p);
    for (const p of c.onlyTheirs) (theirByRole[p.type] ??= []).push(p);
    const allRoles = new Set([...Object.keys(myByRole), ...Object.keys(theirByRole)]);
    const groups: RoleDiffGroup[] = [];
    for (const role of ROLE_ORDER) {
      if (!allRoles.has(role)) continue;
      const mine = (myByRole[role] ?? []).sort((a, b) => (b.points ?? 0) - (a.points ?? 0));
      const theirs = (theirByRole[role] ?? []).sort((a, b) => (b.points ?? 0) - (a.points ?? 0));
      const minePts = mine.reduce((s, p) => s + (p.points ?? 0), 0);
      const theirsPts = theirs.reduce((s, p) => s + (p.points ?? 0), 0);
      groups.push({ role, mine, theirs, minePts, theirsPts, delta: minePts - theirsPts });
    }
    for (const role of allRoles) {
      if ((ROLE_ORDER as readonly string[]).includes(role)) continue;
      const mine = (myByRole[role] ?? []).sort((a, b) => (b.points ?? 0) - (a.points ?? 0));
      const theirs = (theirByRole[role] ?? []).sort((a, b) => (b.points ?? 0) - (a.points ?? 0));
      const minePts = mine.reduce((s, p) => s + (p.points ?? 0), 0);
      const theirsPts = theirs.reduce((s, p) => s + (p.points ?? 0), 0);
      groups.push({ role, mine, theirs, minePts, theirsPts, delta: minePts - theirsPts });
    }
    return groups;
  }, [c.onlyMine, c.onlyTheirs]);

  const diffPtsMe = c.onlyMine.reduce((s, p) => s + (p.points ?? 0), 0);
  const diffPtsThem = c.onlyTheirs.reduce((s, p) => s + (p.points ?? 0), 0);

  // Batting/bowling from scorecard
  const { battingMap, bowlingMap } = useMemo(
    () => buildStatsLookup(innings1, innings2),
    [innings1, innings2],
  );

  // Selection map from leaderboard
  const selectedByMap = useMemo(() => buildSelectedByMap(lbRows), [lbRows]);

  // Derived data for selected player
  const selectedBatting = selectedPlayer ? battingMap.get(normName(selectedPlayer.player.name)) : undefined;
  const selectedBowling = selectedPlayer ? bowlingMap.get(normName(selectedPlayer.player.name)) : undefined;
  const selectedUsers = selectedPlayer ? selectedByMap.get(selectedPlayer.player.playerid) ?? [] : [];
  const closeDetail = () => setSelectedPlayer(null);
  const detailProps = selectedPlayer ? {
    player: selectedPlayer.player,
    context: selectedPlayer.context,
    teamNames,
    batting: selectedBatting,
    bowling: selectedBowling,
    users: selectedUsers,
    totalUsers: lbRows.length,
    onClose: closeDetail,
  } : null;

  return (
    <div className="flex flex-col h-full relative overflow-hidden">
      {/* ── Score header (fixed) ── */}
      <div className="px-5 pt-5 pb-4 shrink-0">
        <div className="flex items-center gap-4">
          <div className="flex-1 text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <p className="text-[10px] text-muted-foreground">Your</p>
              {myEntry.isauto && (
                <TooltipProvider delayDuration={0}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="inline-flex items-center gap-0.5 rounded border border-amber-500/20 bg-amber-500/10 px-1 py-px text-[9px] font-medium text-amber-400">
                        <Sparkles className="h-2 w-2" />
                        Smart XI
                      </span>
                    </TooltipTrigger>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
            <p className="text-2xl font-bold tabular-nums">{myEntry.totalpoints.toFixed(1)}</p>
          </div>
          {(() => {
            const d = myEntry.totalpoints - theirEntry.totalpoints;
            const tied = Math.abs(d) < 0.05;
            const ahead = d > 0;
            return (
              <div className="flex flex-col items-center gap-0.5">
                {tied ? (
                  <Minus className="h-4 w-4 text-muted-foreground" />
                ) : ahead ? (
                  <TrendingUp className="h-4 w-4 text-emerald-500" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-400" />
                )}
                <span className={`text-[10px] font-semibold ${tied ? "text-muted-foreground" : ahead ? "text-emerald-500" : "text-red-400"}`}>
                  {tied ? "Tied" : `${ahead ? "Ahead" : "Behind"} ${Math.abs(d).toFixed(1)}`}
                </span>
              </div>
            );
          })()}
          <div className="flex-1 text-center">
            <div className="flex items-center justify-center gap-1 mb-1 min-w-0">
              <p className="text-[10px] text-muted-foreground truncate">
                {theirEntry.name}{theirRank > 0 && <span className="opacity-40"> #{theirRank}</span>}
              </p>
              {theirEntry.isauto && (
                <TooltipProvider delayDuration={0}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="shrink-0 inline-flex items-center gap-0.5 rounded border border-amber-500/20 bg-amber-500/10 px-1 py-px text-[9px] font-medium text-amber-400">
                        <Sparkles className="h-2 w-2" />
                        Smart XI
                      </span>
                    </TooltipTrigger>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
            <p className="text-2xl font-bold tabular-nums">{theirEntry.totalpoints.toFixed(1)}</p>
          </div>
        </div>

        {/* Quick stats */}
        <div className="flex items-center justify-center gap-4 mt-4 text-[11px] text-muted-foreground">
          <span><strong className="text-foreground">{c.common.length}</strong> same</span>
          <span className="text-border">|</span>
          <span><strong className="text-foreground">{c.onlyMine.length}</strong> different</span>
          <span className="text-border">|</span>
          <span>C {c.captainSame ? <Check className="inline h-3 w-3 text-emerald-500" /> : <ArrowLeftRight className="inline h-3 w-3 text-amber-400" />}</span>
          <span>VC {c.vcaptainSame ? <Check className="inline h-3 w-3 text-emerald-500" /> : <ArrowLeftRight className="inline h-3 w-3 text-amber-400" />}</span>
        </div>
      </div>

      <Separator className="shrink-0" />

      {/* ── Scrollable body ── */}
      <div className="flex-1 min-h-0 overflow-y-auto">

        {/* ── Captain / VC ── */}
        <div className="px-5 py-3">
          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-x-3 text-[12px]">
            <div className="flex items-center justify-center gap-2">
              <CaptainRow label="C" player={c.myCaptain} />
              <Separator orientation="vertical" className="h-3" />
              <CaptainRow label="VC" player={c.myVc} />
            </div>
            <span className="text-[9px] text-muted-foreground">vs</span>
            <div className="flex items-center justify-center gap-2">
              <CaptainRow label="C" player={c.theirCaptain} />
              <Separator orientation="vertical" className="h-3" />
              <CaptainRow label="VC" player={c.theirVc} />
            </div>
          </div>
        </div>

        {/* ── Different picks (role-grouped) ── */}
        {roleGroups.length > 0 && (
          <>
            <Separator />
            <div className="px-5 py-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">Different picks</p>
                {(() => {
                  const d = diffPtsMe - diffPtsThem;
                  if (Math.abs(d) < 0.05) return <span className="text-[10px] text-muted-foreground">Even</span>;
                  const ahead = d > 0;
                  return (
                    <span
                      className={`text-[10px] inline-flex items-center gap-1 font-semibold tabular-nums ${
                        ahead
                          ? "text-emerald-500"
                          : d < 0
                          ? "text-red-400"
                          : "text-muted-foreground"
                      }`}
                    >
                      Your: {Math.abs(d).toFixed(1)} {ahead ? <TrendingUp className="h-4 w-4 text-emerald-500" /> : <TrendingDown className="h-4 w-4 text-red-400" />}
                    </span>
                  );
                })()}
              </div>

              <div className="space-y-3">
                {roleGroups.map((group) => (
                  <DiffRoleCard
                    key={group.role}
                    group={group}
                    teamNames={teamNames}
                    onSelectPlayer={(player, ctx) => setSelectedPlayer({ player, context: ctx })}
                  />
                ))}
              </div>
            </div>
          </>
        )}

        {/* Identical XI */}
        {roleGroups.length === 0 && (
          <>
            <Separator />
            <div className="px-5 py-8 text-center">
              <Check className="h-6 w-6 text-emerald-500 mx-auto mb-2" />
              <p className="text-sm font-medium">Identical XI</p>
              <p className="text-xs text-muted-foreground mt-0.5">Same 11 players selected</p>
            </div>
          </>
        )}

        {/* ── Common picks (clickable) ── */}
        {c.common.length > 0 && (
          <>
            <Separator />
            <div className="px-5 py-4">
              <p className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground mb-3">
                Common picks <span className="font-normal">({c.common.length})</span>
              </p>
              <div className="space-y-2">
                {c.common.map((p) => (
                  <button
                    key={p.playerid}
                    type="button"
                    onClick={() => setSelectedPlayer({ player: p, context: "common" })}
                    className="w-full flex items-center gap-3 rounded-xl bg-muted/15 px-3 py-2.5 text-left transition-colors cursor-pointer hover:bg-muted/25"
                  >
                    <Av url={p.url} name={p.name} />
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-medium truncate">{p.name}</p>
                      <p className="text-[10px] text-muted-foreground">{teamNames[String(p.team)] ?? p.team} · {ROLE_LABELS[p.type] ?? p.type}</p>
                    </div>
                    <span className="text-[12px] font-semibold tabular-nums">{p.points?.toFixed(1)}</span>
                    <ChevronRight className="h-3 w-3 text-muted-foreground/25 shrink-0" />
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        {/* ── Insight footer ── */}
        <Separator />
        <div className="px-5 py-3 text-[11px] text-muted-foreground flex flex-wrap gap-x-4 gap-y-1">
          <span>{c.common.length}/11 shared</span>
          {!c.captainSame && c.myCaptain && c.theirCaptain && (
            <span>
              Captain delta{" "}
              <Delta a={c.myCaptain.points ?? 0} b={c.theirCaptain.points ?? 0} />
            </span>
          )}
          {c.onlyMine.length > 0 && Math.abs(diffPtsMe - diffPtsThem) >= 0.1 && (
            <span>
              Diff picks{" "}
              <Delta a={diffPtsMe} b={diffPtsThem} />
            </span>
          )}
        </div>

      </div>{/* end scrollable body */}

      {/* ── Slide-in detail panel (replaces comparison content in-place) ── */}
      <div
        className="absolute inset-0 z-10 bg-background flex flex-col"
        style={{
          transform: selectedPlayer ? "translateX(0)" : "translateX(100%)",
          transition: "transform 350ms cubic-bezier(0.32, 0.72, 0, 1)",
          pointerEvents: selectedPlayer ? "auto" : "none",
        }}
      >
        {detailProps && <ComparisonPlayerContent {...detailProps} />}
      </div>
    </div>
  );
}

/* ── Sub-components ── */

function CaptainRow({
  label,
  player,
}: {
  label: "C" | "VC";
  player?: MatchLbPlayer;
}) {
  const accent = label === "C" ? "text-amber-500" : "text-primary";
  const name = player?.name.split(" ").pop() ?? "—";
  return (
    <span className="flex items-center gap-1.5">
      <span className={`font-bold ${accent}`}>{label}</span>
      <span className="font-medium">{name}</span>
    </span>
  );
}
