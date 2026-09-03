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
 * Every section page carries previous/next links chaining through every
 * section (see `sectionRoutes` in `seo/routes.ts`) plus the global nav in
 * `TopBar` — enough internal links that a crawler entering on any single
 * page can reach every other page without going back to the homepage first.
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
      {/* No second nav list here — the single global nav (TopBar) already
          links to every primary section, and the pager below chains through
          every section (including the ones not in the primary nav) so a
          crawler can still walk the whole graph from any single page. */}
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
