import { useEffect, useState } from 'react'
import { AUTH_CHANGE, getToken } from '../api/client'

export function useAuthToken(): string | null {
  const [token, setTok] = useState(getToken)
  useEffect(() => {
    const on = () => setTok(getToken())
    window.addEventListener(AUTH_CHANGE, on)
    return () => window.removeEventListener(AUTH_CHANGE, on)
  }, [])
  return token
}
