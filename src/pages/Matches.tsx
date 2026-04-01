import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  getMatchBucket,
  MATCH_TAB_LABELS,
  type MatchTab,
} from '../fantasy/matchBucket'
import { fetchMatches } from '../api/matchesApi'
import type { ApiMatch } from '../types/api'
import  { playerImageUrl } from '../api/client'

function formatWhen(startDate: number): string {
  const ms = String(startDate).length <= 10 ? startDate * 1000 : startDate
  return new Date(ms).toLocaleString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

const TABS: MatchTab[] = ['upcoming', 'live', 'completed']

export function Matches() {
  const [rows, setRows] = useState<ApiMatch[]>([])
  const [tab, setTab] = useState<MatchTab>('upcoming')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    fetchMatches()
      .then((data) => {
        if (!cancelled) setRows(data)
      })
      .catch((e: unknown) => {
        if (!cancelled)
          setError(e instanceof Error ? e.message : 'Failed to load matches')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const byTab = useMemo(() => {
    const buckets: Record<MatchTab, ApiMatch[]> = {
      upcoming: [],
      live: [],
      completed: [],
    }
    for (const m of rows) {
      buckets[getMatchBucket(m)].push(m)
    }
    const startMs = (m: ApiMatch) =>
      String(m.startDate).length <= 10 ? m.startDate * 1000 : m.startDate
    const asc = (a: ApiMatch, b: ApiMatch) => startMs(a) - startMs(b)
    const desc = (a: ApiMatch, b: ApiMatch) => startMs(b) - startMs(a)
    buckets.upcoming.sort(asc)
    buckets.live.sort(asc)
    buckets.completed.sort(desc)
    return buckets
  }, [rows])

  const filtered = byTab[tab]

  return (
    <div className="page matches-page">
      <header className="page-head">
        <h1>Cricket matches</h1>
        <p className="muted">
          Fantasy cricket only — pick a match, then create your dream team (XI players).
          Requires sign-in.
        </p>
      </header>
      <p className="sport-badge" role="status">
        <span className="chip chip--on">Cricket fantasy</span>
      </p>

      <div className="match-tabs" role="tablist" aria-label="Match status">
        {TABS.map((id) => {
          const count = byTab[id].length
          return (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={tab === id}
              id={`match-tab-${id}`}
              className={`match-tab${tab === id ? ' match-tab--on' : ''}${id === 'live' && count > 0 ? ' match-tab--pulse' : ''}`}
              onClick={() => setTab(id)}
            >
              {MATCH_TAB_LABELS[id]}
              <span className="match-tab__count" aria-hidden>
                {count}
              </span>
            </button>
          )
        })}
      </div>

      {loading && <p className="muted">Loading…</p>}
      {error && (
        <div className="alert alert-error" role="alert">
          {error}
        </div>
      )}
      {!loading && !error && rows.length === 0 && (
        <p className="muted">No matches in the database yet.</p>
      )}
      {!loading && !error && rows.length > 0 && filtered.length === 0 && (
        <p className="muted empty-tab-hint">
          No {MATCH_TAB_LABELS[tab].toLowerCase()} matches right now.
        </p>
      )}
      <ul className="match-list" role="tabpanel" aria-labelledby={`match-tab-${tab}`}>
        {filtered.map((m) => (
          <li key={m.matchId}>
            <article className="match-card">
              <Link
                className="match-card__link"
                to={`/match/${m.matchId}`}
                aria-label={`Open ${m.team1?.teamSName ?? 'Team 1'} vs ${m.team2?.teamSName ?? 'Team 2'} — scorecard and leaderboard`}
              >
                <div className="match-card__top">
                  <span className="league-pill">{m.seriesName ?? 'Match'}</span>
                  <span className="muted small">{formatWhen(m.startDate)}</span>
                </div>
                <div className="match-card__teams">
                  <img  src={playerImageUrl(m.team1?.imageId ?? 0)}></img>
                  <span className="team-code">{m.team1?.teamSName ?? m.team1?.teamName ?? '—'}</span>
                  <span className="vs">vs</span>
                  <img  src={playerImageUrl(m.team2?.imageId ?? 0)}></img>
                  <span className="team-code">{m.team2?.teamSName ?? m.team2?.teamName ?? '—'}</span>
                </div>
                <p className="venue muted small">
                  {m.venueInfo?.ground ?? 'Venue TBC'}
                  {m.venueInfo?.city ? ` · ${m.venueInfo.city}` : ''}
                </p>
                {m.matchDesc && <p className="muted small match-desc">{m.matchDesc}</p>}
                <p className="match-card__tap-hint muted small">Tap for scorecard &amp; leaderboard</p>
              </Link>
              <div className="match-card__actions">
                <span className="contest-hint">{m.status ?? m.state ?? '—'}</span>
               
              </div>
            </article>
          </li>
        ))}
      </ul>
    </div>
  )
}
