/** "50614.5" → "50,614.5" (always one decimal). */
export function formatPoints(n: number): string {
  return n.toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 })
}

/** "Apr–May 2026" (or "May 2026" when start/end share a month). */
export function formatMonthRange(startMs: number, endMs: number): string {
  if (!startMs || !endMs) return ''
  const month = (ms: number) => new Date(ms).toLocaleDateString('en-US', { month: 'short' })
  const year = new Date(endMs).getFullYear()
  const a = month(startMs)
  const b = month(endMs)
  return a === b ? `${a} ${year}` : `${a}–${b} ${year}`
}
