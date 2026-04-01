import type {
  ApiMatch,
  MatchLeaderboardEntry,
  OverallLeaderboardEntry,
  ApiMatchSelection,
  CreateDreamTeamBody,
  ScorecardApiResponse,
} from '../types/api'
import { apiFetch } from './client'

export async function fetchMatches(): Promise<ApiMatch[]> {
  const res = await apiFetch('/matches/fetch')
  if (res.status === 401) throw new Error('Sign in required')
  if (!res.ok) throw new Error((await res.text()) || `HTTP ${res.status}`)
  return res.json() as Promise<ApiMatch[]>
}

export async function fetchMatchesbyid(matchId: number): Promise<any> {
  const res = await apiFetch(`/matches/fetch/${matchId}`)
  if (res.status === 401) throw new Error('Sign in required')
  if (!res.ok) throw new Error((await res.text()) || `HTTP ${res.status}`)
  return res.json() as any;

}
export async function fetchMatchSelection(
  matchId: number,
): Promise<ApiMatchSelection> {
  const res = await apiFetch(`/matches/fetch/${matchId}`)
  if (res.status === 401) throw new Error('Sign in required')
  if (!res.ok) throw new Error((await res.text()) || `HTTP ${res.status}`)
  return res.json() as Promise<ApiMatchSelection>
}

export async function createTeam(body: CreateDreamTeamBody): Promise<boolean> {
  const res = await apiFetch('/teams/create', {
    method: 'POST',
    body: JSON.stringify(body),
  })
  if (res.status === 401) throw new Error('Sign in required')
  if (!res.ok) throw new Error((await res.text()) || `HTTP ${res.status}`)
  return res.json() as Promise<boolean>
}

export async function fetchMatchLeaderboard(
  matchId: number,
): Promise<MatchLeaderboardEntry[]> {
  const res = await apiFetch(`/lb/match/${matchId}`)
  if (res.status === 401) throw new Error('Sign in required')
  if (!res.ok) throw new Error((await res.text()) || `HTTP ${res.status}`)
  return res.json() as Promise<MatchLeaderboardEntry[]>
}

export async function fetchOverallLeaderboard(): Promise<OverallLeaderboardEntry[]> {
  const res = await apiFetch('/lb/overall')
  if (res.status === 401) throw new Error('Sign in required')
  if (!res.ok) throw new Error((await res.text()) || `HTTP ${res.status}`)
  return res.json() as Promise<OverallLeaderboardEntry[]>
}

export async function fetchScorecard(
  matchId: number,
): Promise<ScorecardApiResponse> {
  const res = await apiFetch(`/lb/scorecard/${matchId}`)
  if (res.status === 401) throw new Error('Sign in required')
  if (!res.ok) throw new Error((await res.text()) || `HTTP ${res.status}`)
  return res.json() as Promise<ScorecardApiResponse>
}
