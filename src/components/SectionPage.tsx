import { sections } from '../content/content'
import { Link } from '../router'
import { sectionRoutes, type RouteMeta } from '../seo/routes'
import { sectionComponents } from './sections'

/**
 * A single classic-mode section rendered at its own URL, e.g. `/projects`.
 *
 * The section's title is the page's only <h1> (supplied by the route table),
 * so the component renders at `level={1}` and its internal headings fall to h2
 * and h3 — no skipped levels, exactly one h1.
 *
 * Every section page carries the full section nav plus previous/next links.
 * That is what requirement 11 is really asking for: not decoration, but enough
 * internal links that a crawler entering on any single page can reach every
 * other page without going back to the homepage first.
 */
export default function SectionPage({ route }: { route: RouteMeta }) {
  if (!route.section) throw new Error(`Route ${route.id} has no section`)

  const Section = sectionComponents[route.section]
  const index = sectionRoutes.findIndex((candidate) => candidate.id === route.id)
  const previous = index > 0 ? sectionRoutes[index - 1] : undefined
  const next = index < sectionRoutes.length - 1 ? sectionRoutes[index + 1] : undefined

  const labelFor = (candidate: RouteMeta) =>
    sections.find((section) => section.id === candidate.section)?.label ?? candidate.heading

  return (
    <main className="classic classic-single">
      <nav className="classic-nav" aria-label="Portfolio sections">
        <ul>
          <li>
            <Link to="/">Overview</Link>
          </li>
          {sectionRoutes.map((candidate) => (
            <li key={candidate.id}>
              <Link
                to={candidate.path}
                aria-current={candidate.id === route.id ? 'page' : undefined}
              >
                {labelFor(candidate)}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <Section level={1} title={route.heading} />

      <nav className="classic-pager" aria-label="Previous and next section">
        {previous ? (
          <Link to={previous.path} rel="prev">
            ← {labelFor(previous)}
          </Link>
        ) : (
          <Link to="/" rel="prev">
            ← Overview
          </Link>
        )}
        {next ? (
          <Link to={next.path} rel="next">
            {labelFor(next)} →
          </Link>
        ) : (
          <Link to="/play" rel="next">
            Explore the village →
          </Link>
        )}
      </nav>
    </main>
  )
}
