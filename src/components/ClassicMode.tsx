import { content, sections } from '../content/content'
import { Link } from '../router'
import { sectionRoutes } from '../seo/routes'
import {
  AboutSection,
  AchievementsSection,
  ContactSection,
  EducationSection,
  ExperienceSection,
  ProjectsSection,
  SecuritySection,
} from './sections'

/**
 * The full readable portfolio, served at `/`.
 *
 * This is the version prerendered into index.html, so view-source on the
 * site's front door shows the actual bio, projects and experience rather than
 * an empty root div. It is also the accessible fallback for anyone who cannot
 * or does not want to play the game.
 *
 * Section order matches the village map — left to right, top row then bottom —
 * so reading this page top to bottom is the same trip as walking the world.
 */
export default function ClassicMode() {
  const { person } = content

  return (
    <main className="classic" id="classic-top">
      {/* The landing hero and the readable portfolio are one document rather
          than two screens. An interstitial that hides the content behind a
          click would mean the prerendered HTML and the rendered page disagree
          about what is on `/`, which is the definition of cloaking — and it
          also puts a barrier in front of a recruiter who just wants to read. */}
      <header className="classic-header landing-hero">
        <p className="landing-eyebrow">{person.title}</p>
        <h1>{person.name}</h1>
        <p className="landing-tagline">{person.tagline}</p>

        <div className="landing-actions">
          <Link to="/play" className="btn btn-primary">
            Start exploring
          </Link>
          <a href="#about" className="btn btn-secondary">
            Skip the game — read the portfolio
          </a>
        </div>

        <p className="landing-hint">
          In the village, move with <kbd>W</kbd> <kbd>A</kbd> <kbd>S</kbd> <kbd>D</kbd> or the
          arrow keys.
        </p>
      </header>

      {/* Real <a href> values pointing at real prerendered routes. This is what
          turns the site from one page into a connected graph a crawler can
          walk, rather than a single document with in-page anchors. */}
      <nav className="classic-nav" aria-label="Portfolio sections">
        <ul>
          {sectionRoutes.map((route) => {
            const label = sections.find((section) => section.id === route.section)?.label
            return (
              <li key={route.id}>
                <Link to={route.path}>{label ?? route.heading}</Link>
              </li>
            )
          })}
        </ul>
      </nav>

      <AboutSection level={2} title="About" />
      <ProjectsSection level={2} title="Projects" />
      <ExperienceSection level={2} title="Experience" />
      <EducationSection level={2} title="Education & skills" />
      <SecuritySection level={2} title="Security engineering" />
      <AchievementsSection level={2} title="Achievements & leadership" />
      <ContactSection level={2} title="Contact" />

      <footer className="classic-footer">
        <p>
          <Link to="/credits">Credits &amp; licensing</Link> ·{' '}
          <Link to="/play">Explore the village</Link>
        </p>
      </footer>
    </main>
  )
}
