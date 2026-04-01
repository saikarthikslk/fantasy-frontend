import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { playerImageUrl } from '../api/client'
import {
  countRoles,
  creditsForPlayer,
  normalizeRole,
  playerKey,
  roleLabel,
  RULES_SUMMARY_LINES,
  SQUAD_SIZE,
  TOTAL_CREDITS_CAP,
  totalCredits,
  tryAddPlayer,
  type AddBlockReason,
  type FantasyRole,
  validateCompleteSquad,
} from '../fantasy/dream11Rules'
import { createTeam, fetchMatchSelection, fetchMatches } from '../api/matchesApi'
import type { ApiMatch, ApiPlayer } from '../types/api'

function playerNumericId(p: ApiPlayer): number | null {
  const n = Number.parseInt(p.id, 10)
  return Number.isFinite(n) ? n : null
}

function teamShort(match: ApiMatch | null, teamId: number | undefined): string {
  if (!match || teamId == null) return '—'
  if (match.team1?.teamId === teamId)
    return match.team1.teamSName ?? match.team1.teamName ?? 'Team 1'
  if (match.team2?.teamId === teamId)
    return match.team2.teamSName ?? match.team2.teamName ?? 'Team 2'
  return 'Other'
}

function blockHint(reason: AddBlockReason): string {
  switch (reason) {
    case 'full':
      return 'Squad full (11). Remove someone to add.'
    case 'credits':
      return `Would exceed ${TOTAL_CREDITS_CAP} credits.`
    case 'team_cap':
      return 'Max 7 from one real team.'
    case 'role_max':
      return 'Role limit reached for that slot.'
    default:
      return 'Cannot add player.'
  }
}

export function CreateTeam() {
  const { matchId: matchIdParam, action :action} = useParams<{ matchId: string; action: string }>()
  const matchId = Number(matchIdParam)

  const [matchMeta, setMatchMeta] = useState<ApiMatch | null>(null)
  const [players, setPlayers] = useState<ApiPlayer[]>([])
  const [selected, setSelected] = useState<Set<string>>(new Set())
  /** Single state so C / VC updates stay in sync; keys are always `String(player.id)`. */
  const [captainVice, setCaptainVice] = useState<{
    captainId: string | null
    viceCaptainId: string | null
  }>({ captainId: null, viceCaptainId: null })
  const captainId = captainVice.captainId
  const viceCaptainId = captainVice.viceCaptainId
  const [roleTab, setRoleTab] = useState<'ALL' | FantasyRole>('ALL')
  const [hint, setHint] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const byId = useMemo(
    () => new Map(players.map((p) => [playerKey(p), p] as const)),
    [players],
  )

  const load = useCallback(async () => {
    if (!Number.isFinite(matchId)) {
      setError('Invalid match id')
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    try {
      const [allMatches, selection] = await Promise.all([
        fetchMatches(),
        fetchMatchSelection(matchId),
      ])
      const meta = allMatches.find((m) => m.matchId === matchId) ?? null
      setMatchMeta(meta)
      setPlayers(selection.players ?? [])
      if(action === 'edit' && selection.dreamTeam) {
        var team =JSON.parse(selection.dreamTeam.team);
        setSelected(new Set(team.properties.map((p : any) => String(p.playerid))))
        setCaptainVice({
          captainId: String(team.captainPlayerId),
          viceCaptainId: String(team.viceCaptainPlayerId),
        })
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load')
    } finally {
      setLoading(false)
    }
  }, [matchId])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    setCaptainVice((prev) => {
      const c =
        prev.captainId && selected.has(prev.captainId) ? prev.captainId : null
      const v =
        prev.viceCaptainId && selected.has(prev.viceCaptainId)
          ? prev.viceCaptainId
          : null
      if (c === prev.captainId && v === prev.viceCaptainId) return prev
      return { captainId: c, viceCaptainId: v }
    })
  }, [selected])

  const selectedList = useMemo(() => {
    return [...selected]
      .map((id) => byId.get(id))
      .filter(Boolean) as ApiPlayer[]
  }, [selected, byId])

  const creditsUsed = useMemo(() => totalCredits(selectedList), [selectedList])
  const creditsLeft = Math.max(0, TOTAL_CREDITS_CAP - creditsUsed)
  const roleCounts = useMemo(() => countRoles(selectedList), [selectedList])

  const t1Id = matchMeta?.team1?.teamId
  const t2Id = matchMeta?.team2?.teamId
  const nTeam1 =
    t1Id == null ? 0 : selectedList.filter((p) => p.team?.teamId === t1Id).length
  const nTeam2 =
    t2Id == null ? 0 : selectedList.filter((p) => p.team?.teamId === t2Id).length

  const validationErrors = useMemo(
    () => (selectedList.length === SQUAD_SIZE ? validateCompleteSquad(selectedList) : []),
    [selectedList],
  )
  const squadValid = selectedList.length === SQUAD_SIZE && validationErrors.length === 0

  const captainViceErrors = useMemo(() => {
    if (selectedList.length !== SQUAD_SIZE) return []
    const errs: string[] = []
    if (!captainId) errs.push('Select a captain (C).')
    if (!viceCaptainId) errs.push('Select a vice-captain (VC).')
    if (captainId && viceCaptainId && captainId === viceCaptainId) {
      errs.push('Captain and vice-captain must be different players.')
    }
    return errs
  }, [selectedList.length, captainId, viceCaptainId])

  const captainViceValid = captainViceErrors.length === 0
  const canSave = squadValid && captainViceValid

  const filteredPlayers = useMemo(() => {
    if (roleTab === 'ALL') return players
    return players.filter((p) => normalizeRole(p.type) === roleTab)
  }, [players, roleTab])

  const pickPlayer = (p: ApiPlayer) => {
    setHint(null)
    const key = playerKey(p)
    if (selected.has(key)) {
      setSelected((prev) => {
        const n = new Set(prev)
        n.delete(key)
        return n
      })
      return
    }
    const res = tryAddPlayer(p, selected, byId, matchMeta)
    if (!res.ok) setHint(blockHint(res.reason))
    else
      setSelected((prev) => {
        const n = new Set(prev)
        n.add(key)
        return n
      })
  }

  const selectCaptain = (id: string) => {
    setHint(null)
    setCaptainVice((prev) => {
      if (prev.captainId === id) return { ...prev, captainId: null }
      const viceCaptainId = prev.viceCaptainId === id ? null : prev.viceCaptainId
      return { captainId: id, viceCaptainId }
    })
  }

  const selectViceCaptain = (id: string) => {
    setHint(null)
    setCaptainVice((prev) => {
      if (prev.viceCaptainId === id) return { ...prev, viceCaptainId: null }
      const captainId = prev.captainId === id ? null : prev.captainId
      return { captainId, viceCaptainId: id }
    })
  }

  const submit = async () => {
    if (!canSave) return
    const capNum = captainId ? playerNumericId(byId.get(captainId)!) : null
    const vcNum = viceCaptainId ? playerNumericId(byId.get(viceCaptainId)!) : null
    if (capNum == null || vcNum == null) return

    setSaving(true)
    setError(null)
    try {
      const properties = selectedList.map((p) => {
        const pid = playerNumericId(p)
        if (pid == null) throw new Error(`Player id not numeric: ${p.id}`)
        return {
          playerid: pid,
          type: normalizeRole(p.type),
        }
      })
      await createTeam({
        matchid: matchId,
        properties,
        captainPlayerId: capNum,
        viceCaptainPlayerId: vcNum,
      })
      setSuccess(true)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  if (!Number.isFinite(matchId)) {
    return (
      <div className="page">
        <p>Invalid match.</p>
        <Link to="/matches">Back to matches</Link>
      </div>
    )
  }

  const t1 = matchMeta?.team1?.teamSName ?? matchMeta?.team1?.teamName ?? 'Team 1'
  const t2 = matchMeta?.team2?.teamSName ?? matchMeta?.team2?.teamName ?? 'Team 2'

  const roleTabs: Array<'ALL' | FantasyRole> = ['ALL', 'WK', 'BAT', 'AR', 'BOWL']

  return (
    <div className="page create-page create-page--d11">
      <nav className="breadcrumb" aria-label="Breadcrumb">
        <Link to="/matches">Matches</Link>
        <span aria-hidden> / </span>
        <span>
          {t1} vs {t2}
        </span>
      </nav>

      <header className="create-hero">
        <div>
          <h1>Create dream team</h1>
          <p className="muted create-hero__meta">
            {matchMeta?.seriesName ?? 'Match'}
            {matchMeta?.venueInfo?.ground ? ` · ${matchMeta.venueInfo.ground}` : ''}
            {matchMeta?.venueInfo?.city ? ` · ${matchMeta.venueInfo.city}` : ''}
          </p>
        </div>
        <aside className="rules-card" aria-label="Fantasy rules">
          <strong className="rules-card__title">Dream11-style rules</strong>
          <ul className="rules-card__list">
            {RULES_SUMMARY_LINES.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </aside>
      </header>

      {loading && <p className="muted">Loading squads…</p>}
      {error && (
        <div className="alert alert-error" role="alert">
          {error}
        </div>
      )}
      {success && (
        <div className="alert alert-success" role="status">
          Dream team saved — squad follows fantasy rules above.
        </div>
      )}

      {!loading && !success && (
        <>
          <section className="squad-bar" aria-label="Squad progress">
            <div className="squad-bar__credit">
              <span className="squad-bar__label">Credits left</span>
              <span className="credit-big">{creditsLeft.toFixed(1)}</span>
              <div className="credit-meter" aria-hidden>
                <div
                  className="credit-meter__fill"
                  style={{
                    width: `${Math.min(100, (creditsUsed / TOTAL_CREDITS_CAP) * 100)}%`,
                  }}
                />
              </div>
              <span className="muted small">
                {creditsUsed.toFixed(1)} / {TOTAL_CREDITS_CAP} used
              </span>
            </div>
            <div className="squad-bar__mid">
              <div className="squad-bar__pill">
                Players <strong>{selectedList.length}</strong> / {SQUAD_SIZE}
              </div>
              <div className="squad-bar__teams">
                <span className="team-pill">
                  {t1} <strong>{nTeam1}</strong>/7
                </span>
                <span className="team-pill">
                  {t2} <strong>{nTeam2}</strong>/7
                </span>
              </div>
              {selectedList.length === SQUAD_SIZE && (
                <div className="squad-bar__cv-summary" aria-label="Captain and vice-captain">
                  <span className={captainId ? 'cv-ok' : 'cv-miss'}>
                    C:{' '}
                    {captainId
                      ? byId.get(captainId)?.name ?? '—'
                      : '—'}
                  </span>
                  <span className={viceCaptainId ? 'cv-ok' : 'cv-miss'}>
                    VC:{' '}
                    {viceCaptainId
                      ? byId.get(viceCaptainId)?.name ?? '—'
                      : '—'}
                  </span>
                </div>
              )}
            </div>
            <div className="squad-bar__roles" aria-label="Role counts">
              {(['WK', 'BAT', 'AR', 'BOWL'] as const).map((r) => (
                <div key={r} className="role-chip">
                  <span className="role-chip__r">{r}</span>
                  <span className="role-chip__n">{roleCounts[r]}</span>
                </div>
              ))}
            </div>
          </section>

          {hint && (
            <p className="hint-bar" role="status">
              {hint}
            </p>
          )}

          <div className="role-tabs" role="tablist" aria-label="Filter by role">
            {roleTabs.map((tab) => (
              <button
                key={tab}
                type="button"
                role="tab"
                aria-selected={roleTab === tab}
                className={`role-tab${roleTab === tab ? ' role-tab--on' : ''}`}
                onClick={() => setRoleTab(tab)}
              >
                {tab === 'ALL' ? 'All' : roleLabel(tab)}
              </button>
            ))}
          </div>

          <div className="create-layout">
            <section className="player-pool" aria-labelledby="pool-heading">
              <h2 id="pool-heading" className="pool-heading">
                Pick players
                <span className="muted small pool-heading__sub">
                  {filteredPlayers.length} available
                </span>
              </h2>
              <ul className="player-list player-list--grid">
                {filteredPlayers.map((p) => {
                  const pk = playerKey(p)
                  const on = selected.has(pk)
                  const cr = creditsForPlayer(p)
                  const role = normalizeRole(p.type)
                  const res = on
                    ? ({ ok: true } as const)
                    : tryAddPlayer(p, selected, byId, matchMeta)
                  const disabled = !on && !res.ok
                  const isCap = captainId === pk
                  const isVc = viceCaptainId === pk
                  return (
                    <li key={pk}>
                      <button
                        type="button"
                        className={`player-tile${on ? ' player-tile--on' : ''}${disabled ? ' player-tile--blocked' : ''}`}
                        onClick={() => pickPlayer(p)}
                      >
                        <img
                          className="player-tile__img"
                          src={playerImageUrl(p.imageId)}
                          alt=""
                          width={48}
                          height={48}
                          loading="lazy"
                        />
                        <span className="player-tile__body">
                          <span className="player-tile__name">{p.name}</span>
                          <span className="player-tile__row">
                            <span className={`role-badge role-badge--${role}`}>{role}</span>
                            <span className="player-tile__team muted small">
                              {teamShort(matchMeta, p.team?.teamId)}
                            </span>
                            {(isCap || isVc) && (
                              <span className="player-tile__cv">
                                {isCap && <span className="cv-pill cv-pill--c">C</span>}
                                {isVc && <span className="cv-pill cv-pill--vc">VC</span>}
                              </span>
                            )}
                          </span>
                        </span>
                        <span className="player-tile__cr">{cr.toFixed(1)}</span>
                      </button>
                    </li>
                  )
                })}
              </ul>
            </section>

            <aside className="squad-rail" aria-labelledby="rail-heading">
              <h2 id="rail-heading" className="rail-heading">
                Your XI
              </h2>
              <p className="rail-hint muted small">
                After 11 picks, tap <strong className="cv-strong-c">C</strong> and{' '}
                <strong className="cv-strong-vc">VC</strong> on two players.
              </p>
              <ol className="squad-slots">
                {Array.from({ length: SQUAD_SIZE }, (_, i) => {
                  const p = selectedList[i]
                  if (!p)
                    return (
                      <li key={i} className="squad-slot squad-slot--empty">
                        <span className="squad-slot__i">{i + 1}</span>
                        <span className="muted">Empty</span>
                      </li>
                    )
                  const role = normalizeRole(p.type)
                  const pk = playerKey(p)
                  const isCap = captainId === pk
                  const isVc = viceCaptainId === pk
                  return (
                    <li key={pk} className="squad-slot">
                      <span className="squad-slot__i">{i + 1}</span>
                      <img
                        className="squad-slot__img"
                        src={playerImageUrl(p.imageId)}
                        alt=""
                        width={32}
                        height={32}
                      />
                      <div className="squad-slot__col">
                        <div className="squad-slot__nameRow">
                          <span className="squad-slot__name">{p.name}</span>
                          <span className={`role-badge role-badge--${role} role-badge--sm`}>
                            {role}
                          </span>
                        </div>
                        <div className="squad-slot__cv">
                          <button
                            type="button"
                            className={`cv-btn cv-btn--c${isCap ? ' cv-btn--active' : ''}`}
                            onClick={(e) => {
                              e.stopPropagation()
                              selectCaptain(pk)
                            }}
                            aria-pressed={isCap}
                            aria-label={`${isCap ? 'Remove' : 'Set'} captain ${p.name}`}
                          >
                            C
                          </button>
                          <button
                            type="button"
                            className={`cv-btn cv-btn--vc${isVc ? ' cv-btn--active' : ''}`}
                            onClick={(e) => {
                              e.stopPropagation()
                              selectViceCaptain(pk)
                            }}
                            aria-pressed={isVc}
                            aria-label={`${isVc ? 'Remove' : 'Set'} vice-captain ${p.name}`}
                          >
                            VC
                          </button>
                        </div>
                      </div>
                      <span className="squad-slot__cr">{creditsForPlayer(p).toFixed(1)}</span>
                      <button
                        type="button"
                        className="squad-slot__x"
                        aria-label={`Remove ${p.name}`}
                        onClick={() => pickPlayer(p)}
                      >
                        ×
                      </button>
                    </li>
                  )
                })}
              </ol>
              {selectedList.length === SQUAD_SIZE && validationErrors.length > 0 && (
                <div className="validation-box" role="alert">
                  <strong>Fix your squad</strong>
                  <ul>
                    {validationErrors.map((msg) => (
                      <li key={msg}>{msg}</li>
                    ))}
                  </ul>
                </div>
              )}
              {selectedList.length === SQUAD_SIZE &&
                validationErrors.length === 0 &&
                captainViceErrors.length > 0 && (
                  <div className="validation-box validation-box--cv" role="status">
                    <strong>Captain &amp; vice-captain</strong>
                    <ul>
                      {captainViceErrors.map((msg) => (
                        <li key={msg}>{msg}</li>
                      ))}
                    </ul>
                  </div>
                )}
            </aside>
          </div>

          <div className="sticky-actions create-actions">
            <Link to="/matches" className="btn btn-ghost">
              Cancel
            </Link>
            <button
              type="button"
              className="btn btn-primary"
              disabled={!canSave || saving}
              onClick={() => void submit()}
            >
              {saving ? 'Saving…' : 'Save dream team'}
            </button>
          </div>
        </>
      )}
    </div>
  )
}
