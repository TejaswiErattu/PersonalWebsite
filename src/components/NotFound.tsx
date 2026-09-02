import { Link } from '../router'
import { sectionRoutes } from '../seo/routes'

/**
 * The 404 view.
 *
 * Deliberately CSS-only. Booting Kaplay to draw a real village here would mean
 * a mistyped URL downloads a 214 kB game engine, which is the worst possible
 * page to spend a visitor's bandwidth on. The scene below is built from a few
 * layered gradients and hard-edged blocks, so it reads as the same world at a
 * few hundred bytes.
 *
 * It links onward rather than dead-ending: the homepage, the game, and every
 * section — because the most likely reason someone is here is a stale or
 * truncated link to content that does still exist.
 */
export default function NotFound() {
  return (
    <main className="notfound">
      <div className="notfound-scene" aria-hidden="true">
        <div className="notfound-sky" />
        <div className="notfound-hill" />
        <div className="notfound-ground" />
        <div className="notfound-sign">
          <div className="notfound-sign-board">?</div>
          <div className="notfound-sign-post" />
        </div>
      </div>

      <div className="notfound-copy">
        <p className="notfound-code">Error 404</p>
        <h1>You have wandered off the map</h1>
        <p>
          There is no path here. The page you were looking for either moved or never existed.
        </p>

        <p className="notfound-actions">
          <Link to="/" className="notfound-primary">
            Back to the village
          </Link>
        </p>

        <nav aria-label="Portfolio sections">
          <p className="notfound-hint">Or jump straight to a section:</p>
          <ul className="notfound-links">
            {sectionRoutes.map((route) => (
              <li key={route.id}>
                <Link to={route.path}>{route.heading}</Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </main>
  )
}
