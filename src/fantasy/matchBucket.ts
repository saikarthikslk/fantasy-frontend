import type { ApiMatch } from '../types/api'

export type MatchTab = 'upcoming' | 'live' | 'completed'

function toMs(epoch: number): number {
  if (epoch == null || Number.isNaN(epoch)) return 0
  return String(epoch).length <= 10 ? epoch * 1000 : epoch
}

/**
 * Buckets a match for UI tabs using `state` / `status` when present, else start/end times.
 */
export function getMatchBucket(m: ApiMatch, now = Date.now()): MatchTab {
  const text = `${m.state ?? ''} ${m.status ?? ''}`.toLowerCase()

  if (
    /\b(live|in play|in-play|inning|innings|playing|stumps|drinks)\b/.test(text) ||
    /strategic|break\b/.test(text)
  ) {
    return 'live'
  }
  if (
    /\b(complete|completed|abandon|won|win|result|finished|ended|tie|draw|no result)\b/.test(
      text,
    )
  ) {
    return 'completed'
  }
  if (/\b(preview|upcoming|scheduled|fixture|not started|delay|rain)\b/.test(text)) {
    return 'upcoming'
  }

  const start = toMs(m.startDate)
  const end = toMs(m.endDate)
  const hasValidEnd = m.endDate != null && m.endDate !== 0 && end > start

  if (hasValidEnd && end < now) return 'completed'
  if (hasValidEnd && start <= now && now <= end) return 'live'
  if (start > now) return 'upcoming'

  // Started; no reliable end window
  if (start <= now && !hasValidEnd) {
    const hoursSinceStart = (now - start) / (60 * 60 * 1000)
    if (hoursSinceStart < 10) return 'live'
    return 'completed'
  }

  return 'upcoming'
}

export const MATCH_TAB_LABELS: Record<MatchTab, string> = {
  upcoming: 'Upcoming',
  live: 'Live',
  completed: 'Completed',
}
