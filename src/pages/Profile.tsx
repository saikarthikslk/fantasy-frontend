import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthToken } from '../auth/useAuthToken'
import { decodeJwtPayload } from '../api/client'
import { getUserProfile, updateGameName, uploadProfilePicture } from '../api/profileApi.ts'
import type { ApiUser } from '../types/api.ts'
import '../styles/Profile.css'

export function Profile() {
  const token = useAuthToken()
  const navigate = useNavigate()

  const [user, setUser] = useState<ApiUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Form states
  const [gameName, setGameName] = useState('')
  const [profilePicture, setProfilePicture] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const emailFromToken = useMemo(() => {
    const payload = decodeJwtPayload(token)
    if (!payload) return null
    const keys = ['email', 'upn', 'preferred_username', 'sub']
    for (const k of keys) {
      const v = payload[k]
      if (typeof v === 'string' && v.trim().length > 0) return v
    }
    return null
  }, [token])

  // Fetch user profile on mount
  useEffect(() => {
    if (!token) {
      navigate('/')
      return
    }
    function base64ToBlobUrl(base64: string) {
      if (!base64) return null
      const raw = window.atob(base64)
      const uInt8Array = new Uint8Array(raw.length)
      for (let i = 0; i < raw.length; ++i) uInt8Array[i] = raw.charCodeAt(i)
      const blob = new Blob([uInt8Array], { type: 'image/png' })
      return URL.createObjectURL(blob)
    }

    const fetchProfile = async () => {
      try {
        setLoading(true)
        const profile = await getUserProfile()
        setUser(profile)
        setGameName(profile.gamename || profile.email || emailFromToken || '')
        if (profile.profielpic) {
          setPreviewUrl(base64ToBlobUrl(profile.profielpic))
        }
        setError(null)
      } catch (err) {
        // Frontend fallback: still show email from JWT even if profile endpoint fails.
        if (emailFromToken) {
          setUser({ email: emailFromToken })
          setGameName(emailFromToken)
          setError(null)
        } else {
          setError(err instanceof Error ? err.message : 'Failed to load profile')
        }
      } finally {
        setLoading(false)
      }
    }

    fetchProfile()
  }, [token, navigate, emailFromToken])

  // Handle profile picture selection
  const handlePictureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setProfilePicture(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  // Handle game name update
  const handleGameNameUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setUploading(true)
      setError(null)
      await updateGameName(gameName)
      setSuccessMessage('Game name updated successfully!')
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update game name')
    } finally {
      setUploading(false)
    }
  }

  // Handle profile picture upload
  const handlePictureUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!profilePicture) {
      setError('Please select an image')
      return
    }

    try {
      setUploading(true)
      setError(null)
      await uploadProfilePicture(profilePicture)
      setProfilePicture(null)
      setSuccessMessage('Profile picture updated successfully!')
      setTimeout(() => setSuccessMessage(null), 3000)
      // Refresh user data
      const profile = await getUserProfile()
      setUser(profile)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload picture')
    } finally {
      setUploading(false)
    }
  }

  if (!token) {
    return (
      <div className="profile-container">
        <div className="profile-card">
          <p>Please sign in to view your profile</p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="profile-container">
        <div className="profile-card">
          <p>Loading profile...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="profile-container">
        <div className="profile-card">
          <p>Failed to load profile</p>
        </div>
      </div>
    )
  }

  return (
    <div className="profile-container">
      <div className="profile-card">
        <div className="profile-header">
          <h1>My Profile</h1>
          <p className="profile-email">Email: {user.email || emailFromToken || 'Unknown'}</p>
        </div>

        {error && <div className="alert alert-error">{error}</div>}
        {successMessage && <div className="alert alert-success">{successMessage}</div>}

        <div className="profile-content">
          {/* Profile Picture Section */}
          <div className="profile-section">
            <h2>Profile Picture</h2>
            <div className="picture-display">
              {previewUrl ? (
                <img src={previewUrl} alt="Profile" className="profile-picture" />
              ) : (
                <div className="profile-picture-placeholder">No picture</div>
              )}
            </div>

            <form onSubmit={handlePictureUpload} className="picture-form">
              <div className="form-group">
                <label htmlFor="picture-input" className="form-label">
                  Choose Image
                </label>
                <input
                  id="picture-input"
                  type="file"
                  accept="image/*"
                  onChange={handlePictureChange}
                  disabled={uploading}
                  className="form-input"
                />
                {profilePicture && <p className="form-hint">Selected: {profilePicture.name}</p>}
              </div>
              <button
                type="submit"
                disabled={!profilePicture || uploading}
                className="btn btn-primary"
              >
                {uploading ? 'Uploading...' : 'Upload Picture'}
              </button>
            </form>
          </div>

          {/* Game Name Section */}
          <div className="profile-section">
            <h2>Game Name</h2>
            <form onSubmit={handleGameNameUpdate} className="gamename-form">
              <div className="form-group">
                <label htmlFor="gameName" className="form-label">
                  Your Game Name
                </label>
                <input
                  id="gameName"
                  type="text"
                  value={gameName}
                  onChange={(e) => setGameName(e.target.value)}
                  disabled={uploading}
                  className="form-input"
                  placeholder="Enter your game name"
                />
              </div>
              <button type="submit" disabled={uploading} className="btn btn-primary">
                {uploading ? 'Saving...' : 'Save Game Name'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
