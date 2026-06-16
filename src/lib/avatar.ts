/** Decode a base64 PNG payload into an object URL, or null when absent/invalid. */
export function base64ToBlobUrl(base64: string | null | undefined): string | null {
  if (!base64) return null
  try {
    const raw = window.atob(base64)
    const arr = new Uint8Array(raw.length)
    for (let i = 0; i < raw.length; ++i) arr[i] = raw.charCodeAt(i)
    return URL.createObjectURL(new Blob([arr], { type: 'image/png' }))
  } catch {
    return null
  }
}

/** Up to two-letter initials from a player name; "?" when empty. */
export function initials(name: string | undefined): string {
  if (!name) return '?'
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase()
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase()
}
