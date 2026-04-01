// @ts-nocheck
import { useState, useEffect } from "react";
import { Link, useParams } from 'react-router-dom'
import { apiUrl, getToken, playerImageUrl } from '../api/client'
const ROLE_ORDER = ["WK", "BAT", "AR", "BOWL"];
const ROLE_LABELS = { WK: "Wicket Keeper", BAT: "Batsmen", AR: "All Rounders", BOWL: "Bowlers" };

function assignRole(index) {
  if (index === 0) return "WK";
  if (index < 4) return "BAT";
  if (index < 7) return "AR";
  return "BOWL";
}

function groupByRole(players, captainId, vcId) {
  const groups = { WK: [], BAT: [], AR: [], BOWL: [] };
  players.forEach((p, i) => {
    const role = p.role || assignRole(i);
    groups[role]?.push({
      ...p,
      isCaptain: p.playerid === captainId,
      isViceCaptain: p.playerid === vcId,
    });
  });
  return groups;
}

function Avatar({ player, size = 54 }) {
  console.log(player)
  const [imgErr, setImgErr] = useState(false);
  const initials = player.name?.split(" ").map(w => w[0]).slice(0, 2).join("") || "?";
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%", overflow: "hidden",
      border: player.isCaptain ? "2.5px solid #f9a825" : player.isViceCaptain ? "2.5px solid #a78bfa" : "2px solid rgba(255,255,255,0.15)",
      boxShadow: player.isCaptain ? "0 0 14px rgba(249,168,37,0.5)" : player.isViceCaptain ? "0 0 14px rgba(167,139,250,0.45)" : "none",
      background: "#1e3a5f",
      display: "flex", alignItems: "center", justifyContent: "center",
      flexShrink: 0,
    }}>
      {player.url && !imgErr
        ? <img src={playerImageUrl(player.url)} alt={player.name} onError={() => setImgErr(true)} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        : <span style={{ fontSize: size * 0.26, fontWeight: 700, color: "#fff" }}>{initials}</span>
      }
    </div>
  );
}

function PlayerCard({ player }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, position: "relative" }}>
      {(player.isCaptain || player.isViceCaptain) && (
        <div style={{
          position: "absolute", top: -8, right: -4, zIndex: 2,
          background: player.isCaptain ? "#f9a825" : "#a78bfa",
          color: player.isCaptain ? "#000" : "#fff",
          fontWeight: 800, fontSize: 10,
          width: 20, height: 20, borderRadius: "50%",
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 1px 5px rgba(0,0,0,0.4)",
        }}>
          {player.isCaptain ? "C" : "VC"}
        </div>
      )}
      <Avatar player={player} size={54} />
      <div style={{ background: "rgba(0,0,0,0.62)", backdropFilter: "blur(6px)", borderRadius: 6, padding: "3px 8px", maxWidth: 82, textAlign: "center" }}>
        <div style={{ fontSize: 10.5, fontWeight: 600, color: "#fff", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {player.name?.split(" ").at(-1)}
        </div>
        <div style={{ fontSize: 9.5, color: "#f9a825", fontWeight: 700 }}>
          {player.points ?? "—"} pts
        </div>
      </div>
      <div style={{ fontSize: 9, color: "rgba(255,255,255,0.4)", background: "rgba(255,255,255,0.06)", borderRadius: 4, padding: "1px 5px" }}>
        {player.team || ""}
      </div>
    </div>
  );
}

function RoleRow({ role, players }) {
  if (!players?.length) return null;
  return (
    <div>
      <div style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: 1.3, color: "rgba(255,255,255,0.32)", textAlign: "center", textTransform: "uppercase", marginBottom: 12 }}>
        {ROLE_LABELS[role]}
      </div>
      <div style={{ display: "flex", justifyContent: "center", gap: players.length > 3 ? 12 : 24, flexWrap: "wrap" }}>
        {players.map(p => <PlayerCard key={p.playerid} player={p} />)}
      </div>
    </div>
  );
}

export default function TeamPreview({ matchId, dreamId, close }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const token = getToken();
    setLoading(true);
    setError(null);
    fetch(apiUrl(`dream/${matchId}/${dreamId}`), {
      method: "GET", headers: {

        'key': token, "Content-Type": "application/json"
      }
    })
      .then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
      .then(d => { setData(d); setLoading(false); })
      .catch(e => { setError(e.message); setLoading(false); });
  }, [matchId, dreamId]);

  if (loading) return (
    <div style={{ minHeight: 400, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "#0d1f3c", borderRadius: 20, gap: 14 }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div style={{ width: 36, height: 36, borderRadius: "50%", border: "3px solid rgba(249,168,37,0.15)", borderTop: "3px solid #f9a825", animation: "spin 0.8s linear infinite" }} />
      <div style={{ fontSize: 13, color: "rgba(255,255,255,0.35)" }}>Loading team…</div>
    </div>
  );

  if (error) return (
    <div style={{ minHeight: 300, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "#0d1f3c", borderRadius: 20, gap: 10, padding: 24 }}>
      <div style={{ fontSize: 32 }}>⚠️</div>
      <div style={{ fontSize: 14, fontWeight: 600, color: "#f87171" }}>Failed to load</div>
      <div style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", textAlign: "center" }}>{error}</div>
      <div style={{ fontSize: 11, color: "rgba(255,255,255,0.18)", marginTop: 4 }}>GET /dream/{matchId}/{dreamId}</div>
    </div>
  );

  const { captain, vcaptain, playerEntities = [] } = data;
  const groups = groupByRole(playerEntities, captain, vcaptain);

  const totalPoints = playerEntities.reduce((sum, p) => {
    let pts = p.points ?? 0;
    return sum + pts;
  }, 0);

  const cap = playerEntities.find(p => p.playerid === captain);
  const vc = playerEntities.find(p => p.playerid === vcaptain);

  const teamCounts = Object.values(
    playerEntities.reduce((acc, p) => {
      const name = p.team?.teamname;
      if (!name) return acc;
      acc[name] = acc[name] || { name, count: 0 };
      acc[name].count++;
      return acc;
    }, {})
  );

  return (
    <div style={{ position: "relative", fontFamily: "'Segoe UI', system-ui, sans-serif", maxWidth: 420, margin: "0 auto", borderRadius: 20, overflow: "hidden", boxShadow: "0 16px 56px rgba(0,0,0,0.55)", background: "#0d1f3c" }}>

      <button onClick={close} className="btn btn-primary match-detail-cta" style={{ position: "absolute", right: "120px", top: "20px", color: "black", fontSize: "12px" }}>Close</button>

      {/* Header */}
      <div style={{ background: "linear-gradient(160deg, #091a38 0%, #0c2a60 100%)", padding: "18px 20px 16px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
          <div>
            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.32)", letterSpacing: 1.1, textTransform: "uppercase", marginBottom: 3 }}>Match #{matchId} · Dream #{dreamId}</div>
            <div style={{ fontSize: 19, fontWeight: 700, color: "#fff" }}>Team Preview</div>
          </div>
          <div style={{ background: "rgba(249,168,37,0.08)", border: "1px solid rgba(249,168,37,0.22)", borderRadius: 12, padding: "7px 14px", textAlign: "center" }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: "#f9a825", lineHeight: 1 }}>{Math.round(totalPoints)}</div>
            <div style={{ fontSize: 9, color: "rgba(249,168,37,0.55)", letterSpacing: 0.5, marginTop: 2 }}>TOTAL PTS</div>
          </div>
        </div>

        {/* C / VC chips */}
        <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
          {[{ label: "C", player: cap, color: "#f9a825", tc: "#000", mult: "2×" }, { label: "VC", player: vc, color: "#a78bfa", tc: "#fff", mult: "1.5×" }].map(({ label, player, color, tc, mult }) => (
            <div key={label} style={{ flex: 1, display: "flex", alignItems: "center", gap: 8, background: "rgba(255,255,255,0.04)", border: `1px solid ${color}2e`, borderRadius: 10, padding: "7px 10px" }}>
              <div style={{ width: 22, height: 22, borderRadius: "50%", background: color, color: tc, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 800, flexShrink: 0 }}>{label}</div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, color: "#fff" }}>{player?.name.split(" ").at(-1) ?? "—"}</div>
                <div style={{ fontSize: 9.5, color: "rgba(255,255,255,0.32)" }}>{mult} points</div>
              </div>
            </div>
          ))}
        </div>

        {/* Team composition */}
        {teamCounts.length > 0 && (
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {teamCounts.map((t, i) => (
              <span key={t.name} style={{ fontSize: 11, fontWeight: 700, color: i === 0 ? "#60a5fa" : "#fbbf24", flexShrink: 0 }}>{t.name} {t.count}</span>
            ))}
            <div style={{ flex: 1, height: 5, borderRadius: 3, background: "rgba(255,255,255,0.08)", overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${(teamCounts[0]?.count / playerEntities.length) * 100}%`, background: "linear-gradient(90deg, #3b82f6, #60a5fa)", borderRadius: 3 }} />
            </div>
          </div>
        )}
      </div>

      {/* Pitch */}
      <div style={{
        background: "radial-gradient(ellipse 80% 50% at 50% 10%, rgba(30,80,160,0.16) 0%, transparent 70%), linear-gradient(180deg, #0d1f3c 0%, #081528 100%)",
        padding: "22px 14px", position: "relative", minHeight: 380,
      }}>
        <div style={{ position: "absolute", inset: 0, pointerEvents: "none", backgroundImage: "repeating-linear-gradient(180deg, transparent, transparent 74px, rgba(255,255,255,0.022) 75px)" }} />
        <div style={{ position: "relative", display: "flex", flexDirection: "column", gap: 20 }}>
          {ROLE_ORDER.map(role => <RoleRow key={role} role={role} players={groups[role]} />)}
        </div>
      </div>

      {/* Footer */}
      <div style={{ background: "#06101f", padding: "11px 18px", display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.22)" }}>{playerEntities.length} players</div>
        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.22)", display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#22c55e", display: "inline-block" }} />
          Preview only
        </div>
      </div>
    </div>
  );
}