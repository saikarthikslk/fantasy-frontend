import { useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { setToken } from '../api/client'

/**
 * OAuth success handler redirects to e.g. /#/matches?token=...
 * Persist JWT and strip token from the URL.
 */
export function TokenCapture({setroot}: {setroot: (token: string | null) => void}) {
  const [searchParams, setSearchParams] = useSearchParams()

  useEffect(() => {
    const token = searchParams.get('token')
    if (!token) return
    setToken(token)
    const next = new URLSearchParams(searchParams)
    next.delete('token')
    setroot(token);
    setSearchParams(next, { replace: true })
  }, [searchParams, setSearchParams])

  return null
}
