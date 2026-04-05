import { apiFetch, getToken } from './client'
import type { ApiUser } from '../types/api'

/**
 * Fetch the current user's profile
 */
export async function getUserProfile(): Promise<ApiUser> {
  const token = getToken()
  if (!token) throw new Error('Not authenticated')

  const response = await apiFetch('/api/user/profile', { method: 'GET' })

  if (!response.ok) {
    const err = await response.text()
    throw new Error(err || `Failed to fetch profile: ${response.status}`)
  }

  return response.json()
}

/**
 * Update user's game name
 */
export async function updateGameName(gameName: string): Promise<ApiUser> {
  const token = getToken()
  if (!token) throw new Error('Not authenticated')

  const response = await apiFetch('/api/user/upload', {
    method: 'POST',
    body: JSON.stringify({ name: gameName, image: null }),
  })

  if (!response.ok) {
    const err = await response.text()
    throw new Error(err || `Failed to update game name: ${response.status}`)
  }

  return response.json()
}

/**
 * Update user's auto-team preference
 */
export async function updateAutoTeam(autoteam: boolean): Promise<ApiUser> {
  const token = getToken()
  if (!token) throw new Error('Not authenticated')

  const response = await apiFetch('/api/user/upload', {
    method: 'POST',
    body: JSON.stringify({ name: null, image: null, autoteam }),
  })

  if (!response.ok) {
    const err = await response.text()
    throw new Error(err || `Failed to update preference: ${response.status}`)
  }

  return response.json()
}

/**
 * Upload user's profile picture
 */
export async function uploadProfilePicture(file: File): Promise<ApiUser> {
  const token = getToken()
  if (!token) throw new Error('Not authenticated')

  const bytes = new Uint8Array(await file.arrayBuffer())
  const response = await apiFetch('/api/user/upload', {
    method: 'POST',
    body: JSON.stringify({ image: [...bytes], name: null }),
  })

  if (!response.ok) {
    const err = await response.text()
    throw new Error(err || `Failed to upload picture: ${response.status}`)
  }

  return response.json()
}
