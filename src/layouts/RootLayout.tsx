import { NavLink, Outlet } from 'react-router-dom'
import { OAUTH_GOOGLE_URL, setToken } from '../api/client'
import { useAuthToken } from '../auth/useAuthToken'
import { TokenCapture } from '../components/TokenCapture'

const linkClass = ({ isActive }: { isActive: boolean }) =>
  `nav-link${isActive ? ' nav-link--active' : ''}`

export function RootLayout() {
  const token = useAuthToken()

  return (
    <div className="app-shell">
      <TokenCapture />
      <header className="top-bar">
        <NavLink to="/" className="brand" end title="Cricket fantasy — dream teams">
          <span className="brand-mark" aria-hidden />
          FantasyF
        </NavLink>
        <div className="top-bar__right">
          <nav className="top-nav" aria-label="Main">
            <NavLink to="/" className={linkClass} end>
              Home
            </NavLink>
            <NavLink to="/matches" className={linkClass}>
              Matches
            </NavLink>
            <NavLink to="/leaderboard" className={linkClass}>
              Leaderboard
            </NavLink>
            {token && (
              <NavLink to="/profile" className={linkClass}>
                Profile
              </NavLink>
            )}
          </nav>
          <div className="auth-strip">
            {token ? (
              <>
                <span className="auth-strip__ok muted small">Signed in</span>
                <button
                  type="button"
                  className="btn btn-ghost btn-tiny"
                  onClick={() => setToken(null)}
                >
                  Sign out
                </button>
              </>
            ) : (
              <a className="btn btn-small btn-primary" href={OAUTH_GOOGLE_URL}>
                Sign in with Google
              </a>
            )}
          </div>
        </div>
      </header>
      <main className="main-content">
        <Outlet />
      </main>
      <footer className="foot-note">
        Cricket fantasy · dream teams · API on port 8080 (dev proxy <code>/api</code>)
      </footer>
    </div>
  )
}
