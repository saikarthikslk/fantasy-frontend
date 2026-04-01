import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  fetchMatchLeaderboard,
  fetchMatches,
  fetchMatchesbyid,
  fetchScorecard,
} from "../api/matchesApi";
import type {
  ApiMatch,
  MatchLeaderboardEntry,
  ScorecardApiResponse,
  ScorecardInnings,
} from "../types/api";
import TeamPreview from "./TeamPreview";
import { apiUrl } from "../api/client";

type DetailTab = "scorecard" | "leaderboard";
type SortKey = "name" | "totalpoints";
type SortDir = "asc" | "desc";

function formatWhen(startDate: number): string {
  const ms = String(startDate).length <= 10 ? startDate * 1000 : startDate;
  return new Date(ms).toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function base64ToBlobUrl(base64: string | null | undefined): string | null {
  if (!base64) return null;
  try {
    const raw = window.atob(base64);
    const uInt8Array = new Uint8Array(raw.length);
    for (let i = 0; i < raw.length; ++i) uInt8Array[i] = raw.charCodeAt(i);
    const blob = new Blob([uInt8Array], { type: "image/png" });
    return URL.createObjectURL(blob);
  } catch {
    return null;
  }
}

/* ═══════════════════════════════════════════════
   Parse scorecard API response
   ═══════════════════════════════════════════════ */

function parseInnings(raw: string | null | undefined): ScorecardInnings | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    return {
      batting: (parsed.batting ?? []).map((b: any) => ({
        name: b.name ?? "",
        dismissal: b.dismissal ?? "not out",
        runs: b.runs ?? 0,
        balls: b.balls ?? 0,
        fours: b.fours ?? 0,
        sixes: b.sixes ?? 0,
        sr: b.sr ?? 0,
      })),
      bowling: (parsed.bowling ?? []).map((bw: any) => ({
        name: bw.name ?? "",
        overs: bw.overs ?? 0,
        maidens: bw.maidens ?? 0,
        runs: bw.runs ?? 0,
        wickets: bw.wickets ?? 0,
        economy: bw.economy ?? 0,
        wides: bw.wides ?? 0,
        nb: bw.nb ?? 0,
      })),
      extras: {
        total: parsed.extras?.total ?? 0,
        wides: parsed.extras?.wides ?? 0,
        noBalls: parsed.extras?.noBalls ?? 0,
        byes: parsed.extras?.byes ?? 0,
        legByes: parsed.extras?.legByes ?? 0,
        penalty: parsed.extras?.penalty ?? 0,
      },
      total: {
        runs: parsed.total?.runs ?? 0,
        wickets: parsed.total?.wickets ?? 0,
        overs: parsed.total?.overs ?? 0,
        runRate: parsed.total?.runRate ?? 0,
      },
    };
  } catch {
    return null;
  }
}

/** Resolve team name from match data using team ID string from scorecard */
function resolveTeamName(
  match: ApiMatch | null,
  teamIdStr: string | undefined,
  fallback: string,
): string {
  if (!match || !teamIdStr) return fallback;
  const tid = Number(teamIdStr);
  if (match.team1?.teamId === tid)
    return match.team1.teamSName ?? match.team1.teamName ?? fallback;
  if (match.team2?.teamId === tid)
    return match.team2.teamSName ?? match.team2.teamName ?? fallback;
  return fallback;
}

/* ═══════════════════════════════════════════════
   Scorecard View Component
   ═══════════════════════════════════════════════ */

function ScorecardView({
  innings,
  teamName,
}: {
  innings: ScorecardInnings;
  teamName: string;
}) {
  return (
    <div className="sc-innings-body">
      {/* Batting */}
      <div className="sc-section">
        <div className="sc-section-head">{teamName} — Batting</div>
        <table className="sc-table">
          <thead>
            <tr>
              <th className="sc-th-batter">Batter</th>
              <th className="sc-th-num">R</th>
              <th className="sc-th-num">B</th>
              <th className="sc-th-num">4s</th>
              <th className="sc-th-num">6s</th>
              <th className="sc-th-num">S/R</th>
            </tr>
          </thead>
          <tbody>
            {innings.batting.map((b, i) => {
              const isOut = b.dismissal !== "not out";
              return (
                <tr
                  key={i}
                  className={`sc-bat-row${!isOut ? " sc-bat-row--notout" : ""}`}
                >
                  <td className="sc-bat-cell">
                    <div className="sc-avatar">{b.name.charAt(0)}</div>
                    <div className="sc-bat-info">
                      <span className="sc-bat-name">
                        {b.name}
                        {!isOut && (
                          <span className="sc-notout-star" title="not out">
                            ★
                          </span>
                        )}
                      </span>
                      <span className="sc-dismissal">{b.dismissal}</span>
                    </div>
                  </td>
                  <td
                    className={`sc-num${b.runs >= 50 ? " sc-num--fifty" : ""}${b.runs >= 100 ? " sc-num--century" : ""}`}
                  >
                    {b.runs}
                  </td>
                  <td className="sc-num">{b.balls}</td>
                  <td className="sc-num">{b.fours}</td>
                  <td className="sc-num">{b.sixes}</td>
                  <td className="sc-num">{b.sr.toFixed(2)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <div className="sc-extras-row">
          <span className="sc-extras-label">Extras</span>
          <span className="sc-extras-detail">
            (w {innings.extras.wides}, nb {innings.extras.noBalls}, b{" "}
            {innings.extras.byes}, lb {innings.extras.legByes})
          </span>
          <span className="sc-extras-val">{innings.extras.total}</span>
        </div>
        <div className="sc-total-row">
          <span className="sc-total-label">Total</span>
          <span className="sc-total-score">
            {innings.total.runs}/{innings.total.wickets}
          </span>
          <span className="sc-total-overs">
            ({innings.total.overs} Ov, RR: {innings.total.runRate.toFixed(2)})
          </span>
        </div>
      </div>

      {/* Bowling */}
      <div className="sc-section sc-section--bowl">
        <div className="sc-section-head">Bowling</div>
        <table className="sc-table">
          <thead>
            <tr>
              <th className="sc-th-batter">Bowler</th>
              <th className="sc-th-num">O</th>
              <th className="sc-th-num">M</th>
              <th className="sc-th-num">R</th>
              <th className="sc-th-num">W</th>
              <th className="sc-th-num">Econ</th>
            </tr>
          </thead>
          <tbody>
            {innings.bowling.map((bw, i) => (
              <tr
                key={i}
                className={`sc-bowl-row${bw.wickets >= 3 ? " sc-bowl-row--star" : ""}`}
              >
                <td className="sc-bat-cell">
                  <div className="sc-avatar sc-avatar--bowl">
                    {bw.name.charAt(0)}
                  </div>
                  <div className="sc-bat-info">
                    <span className="sc-bat-name">{bw.name}</span>
                  </div>
                </td>
                <td className="sc-num">{bw.overs}</td>
                <td className="sc-num">{bw.maidens}</td>
                <td className="sc-num">{bw.runs}</td>
                <td
                  className={`sc-num${bw.wickets >= 3 ? " sc-num--fifty" : ""}`}
                >
                  {bw.wickets}
                </td>
                <td className="sc-num">{bw.economy.toFixed(1)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   Main Match Detail Page
   ═══════════════════════════════════════════════ */

export function MatchDetail() {
  const { matchId: mid } = useParams<{ matchId: string }>();
  const matchId = Number(mid);

  const [previewDid, setPreviewDid] = useState<number | null>(null);
  const [isTeamCreated, setIsTeamCreated] = useState(false);
  const [myDreamId, setMyDreamId] = useState<number | null>(null);

  const [rows, setRows] = useState<ApiMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [tab, setTab] = useState<DetailTab>("scorecard");
  const [scInningsIdx, setScInningsIdx] = useState<0 | 1>(0);

  /* Scorecard state */
  const [scRaw, setScRaw] = useState<ScorecardApiResponse | null>(null);
  const [scLoading, setScLoading] = useState(true);
  const [scError, setScError] = useState<string | null>(null);

  /* Leaderboard state */
  const [lbRows, setLbRows] = useState<MatchLeaderboardEntry[]>([]);
  const [lbLoading, setLbLoading] = useState(true);
  const [lbError, setLbError] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>("totalpoints");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

   const refreshData = () => {
        let cancelled = false;

    console.log("Refreshing data...");

 
    fetchScorecard(matchId)
      .then((data) => {
        if (!cancelled) setScRaw(data);
      })
      .catch((e: unknown) => {
        if (!cancelled)
          setScError(
            e instanceof Error ? e.message : "Failed to load scorecard",
          );
      })
      .finally(() => {
  
      });

    fetchMatchLeaderboard(matchId)
      .then((data) => {
        if (!cancelled) setLbRows(data ?? []);
      })
      .catch((e: unknown) => {
        if (!cancelled)
          setLbError(
            e instanceof Error ? e.message : "Failed to load leaderboard",
          );
      })
      .finally(() => {
    
      });




   }
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    fetchMatches()
      .then((data) => {
        if (!cancelled) setRows(data);
      })
      .catch((e: unknown) => {
        if (!cancelled)
          setError(e instanceof Error ? e.message : "Failed to load");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    fetchMatchesbyid(matchId)
      .then((data) => {
        if (cancelled) return;
        if (data?.dreamTeam != null) {
          setIsTeamCreated(true);
          setMyDreamId(data.dreamTeam.id);
        } else {
          setIsTeamCreated(false);
          setMyDreamId(null);
        }
      })
      .catch(() => {
        if (!cancelled) setIsTeamCreated(false);
      });

    /* Fetch real scorecard */
    setScLoading(true);
    setScError(null);
    fetchScorecard(matchId)
      .then((data) => {
        if (!cancelled) setScRaw(data);
      })
      .catch((e: unknown) => {
        if (!cancelled)
          setScError(
            e instanceof Error ? e.message : "Failed to load scorecard",
          );
      })
      .finally(() => {
        if (!cancelled) setScLoading(false);
      });

    setLbLoading(true);
    setLbError(null);
    fetchMatchLeaderboard(matchId)
      .then((data) => {
        if (!cancelled) setLbRows(data ?? []);
      })
      .catch((e: unknown) => {
        if (!cancelled)
          setLbError(
            e instanceof Error ? e.message : "Failed to load leaderboard",
          );
      })
      .finally(() => {
        if (!cancelled) setLbLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [matchId]);

  useEffect(() => {
    const es = new EventSource(apiUrl('/api/stream/notif/'+matchId));

    es.addEventListener('open', () => {
        console.log('SSE connection established');
    });

    es.addEventListener('refresh', (e) => {
      console.log('Received refresh event:', e.data);
    refreshData();
  
       
    });

  
    es.onmessage = (e) => {
        console.log('Generic message:', e.data);
    };

    es.onerror = (e) => {
        console.error('SSE error:', e);
    };

    // Cleanup: runs when component unmounts or dependencies change
    return () => {
        es.close();
    };
}, []);


  const match = useMemo(
    () => rows.find((m) => m.matchId === matchId) ?? null,
    [rows, matchId],
  );

  /* Parse scorecard innings */
  const innings1 = useMemo(() => parseInnings(scRaw?.innings1), [scRaw]);
  const innings2 = useMemo(() => parseInnings(scRaw?.innings2), [scRaw]);

  /* Resolve team names for each innings using teamId from scorecard */
  const team1Name = useMemo(
    () => resolveTeamName(match, scRaw?.team1, "Team 1"),
    [match, scRaw],
  );
  const team2Name = useMemo(
    () => resolveTeamName(match, scRaw?.team2, "Team 2"),
    [match, scRaw],
  );

  const activeInnings = scInningsIdx === 0 ? innings1 : innings2;
  const activeTeamName = scInningsIdx === 0 ? team1Name : team2Name;
  const hasScorecard = innings1 != null || innings2 != null;

  /* Determine match result */
  const matchResult = useMemo(() => {
    if(!match || match.state !== "Completed") return null;
    if (!innings1 || !innings2) return scRaw?.matchstatus ?? null;
    if (innings1.total.runs > innings2.total.runs)
      return `${team1Name} won by ${innings1.total.runs - innings2.total.runs} runs`;
    if (innings2.total.runs > innings1.total.runs)
      return `${team2Name} won by ${10 - innings2.total.wickets} wickets`;
    return "Match tied";
  }, [innings1, innings2, team1Name, team2Name, scRaw]);

  /* Leaderboard helpers */
  const filteredSortedLbRows = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = q
      ? lbRows.filter(
          (r) =>
            r.name.toLowerCase().includes(q) || String(r.did ?? "").includes(q),
        )
      : lbRows;
    const copy = [...filtered];
    copy.sort((a, b) => {
      const dir = sortDir === "asc" ? 1 : -1;
      if (sortKey === "totalpoints")
        return (a.totalpoints - b.totalpoints) * dir;
      return a[sortKey].localeCompare(b[sortKey]) * dir;
    });
    return copy;
  }, [lbRows, query, sortKey, sortDir]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredSortedLbRows.length / pageSize),
  );
  const start = (page - 1) * pageSize;
  const pageRows = filteredSortedLbRows.slice(start, start + pageSize);

  useEffect(() => {
    setPage(1);
  }, [query, sortKey, sortDir, pageSize, matchId]);
  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const onSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setSortDir(key === "totalpoints" ? "desc" : "asc");
    }
  };
  const sortArrow = (key: SortKey) =>
    sortKey === key ? (sortDir === "asc" ? "▲" : "▼") : "";

  const t1 = match?.team1?.teamSName ?? match?.team1?.teamName ?? "Team 1";
  const t2 = match?.team2?.teamSName ?? match?.team2?.teamName ?? "Team 2";

  if (!Number.isFinite(matchId)) {
    return (
      <div className="page">
        <p>Invalid match.</p>
        <Link to="/matches">Back to matches</Link>
      </div>
    );
  }
  console.log(match);
  return (
    <div className="page match-detail-page">
      <nav className="breadcrumb" aria-label="Breadcrumb">
        <Link to="/matches">Matches</Link>
        <span aria-hidden> / </span>
        <span>{match ? `${t1} vs ${t2}` : "Match"}</span>
      </nav>

      {loading && <p className="muted">Loading match…</p>}
      {error && (
        <div className="alert alert-error" role="alert">
          {error}
        </div>
      )}
      {!loading && !error && !match && (
        <div className="match-detail-miss">
          <p>Match not found.</p>
          <Link to="/matches" className="btn btn-primary">
            Back to matches
          </Link>
        </div>
      )}

      {previewDid != null && (
        <div className="md-modal-backdrop">
          <div className="md-modal-shell">
            <TeamPreview
              matchId={matchId}
              dreamId={previewDid}
              close={() => setPreviewDid(null)}
            />
          </div>
        </div>
      )}

      {!loading && match && (
        <>
          <header className="match-detail-hero">
            <div>
              <p className="eyebrow">{match.seriesName ?? "Cricket"}</p>
              <h1 className="match-detail-title">
                <span className="match-detail-team">{t1}</span>
                <span className="match-detail-vs">vs</span>
                <span className="match-detail-team">{t2}</span>
              </h1>
              <p className="muted match-detail-meta">
                {formatWhen(match.startDate)}
                <br></br>
                {match.venueInfo?.ground
                  ? ` ·  ${match.venueInfo.ground.length > 30 ? match.venueInfo.ground.substring(0, 30) + "..." : match.venueInfo.ground}`
                  : ""}
                {match.venueInfo?.city ? ` · ${match.venueInfo.city}` : ""}
              </p>
              <p className="match-detail-status">
                <span className="status-pill">
                  {match.status ?? match.state ?? "—"}
                </span>
              </p>
            </div>
            <div className="match-detail-actions">
              {isTeamCreated && myDreamId != null && (
                <button
                  type="button"
                  className="btn btn-ghost match-detail-cta"
                  onClick={() => setPreviewDid(myDreamId)}
                >
                  Preview My Team
                </button>
              )}

              {match.state === "Upcoming" && (
                <Link
                  to={`/match/${match.matchId}/create/${isTeamCreated ? "edit" : "new"}`}
                  className="btn btn-primary match-detail-cta"
                >
                  {isTeamCreated ? "Edit Dream team" : "Dream team"}
                </Link>
              )}
            </div>
          </header>

          <div className="detail-tabs" role="tablist" aria-label="Match detail">
            <button
              type="button"
              role="tab"
              aria-selected={tab === "scorecard"}
              className={`detail-tab${tab === "scorecard" ? " detail-tab--on" : ""}`}
              onClick={() => setTab("scorecard")}
            >
              Scorecard
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={tab === "leaderboard"}
              className={`detail-tab${tab === "leaderboard" ? " detail-tab--on" : ""}`}
              onClick={() => setTab("leaderboard")}
            >
              Leaderboard
            </button>
          </div>

          {/* ══════ SCORECARD TAB ══════ */}
          {tab === "scorecard" && (
            <section
              className="detail-panel"
              role="tabpanel"
              aria-label="Scorecard"
            >
              <h2 className="sr-only">Scorecard</h2>

              {scLoading && <p className="muted">Loading scorecard…</p>}
              {scError && (
                <div className="alert alert-error" role="alert">
                  {scError}
                </div>
              )}

              {!scLoading && !scError && !hasScorecard && (
                <div className="match-detail-miss">
                  <p className="muted">
                    Scorecard not available yet for this match.
                  </p>
                </div>
              )}

              {!scLoading && !scError && hasScorecard && (
                <>
                  {/* Toss info */}
                  {scRaw?.matchstatus && (
                    <div className="sc-toss-bar">🪙 {scRaw.matchstatus}</div>
                  )}

                  {/* Score summary banner */}
                  <div className="sc-banner">
                    <div
                      className={`sc-banner-team${innings1 && innings2 && innings1.total.runs >= innings2.total.runs ? " sc-banner-team--win" : ""}`}
                    >
                      <span className="sc-banner-name">{team1Name}</span>
                      <span className="sc-banner-score">
                        {innings1
                          ? `${innings1.total.runs}/${innings1.total.wickets}`
                          : "—"}
                      </span>
                      {innings1 && (
                        <span className="sc-banner-ov">
                          ({innings1.total.overs} Ov)
                        </span>
                      )}
                    </div>
                    <div className="sc-banner-mid">
                      <span className="sc-banner-vs">VS</span>
                    </div>
                    <div
                      className={`sc-banner-team${innings1 && innings2 && innings2.total.runs >= innings1.total.runs ? " sc-banner-team--win" : ""}`}
                    >
                      <span className="sc-banner-name">{team2Name}</span>
                      <span className="sc-banner-score">
                        {innings2
                          ? `${innings2.total.runs}/${innings2.total.wickets}`
                          : "—"}
                      </span>
                      {innings2 && (
                        <span className="sc-banner-ov">
                          ({innings2.total.overs} Ov)
                        </span>
                      )}
                    </div>
                  </div>
                  {matchResult && (
                    <div className="sc-result">{matchResult}</div>
                  )}

                  {/* Innings toggle tabs */}
                  <div className="sc-team-tabs">
                    {innings1 && (
                      <button
                        type="button"
                        className={`sc-team-tab${scInningsIdx === 0 ? " sc-team-tab--on" : ""}`}
                        onClick={() => setScInningsIdx(0)}
                      >
                        {team1Name}
                      </button>
                    )}
                    {innings2 && (
                      <button
                        type="button"
                        className={`sc-team-tab${scInningsIdx === 1 ? " sc-team-tab--on" : ""}`}
                        onClick={() => setScInningsIdx(1)}
                      >
                        {team2Name}
                      </button>
                    )}
                  </div>

                  {activeInnings && (
                    <ScorecardView
                      innings={activeInnings}
                      teamName={activeTeamName}
                    />
                  )}
                </>
              )}
            </section>
          )}

          {/* ══════ LEADERBOARD TAB ══════ */}
          {tab === "leaderboard" && (
            <section
              className="detail-panel"
              role="tabpanel"
              aria-label="Leaderboard"
            >
              <h2 className="sr-only">Leaderboard</h2>
              {lbLoading && <p className="muted">Loading leaderboard…</p>}
              {lbError && (
                <div className="alert alert-error" role="alert">
                  {lbError}
                </div>
              )}
              {!lbLoading && !lbError && (
                <div className="match-lb-panel">
                  <div className="lb-toolbar">
                    <input
                      type="search"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      className="lb-search"
                      placeholder="Search by name or dream id"
                    />
                    <label className="lb-pagesize">
                      Rows
                      <select
                        value={pageSize}
                        onChange={(e) => setPageSize(Number(e.target.value))}
                      >
                        <option value={5}>5</option>
                        <option value={10}>10</option>
                        <option value={20}>20</option>
                      </select>
                    </label>
                  </div>
                  <table className="leaderboard-table match-lb-table">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Pic</th>
                        <th>
                          <button
                            className="lb-sort"
                            type="button"
                            onClick={() => onSort("name")}
                          >
                            Name {sortArrow("name")}
                          </button>
                        </th>
                        <th>
                          <button
                            className="lb-sort"
                            type="button"
                            onClick={() => onSort("totalpoints")}
                          >
                            Points {sortArrow("totalpoints")}
                          </button>
                        </th>
                        <th>Preview</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pageRows.map((row, i) => {
                        const avatarUrl = base64ToBlobUrl(row.imageurl);
                        return (
                          <tr
                            key={`${row.email}-${start + i}`}
                            className="lb-row"
                            onClick={() => {
                              if(match.state !== "Upcoming" || (match.state === "Upcoming" && row.did === myDreamId)) {
                                setPreviewDid(row.did)
                              }
                            
                            }}
                          >
                            <td>{start + i + 1}</td>
                            <td>
                              {avatarUrl ? (
                                <img
                                  src={avatarUrl}
                                  alt=""
                                  className="lb-avatar"
                                />
                              ) : (
                                <div className="lb-avatar lb-avatar--fallback">
                                  {row.name?.charAt(0)?.toUpperCase() ?? "?"}
                                </div>
                              )}
                            </td>
                            <td>{row.name}</td>
                            <td>{row.totalpoints.toFixed(1)}</td>
                            <td>
                              {(match.state !== "Upcoming" ||
                                (match.state === "Upcoming" &&
                                  row.did === myDreamId)) && (
                                <button
                                  type="button"
                                  className="btn btn-small btn-ghost"
                                  disabled={row.did == null}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (row.did != null) setPreviewDid(row.did);
                                  }}
                                  title={
                                    row.did == null
                                      ? "No dream id for preview"
                                      : "Open team preview"
                                  }
                                >
                                  Preview
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                      {pageRows.length === 0 && (
                        <tr>
                          <td colSpan={5} className="leaderboard-empty muted">
                            No leaderboard entries found.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                  <div className="lb-pagination">
                    <span className="muted small">
                      Showing {pageRows.length === 0 ? 0 : start + 1}-
                      {Math.min(
                        start + pageRows.length,
                        filteredSortedLbRows.length,
                      )}{" "}
                      of {filteredSortedLbRows.length}
                    </span>
                    <div className="lb-pagination__actions">
                      <button
                        type="button"
                        className="btn btn-ghost btn-small"
                        onClick={() => setPage(1)}
                        disabled={page <= 1}
                      >
                        First
                      </button>
                      <button
                        type="button"
                        className="btn btn-ghost btn-small"
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={page <= 1}
                      >
                        Prev
                      </button>
                      <span className="small muted">
                        Page {page} / {totalPages}
                      </span>
                      <button
                        type="button"
                        className="btn btn-ghost btn-small"
                        onClick={() =>
                          setPage((p) => Math.min(totalPages, p + 1))
                        }
                        disabled={page >= totalPages}
                      >
                        Next
                      </button>
                      <button
                        type="button"
                        className="btn btn-ghost btn-small"
                        onClick={() => setPage(totalPages)}
                        disabled={page >= totalPages}
                      >
                        Last
                      </button>
                    </div>
                  </div>
                  <p className="muted small match-lb-hint">
                    Click Preview to open your existing team preview.
                  </p>
                </div>
              )}
            </section>
          )}
        </>
      )}
    </div>
  );
}
