import { content, sections } from '../content/content'
import { Link } from '../router'
import { projectRoutes, sectionRoutes, type RouteMeta } from '../seo/routes'
import { DetailBlockView } from './DetailBlockView'

/**
 * One project's long-form write-up, at its own URL (e.g. `/projects/findar`).
 *
 * Ported from the old portfolio's in-depth pages. Carries the same section
 * nav as `SectionPage` — so a crawler landing here can still reach every
 * other part of the site — plus a project-specific pager that pages through
 * `projectRoutes` instead, wrapping out to `/projects` at either end.
 */
export default function ProjectPage({ route }: { route: RouteMeta }) {
  if (!route.project) throw new Error(`Route ${route.id} has no project`)

  const project = content.projects.find((candidate) => candidate.id === route.project)
  if (!project?.detail) {
    throw new Error(`Route ${route.id} points at project "${route.project}", which has no detail`)
  }
  const { detail } = project

  const index = projectRoutes.findIndex((candidate) => candidate.id === route.id)
  const previous = index > 0 ? projectRoutes[index - 1] : undefined
  const next = index < projectRoutes.length - 1 ? projectRoutes[index + 1] : undefined

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
                aria-current={candidate.section === 'projects' ? 'page' : undefined}
              >
                {labelFor(candidate)}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <article className="detail-page">
        <header className="detail-hero">
          {detail.eyebrow && <p className="detail-eyebrow">{detail.eyebrow}</p>}
          <h1>
            {route.heading}
            {project.period ? ` — ${project.period}` : ''}
          </h1>
          <p className="detail-intro">{detail.intro}</p>
          {!!detail.badges?.length && (
            <ul className="detail-badges">
              {detail.badges.map((badge) => (
                <li key={badge}>{badge}</li>
              ))}
            </ul>
          )}
          {/* The "Read the full write-up" entry points at this exact page —
              showing it here would be a link to itself, so it's dropped. */}
          <ul className="detail-hero-links">
            {project.links
              .filter((link) => link.href !== route.path)
              .map((link) => (
                <li key={link.href + link.label}>
                  {link.href.startsWith('/') ? (
                    <Link className="detail-hero-link" to={link.href}>
                      {link.label}
                    </Link>
                  ) : (
                    <a
                      className="detail-hero-link"
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {link.label}
                    </a>
                  )}
                </li>
              ))}
          </ul>
        </header>

        {detail.blocks.map((block, blockIndex) => (
          // Block order is fixed content from content.ts, never reordered or
          // filtered at runtime, so an index key is stable here.
          <DetailBlockView key={blockIndex} block={block} level={2} />
        ))}
      </article>

      <nav className="classic-pager" aria-label="Previous and next project">
        {previous ? (
          <Link to={previous.path} rel="prev">
            ← {previous.heading}
          </Link>
        ) : (
          <Link to="/projects" rel="prev">
            ← All projects
          </Link>
        )}
        {next ? (
          <Link to={next.path} rel="next">
            {next.heading} →
          </Link>
        ) : (
          <Link to="/projects" rel="next">
            All projects →
          </Link>
        )}
      </nav>
    </main>
  )
}
