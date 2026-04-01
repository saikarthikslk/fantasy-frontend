import { useEffect, useMemo, useState } from 'react'
import { fetchOverallLeaderboard } from '../api/matchesApi'
import { playerImageUrl } from '../api/client'
import type { OverallLeaderboardEntry, OverallLeaderboardStat } from '../types/api'

type SortKey = 'name' | 'totalpoints' | 'matches'
type SortDir = 'asc' | 'desc'

function base64ToBlobUrl(base64: string | null | undefined): string | null {
  if (!base64) return null
  try {
    const raw = window.atob(base64)
    const uInt8Array = new Uint8Array(raw.length)
    for (let i = 0; i < raw.length; ++i) uInt8Array[i] = raw.charCodeAt(i)
    const blob = new Blob([uInt8Array], { type: 'image/png' })
    return URL.createObjectURL(blob)
  } catch {
    return null
  }
}

function formatDate(ts: number): string {
  const ms = String(ts).length <= 10 ? ts * 1000 : ts
  return new Date(ms).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  })
}

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) return <span className="olb-rank olb-rank--gold">🥇</span>
  if (rank === 2) return <span className="olb-rank olb-rank--silver">🥈</span>
  if (rank === 3) return <span className="olb-rank olb-rank--bronze">🥉</span>
  return <span className="olb-rank">{rank}</span>
}

function MatchStatsPopover({ stats }: { stats: OverallLeaderboardStat[] }) {
  const sorted = [...stats].sort((a, b) => b.timestamp - a.timestamp)
  return (
    <div className="olb-stats-popover">
      <div className="olb-stats-header">
        <span>Match</span>
        <span>Rank</span>
        <span>Points</span>
      </div>
      {sorted.map((s) => (
        <div key={s.matchid} className="olb-stats-row">
          <div className="olb-stats-match">
            <div className="olb-stats-teams">
              <img
                src={playerImageUrl(s.t1.imageId!)}
                alt={s.t1.teamSName}
                className="olb-team-logo"
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
              />
              <span className="olb-stats-team-name">{s.t1.teamSName}</span>
              <span className="olb-stats-vs">vs</span>
              <img
                src={playerImageUrl(s.t2.imageId!)}
                alt={s.t2.teamSName}
                className="olb-team-logo"
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
              />
              <span className="olb-stats-team-name">{s.t2.teamSName}</span>
            </div>
            <span className="olb-stats-date">{formatDate(s.timestamp)}</span>
          </div>
          <span className="olb-stats-position">#{s.position}</span>
          <span className="olb-stats-points">{s.points.toFixed(1)}</span>
        </div>
      ))}
    </div>
  )
}

export function Leaderboard() {
  const [rows, setRows] = useState<OverallLeaderboardEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [sortKey, setSortKey] = useState<SortKey>('totalpoints')
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [expandedRow, setExpandedRow] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)

    fetchOverallLeaderboard()
      .then((data) => {
        if (!cancelled) setRows(data ?? [])
      })
      .catch((e: unknown) => {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load leaderboard')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => { cancelled = true }
  }, [])

  const filteredSorted = useMemo(() => {
    const q = query.trim().toLowerCase()
    const filtered = q
      ? rows.filter(
          (r) =>
            r.name.toLowerCase().includes(q) ||
            r.email.toLowerCase().includes(q),
        )
      : rows

    const copy = [...filtered]
    copy.sort((a, b) => {
      const dir = sortDir === 'asc' ? 1 : -1
      if (sortKey === 'totalpoints') return (a.totalpoints - b.totalpoints) * dir
      if (sortKey === 'matches') return ((a.stats?.length ?? 0) - (b.stats?.length ?? 0)) * dir
      return a.name.localeCompare(b.name) * dir
    })
    return copy
  }, [rows, query, sortKey, sortDir])

  const totalPages = Math.max(1, Math.ceil(filteredSorted.length / pageSize))
  const start = (page - 1) * pageSize
  const pageRows = filteredSorted.slice(start, start + pageSize)

  useEffect(() => { setPage(1) }, [query, sortKey, sortDir, pageSize])
  useEffect(() => { if (page > totalPages) setPage(totalPages) }, [page, totalPages])

  const onSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    else {
      setSortKey(key)
      setSortDir(key === 'name' ? 'asc' : 'desc')
    }
  }

  const sortArrow = (key: SortKey) =>
    sortKey === key ? (sortDir === 'asc' ? ' ▲' : ' ▼') : ''

  // Top 3 for podium
  const topThree = useMemo(() => {
    const sorted = [...rows].sort((a, b) => b.totalpoints - a.totalpoints)
    return sorted.slice(0, 3)
  }, [rows])

  return (
    <div className="page leaderboard-page">
      <header className="page-head">
        <p className="eyebrow">Overall standings</p>
        <h1>Leaderboard</h1>
        <p className="muted" style={{ marginTop: '0.35rem' }}>
          Season-wide fantasy rankings across all matches
        </p>
      </header>

      {loading && (
        <div className="olb-loading">
          <div className="olb-spinner" />
          <p className="muted">Loading leaderboard…</p>
        </div>
      )}

      {error && (
        <div className="alert alert-error" role="alert">
          {error}
        </div>
      )}

      {!loading && !error && rows.length === 0 && (
        <div className="olb-empty">
          <div className="olb-empty-icon">🏆</div>
          <h3>No leaderboard data yet</h3>
          <p className="muted">Rankings will appear once matches are played and scored.</p>
        </div>
      )}

      {!loading && !error && rows.length > 0 && (
        <>
          {/* Podium for top 3 */}
          {topThree.length >= 3 && (
            <div className="olb-podium">
              {[topThree[1], topThree[0], topThree[2]].map((entry, vi) => {
                const actualRank = vi === 0 ? 2 : vi === 1 ? 1 : 3
                const avatarUrl = base64ToBlobUrl(entry.imageurl)
                return (
                  <div
                    key={entry.email}
                    className={`olb-podium-card olb-podium-card--${actualRank}`}
                  >
                    <div className="olb-podium-medal">
                      {actualRank === 1 && '🥇'}
                      {actualRank === 2 && '🥈'}
                      {actualRank === 3 && '🥉'}
                    </div>
                    <div className="olb-podium-avatar-wrap">
                      {avatarUrl ? (
                        <img src={avatarUrl} alt="" className="olb-podium-avatar" />
                      ) : (
                        <div className="olb-podium-avatar olb-podium-avatar--fallback">
                          {entry.name?.charAt(0)?.toUpperCase() ?? '?'}
                        </div>
                      )}
                      <div className={`olb-podium-ring olb-podium-ring--${actualRank}`} />
                    </div>
                    <h3 className="olb-podium-name">{entry.name}</h3>
                    <p className="olb-podium-points">{entry.totalpoints.toFixed(1)} pts</p>
                    <p className="olb-podium-matches muted small">
                      {entry.stats?.length ?? 0} match{(entry.stats?.length ?? 0) !== 1 ? 'es' : ''}
                    </p>
                  </div>
                )
              })}
            </div>
          )}

          {/* Summary stats */}
          <div className="olb-summary-strip">
            <div className="olb-summary-item">
              <span className="olb-summary-value">{rows.length}</span>
              <span className="olb-summary-label">Players</span>
            </div>
            <div className="olb-summary-item">
              <span className="olb-summary-value">
                {Math.max(...rows.map((r) => r.totalpoints)).toFixed(1)}
              </span>
              <span className="olb-summary-label">Highest Score</span>
            </div>
            <div className="olb-summary-item">
              <span className="olb-summary-value">
                {(rows.reduce((s, r) => s + r.totalpoints, 0) / rows.length).toFixed(1)}
              </span>
              <span className="olb-summary-label">Average</span>
            </div>
          </div>

          {/* Table */}
          <div className="olb-panel">
            <div className="lb-toolbar">
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="lb-search"
                placeholder="Search by name or email…"
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
                  <option value={50}>50</option>
                </select>
              </label>
            </div>
            <table className="leaderboard-table olb-table">
              <thead>
                <tr>
                  <th style={{ width: 56 }}>#</th>
                  <th style={{ width: 52 }}>Pic</th>
                  <th>
                    <button className="lb-sort" type="button" onClick={() => onSort('name')}>
                      Name{sortArrow('name')}
                    </button>
                  </th>
                  <th>
                    <button className="lb-sort" type="button" onClick={() => onSort('matches')}>
                      Matches{sortArrow('matches')}
                    </button>
                  </th>
                  <th>
                    <button className="lb-sort" type="button" onClick={() => onSort('totalpoints')}>
                      Points{sortArrow('totalpoints')}
                    </button>
                  </th>
                  <th style={{ width: 80 }}>Details</th>
                </tr>
              </thead>
              <tbody>
                {pageRows.map((row, i) => {
                  const globalRank = start + i + 1
                  const avatarUrl = base64ToBlobUrl(row.imageurl)
                  const isExpanded = expandedRow === row.email
                  return (
                    <>
                      <tr
                        key={row.email}
                        className={`lb-row olb-row${
                          globalRank <= 3 ? ` olb-row--top${globalRank}` : ''
                        }${isExpanded ? ' olb-row--expanded' : ''}`}
                        onClick={() =>
                          setExpandedRow(isExpanded ? null : row.email)
                        }
                      >
                        <td>
                          <RankBadge rank={globalRank} />
                        </td>
                        <td>
                          {avatarUrl ? (
                            <img src={avatarUrl} alt="" className="lb-avatar" />
                          ) : (
                            <div className="lb-avatar lb-avatar--fallback">
                              {row.name?.charAt(0)?.toUpperCase() ?? '?'}
                            </div>
                          )}
                        </td>
                        <td>
                          <div className="olb-name-cell">
                            <span className="olb-name">{row.name}</span>
                            <span className="olb-email muted small">{row.email}</span>
                          </div>
                        </td>
                        <td>
                          <span className="olb-matches-badge">
                            {row.stats?.length ?? 0}
                          </span>
                        </td>
                        <td className="olb-points-cell">
                          <span className="olb-points-value">{row.totalpoints.toFixed(1)}</span>
                        </td>
                        <td>
                          <button
                            type="button"
                            className={`btn btn-small btn-ghost olb-expand-btn${
                              isExpanded ? ' olb-expand-btn--open' : ''
                            }`}
                            onClick={(e) => {
                              e.stopPropagation()
                              setExpandedRow(isExpanded ? null : row.email)
                            }}
                          >
                            {isExpanded ? '▲' : '▼'}
                          </button>
                        </td>
                      </tr>
                      {isExpanded && row.stats && row.stats.length > 0 && (
                        <tr key={`${row.email}-stats`} className="olb-stats-tr">
                          <td colSpan={6} style={{ padding: 0 }}>
                            <MatchStatsPopover stats={row.stats} />
                          </td>
                        </tr>
                      )}
                    </>
                  )
                })}
                {pageRows.length === 0 && (
                  <tr>
                    <td colSpan={6} className="leaderboard-empty muted">
                      No results match your search.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
            <div className="lb-pagination">
              <span className="muted small">
                Showing {pageRows.length === 0 ? 0 : start + 1}-
                {Math.min(start + pageRows.length, filteredSorted.length)} of{' '}
                {filteredSorted.length}
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
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
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
              Source: <code>GET /lb/overall</code>. Click any row or ▼ to expand match-by-match breakdown.
            </p>
          </div>
        </>
      )}
    </div>
  )
}
