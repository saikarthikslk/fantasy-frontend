import { useMemo } from "react";
import type { MatchLeaderboardEntry, MatchLbPlayer } from "../types/api";
import { playerImageUrl } from "../api/client";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Check, ArrowLeftRight } from "lucide-react";

const ROLE_ORDER = ["WK", "BAT", "AR", "BOWL"] as const;
const ROLE_LABELS: Record<string, string> = {
  WK: "Keeper",
  BAT: "Batsmen",
  AR: "All-rounders",
  BOWL: "Bowlers",
};

type DiffPair = { mine?: MatchLbPlayer; theirs?: MatchLbPlayer; role: string };

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

/* ── Helpers ── */

function Av({ url, name, className = "" }: { url?: string | number; name: string; className?: string }) {
  const initials = name?.split(" ").map((w) => w[0]).slice(0, 2).join("") || "?";
  const src = url ? playerImageUrl(typeof url === "number" ? url : Number(url)) : null;
  return (
    <Avatar className={`h-8 w-8 shrink-0 ${className}`}>
      {src && <AvatarImage src={src} alt={name} />}
      <AvatarFallback className="text-[10px] font-bold">{initials}</AvatarFallback>
    </Avatar>
  );
}

function Pts({ value }: { value?: number | null }) {
  return (
    <span className="text-xs font-semibold tabular-nums shrink-0">
      {value != null ? value.toFixed(1) : "—"}
    </span>
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

/* ── Main ── */

export default function TeamComparison({
  myEntry,
  theirEntry,
  theirRank,
  teamNames = {},
}: {
  myEntry: MatchLeaderboardEntry;
  theirEntry: MatchLeaderboardEntry;
  theirRank: number;
  teamNames?: Record<string, string>;
}) {
  const c = useMemo(() => buildComparison(myEntry, theirEntry), [myEntry, theirEntry]);

  const diffPtsMe = c.onlyMine.reduce((s, p) => s + (p.points ?? 0), 0);
  const diffPtsThem = c.onlyTheirs.reduce((s, p) => s + (p.points ?? 0), 0);

  return (
    <div className="flex flex-col h-full">
      {/* ── Score header (fixed) ── */}
      <div className="px-5 pt-5 pb-4 shrink-0">
        <div className="flex items-center gap-4">
          <div className="flex-1 text-center">
            <p className="text-[10px] text-muted-foreground mb-1">You</p>
            <p className="text-2xl font-bold tabular-nums">{myEntry.totalpoints.toFixed(1)}</p>
          </div>
          <div className="flex flex-col items-center gap-0.5">
            <span className="text-[9px] uppercase tracking-wider text-muted-foreground">vs</span>
            <Delta a={myEntry.totalpoints} b={theirEntry.totalpoints} />
          </div>
          <div className="flex-1 text-center">
            <p className="text-[10px] text-muted-foreground mb-1 truncate">
              {theirEntry.name}{theirRank > 0 && <span className="opacity-40"> #{theirRank}</span>}
            </p>
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
          {/* You */}
          <div className="flex items-center justify-center gap-2">
            <CaptainRow label="C" player={c.myCaptain} />
            <Separator orientation="vertical" className="h-3" />
            <CaptainRow label="VC" player={c.myVc} />
          </div>
          <span className="text-[9px] text-muted-foreground">vs</span>
          {/* Them */}
          <div className="flex items-center justify-center gap-2">
            <CaptainRow label="C" player={c.theirCaptain} />
            <Separator orientation="vertical" className="h-3" />
            <CaptainRow label="VC" player={c.theirVc} />
          </div>
        </div>
      </div>

      {/* ── Different picks ── */}
      {c.pairs.length > 0 && (
        <>
          <Separator />
          <div className="px-5 py-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">Different picks</p>
              <Delta a={diffPtsMe} b={diffPtsThem} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-[10px] text-muted-foreground mb-2">You</p>
                <div className="space-y-2">
                  {c.onlyMine.map((p) => (
                    <DiffCell key={p.playerid} player={p} teamNames={teamNames} />
                  ))}
                </div>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground mb-2">Them</p>
                <div className="space-y-2">
                  {c.onlyTheirs.map((p) => (
                    <DiffCell key={p.playerid} player={p} teamNames={teamNames} />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Identical XI */}
      {c.pairs.length === 0 && (
        <>
          <Separator />
          <div className="px-5 py-8 text-center">
            <Check className="h-6 w-6 text-emerald-500 mx-auto mb-2" />
            <p className="text-sm font-medium">Identical XI</p>
            <p className="text-xs text-muted-foreground mt-0.5">Same 11 players selected</p>
          </div>
        </>
      )}

      {/* ── Common picks ── */}
      {c.common.length > 0 && (
        <>
          <Separator />
          <div className="px-5 py-4">
            <p className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground mb-3">
              Common picks <span className="font-normal">({c.common.length})</span>
            </p>
            <div className="space-y-2">
              {c.common.map((p) => (
                <div
                  key={p.playerid}
                  className="flex items-center gap-3 rounded-xl bg-muted/15 px-3 py-2.5"
                >
                  <Av url={p.url} name={p.name} className="h-8 w-8" />
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-medium truncate">{p.name}</p>
                    <p className="text-[10px] text-muted-foreground">{ROLE_LABELS[p.type] ?? p.type}</p>
                  </div>
                  <span className="text-[12px] font-semibold tabular-nums">{p.points?.toFixed(1)}</span>
                </div>
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

function DiffCell({ player, teamNames = {} }: { player?: MatchLbPlayer; teamNames?: Record<string, string> }) {
  if (!player) {
    return <div className="rounded-lg border border-dashed border-border/30 h-12" />;
  }
  const team = teamNames[String(player.team)] ?? player.team;
  return (
    <div className="flex items-center gap-2 rounded-lg bg-muted/20 px-2.5 py-2">
      <Av url={player.url} name={player.name} className="h-7 w-7" />
      <div className="flex-1 min-w-0">
        <p className="text-[12px] font-medium truncate leading-tight">{player.name}</p>
        <p className="text-[10px] text-muted-foreground leading-tight">{team}</p>
      </div>
      <Pts value={player.points} />
    </div>
  );
}
