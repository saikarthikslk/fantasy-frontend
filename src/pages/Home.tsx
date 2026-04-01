import { Link } from 'react-router-dom'
import { OAUTH_GOOGLE_URL } from '../api/client'
import { useAuthToken } from '../auth/useAuthToken'

export function Home() {
  const token = useAuthToken()

  return (
    <div className="page home-page">
      <section className="home-hero" aria-labelledby="home-title">
        <div className="home-hero__content">
          <p className="eyebrow">Fantasy cricket</p>
          <h1 id="home-title">Pick your XI. Captain. Vice-captain. Points.</h1>
          <p className="lede">
            Choose real fixtures, build an 11-player squad under fantasy rules, set your
            captain and vice-captain, then follow scorecards and leaderboards match by
            match.
          </p>
          <div className="hero-actions">
            {!token && (
              <a className="btn btn-primary" href={OAUTH_GOOGLE_URL}>
                Sign in with Google
              </a>
            )}
            {token!==null && (
              <>
            <Link to="/matches" className={`btn ${token ? 'btn-primary' : 'btn-ghost'}`}>
              View matches
            </Link>
            <Link to="/leaderboard" className="btn btn-ghost">
              Leaderboard
            </Link>
            </>
          )
}  
          </div>
          <p className="home-signin-hint muted small">
            {token
              ? 'You’re signed in — open a match to see the scorecard or create your dream team.'
              : 'Sign in to save your team and compete on the leaderboard.'}
          </p>
        </div>
        <div className="home-hero__art" aria-hidden>
          <div className="home-hero__pitch">
            <span className="home-hero__crease" />
            <span className="home-hero__stumps" />
          </div>
        </div>
      </section>

      <section className="home-steps" aria-labelledby="steps-title">
        <h2 id="steps-title" className="home-section-title">
          How it works
        </h2>
        <ol className="home-steps__list">
          <li className="home-step">
            <span className="home-step__n">1</span>
            <div>
              <strong>Choose a match</strong>
              <p className="muted small">
                Filter upcoming, live, or completed fixtures and open any card for the
                scorecard and match leaderboard.
              </p>
            </div>
          </li>
          <li className="home-step">
            <span className="home-step__n">2</span>
            <div>
              <strong>Create your dream team</strong>
              <p className="muted small">
                Stay within credits, balance WK / BAT / AR / BOWL, and max players per
                real team — then pick captain &amp; VC.
              </p>
            </div>
          </li>
          <li className="home-step">
            <span className="home-step__n">3</span>
            <div>
              <strong>Track the game</strong>
              <p className="muted small">
                Follow the match hub for scores (when connected) and fantasy standings as
                the game unfolds.
              </p>
            </div>
          </li>
        </ol>
      </section>

      <section className="home-features" aria-labelledby="feat-title">
        <h2 id="feat-title" className="home-section-title">
          Why FantasyF
        </h2>
        <div className="home-features__grid">
          <article className="home-feature-card">
            <span className="home-feature-card__icon" aria-hidden>
              ◉
            </span>
            <h3>Cricket only</h3>
            <p className="muted small">
              One sport, one flow — squads and roles tuned for T20-style fantasy, not a
              generic multi-sport feed.
            </p>
          </article>
          <article className="home-feature-card">
            <span className="home-feature-card__icon" aria-hidden>
              ⚡
            </span>
            <h3>Live &amp; upcoming</h3>
            <p className="muted small">
              Tabs for match status so you can plan teams ahead, follow live games, or
              review finished matches.
            </p>
          </article>
          <article className="home-feature-card">
            <span className="home-feature-card__icon" aria-hidden>
              ✓
            </span>
            <h3>Fair squad rules</h3>
            <p className="muted small">
              Credits, role limits, and team caps keep picks challenging — same spirit as
              popular fantasy cricket apps.
            </p>
          </article>
        </div>
      </section>
    </div>
  )
}
