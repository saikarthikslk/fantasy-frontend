/** User profile type */
export type ApiUser = {
  id?: string
  email: string
  gamename?: string
  profielpic?: string
  autoteam?: boolean
  createdAt?: string
  updatedAt?: string
}

/** Mirrors com.security.demo.model.Team */
export type ApiTeam = {
  teamId: number
  teamName?: string
  teamSName?: string
  imageId?: number
}

/** Mirrors com.security.demo.model.Venue */
export type ApiVenue = {
  id: number
  ground?: string
  city?: string
  timezone?: string
}

/** Mirrors com.security.demo.model.Match */
export type ApiMatch = {
  matchId: number
  seriesId: number
  seriesName?: string
  matchDesc?: string
  matchFormat?: string
  startDate: number
  endDate: number
  state?: string
  status?: string
  teamWon?: string | null
  team1?: ApiTeam
  team2?: ApiTeam
  venueInfo?: ApiVenue
  playerwon?: string | null
  points?: number | null
}

/** Mirrors com.security.demo.DBmodel.PlayerEntity (JSON shape) */
export type ApiPlayer = {
  id: string
  name: string
  imageId: number
  battingStyle?: string
  bowlingStyle?: string
  type?: string
  /** When set by backend, used for Dream11-style credit cap. */
  credits?: number
  points?: number | null
  /** Playing status after lineup announced (30 min before match). */
  category?: string | null
  /** Playing status before lineup announced. */
  prevcategory?: string | null
  totalpoints?: number | null
  team?: ApiTeam
}

/** Mirrors com.security.demo.DBmodel.CustomTeamEntity */
export type ApiCustomTeam = {
  id?: number
  email?: string
  team?: string
  match_id?: number
  created_at?: string
}

/** Mirrors com.security.demo.model.MatchSelection */
export type ApiMatchSelection = {
  players?: ApiPlayer[]
  dreamTeam?: any
  smartTeam?: any
  /** true once playing XI is announced (~30 min before match). */
  isannounced?: boolean
}

export type MatchLbPlayer = {
  playerid: string
  points: number
  team: string
  name: string
  type: string
  url: string
}

export type MatchLeaderboardEntry = {
  playerEntities: MatchLbPlayer[]
  captain: string
  vcaptain: string
  did: number | null
  matchid: number
  totalpoints: number
  name: string
  email: string
  imageurl: string | null
}

/** Single match stat inside the overall leaderboard */
export type OverallLeaderboardStat = {
  matchid: number
  did: number
  position: number
  t1: ApiTeam
  t2: ApiTeam
  timestamp: number
  points: number
}

/** One entry in the overall leaderboard (GET /lb/overall) */
export type OverallLeaderboardEntry = {
  stats: OverallLeaderboardStat[]
  totalpoints: number
  name: string
  email: string
  imageurl: string | null
}

/* ── Scorecard API types (GET /lb/scorecard/{matchId}) ── */

/** Single batting entry inside a parsed innings */
export type ScorecardBatter = {
  name: string
  dismissal: string
  runs: number
  balls: number
  fours: number
  sixes: number
  sr: number
}

/** Single bowling entry inside a parsed innings */
export type ScorecardBowler = {
  name: string
  overs: number
  maidens: number
  runs: number
  wickets: number
  economy: number
  wides: number
  nb: number
}

/** Extras breakdown inside a parsed innings */
export type ScorecardExtras = {
  total: number
  wides: number
  noBalls: number
  byes: number
  legByes: number
  penalty: number
}

/** Total breakdown inside a parsed innings */
export type ScorecardTotal = {
  runs: number
  wickets: number
  overs: number
  runRate: number
}

/** Parsed innings object (the JSON-decoded value of innings1 / innings2) */
export type ScorecardInnings = {
  batting: ScorecardBatter[]
  bowling: ScorecardBowler[]
  extras: ScorecardExtras
  total: ScorecardTotal
}

/** Raw API response from GET /lb/scorecard/{matchId} */
export type ScorecardApiResponse = {
  id: number
  matchid: number
  timestamp: number
  innings1: string   // JSON-encoded ScorecardInnings
  innings2: string   // JSON-encoded ScorecardInnings
  matchstatus: string
  tosswonby: string
  team1: string
  team2: string
  innings: number
}

/** POST /teams/create body — DreamTeam (+ optional C/VC for your Spring model) */
export type CreateDreamTeamBody = {
  matchid: number
  properties: { playerid: number; type: string }[]
  /** Numeric player id of captain (2× points in typical fantasy). */
  captainPlayerId?: number
  /** Numeric player id of vice-captain (1.5× points). */
  viceCaptainPlayerId?: number
}
