import { content } from '../content/content'
import { Link } from '../router'
import {
  AboutSection,
  AchievementsSection,
  ContactSection,
  EducationSection,
  ExperienceSection,
  GrowthSection,
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

      {/* The single global nav (TopBar) already carries real <a href> links to
          every primary route, so this page does not repeat that list —
          repeating it here is what used to produce two navigation bars on
          every classic page. Older sections that aren't in the primary nav
          (education, security, achievements) stay reachable from here since
          this page renders every section in one scroll, plus their own
          in-page cross-links to one another. */}
      <AboutSection level={2} title="About" />
      <ExperienceSection level={2} title="Experience" />
      <ProjectsSection level={2} title="Projects" />
      <EducationSection level={2} title="Education & skills" />
      <SecuritySection level={2} title="Security engineering" />
      <AchievementsSection level={2} title="Achievements & leadership" />
      <GrowthSection level={2} title="Growth" />
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
