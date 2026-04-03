const API_BASE = import.meta.env.VITE_API_BASE ?? 'http://javacloud-app.duckdns.org:8080'

/** Spring Boot serves OAuth at this origin; not proxied (browser must hit 8080 for redirects). */
export const BACKEND_ORIGIN =
  import.meta.env.VITE_BACKEND_ORIGIN ?? 'http://javacloud-app.duckdns.org:8080'

export const OAUTH_GOOGLE_URL = `${BACKEND_ORIGIN}/oauth2/authorization/google`

/**
 * Primary key for persisting the JWT in `localStorage`.
 * Legacy key `jwt` is read once and migrated.
 */
export const JWT_STORAGE_KEY = 'fantasyf_jwt'

const LEGACY_JWT_KEYS = ['jwt'] as const

/** Fired when {@link setToken} runs so UI can re-read auth state. */
export const AUTH_CHANGE = 'fantasyf-auth-change'

function readTokenFromStorage(): string | null {
  const current = localStorage.getItem(JWT_STORAGE_KEY)
  if (current) return current
  for (const legacy of LEGACY_JWT_KEYS) {
    const old = localStorage.getItem(legacy)
    if (old) {
      localStorage.setItem(JWT_STORAGE_KEY, old)
      localStorage.removeItem(legacy)
      return old
    }
  }
  return null
}

/** Returns the JWT persisted in `localStorage` under {@link JWT_STORAGE_KEY}. */
export function getToken(): string | null {
  return readTokenFromStorage()
}

/** Saves or clears the JWT in `localStorage` and notifies listeners. */
export function setToken(token: string | null): void {
  for (const legacy of LEGACY_JWT_KEYS) localStorage.removeItem(legacy)
  if (token) localStorage.setItem(JWT_STORAGE_KEY, token)
  else localStorage.removeItem(JWT_STORAGE_KEY)
  window.dispatchEvent(new Event(AUTH_CHANGE))
}

export function apiUrl(path: string): string {
  const p = path.startsWith('/') ? path : `/${path}`
  return `${API_BASE}${p}`
}

/**
 * Player headshots via your PictureController proxy.
 * GET /redirect/{imageId}/i.jpg
 */
export function playerImageUrl(imageId: number): string {
  return apiUrl(`/redirect/${imageId}/i.jpg`)
}

export async function apiFetch(
  path: string,
  init?: RequestInit,
): Promise<Response> {
  const token = getToken()
  const headers = new Headers(init?.headers)
  if (token) headers.set('key', token)
  if (!headers.has('Content-Type') && init?.body != null) {
    headers.set('Content-Type', 'application/json')
  }
  const url = apiUrl(path)
  return fetch(url, { ...init, headers })
}

/**
 * Best-effort JWT payload decode for frontend display (e.g. profile email).
 */
export function decodeJwtPayload(
  token: string | null,
): Record<string, unknown> | null {
  if (!token) return null
  try {
    const parts = token.split('.')
    if (parts.length < 2) return null
    const b64 = parts[1].replace(/-/g, '+').replace(/_/g, '/')
    const padded = b64 + '='.repeat((4 - (b64.length % 4 || 4)) % 4)
    const json = window.atob(padded)
    return JSON.parse(json) as Record<string, unknown>
  } catch {
    return null
  }
}
