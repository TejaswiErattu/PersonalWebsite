import type { SectionId } from '../content/content'

/**
 * The route table. This is the only place routes are declared, and it is read
 * by four different consumers:
 *
 *   1. the client router, to decide which view to mount
 *   2. the <head> manager, to set title/description/canonical on navigation
 *   3. the build-time prerenderer, to emit one static HTML file per route
 *   4. the sitemap.xml and llms.txt generators
 *
 * Keeping them on one table is the whole point. A sitemap that lists a URL the
 * router does not know about is a 404 handed straight to Google, and a route
 * with no canonical is a duplicate-content bug that nobody notices for months.
 */
export type RouteId =
  | 'home'
  | 'play'
  | 'about'
  | 'projects'
  | 'project-findar'
  | 'project-unearthed'
  | 'project-terralend'
  | 'project-kaw'
  | 'project-bump'
  | 'experience'
  | 'education'
  | 'security'
  | 'achievements'
  | 'contact'
  | 'credits'
  | 'notFound'

export interface RouteMeta {
  id: RouteId
  path: string
  /**
   * The full <title>. Written out per route rather than templated from the
   * section name, because a title is the single most valuable ~60 characters
   * on the page and deserves to be phrased, not generated.
   */
  title: string
  /** Meta description. Kept under ~155 characters so it is not truncated. */
  description: string
  /** Text of the <h1> for this view. Exactly one per view. */
  heading: string
  /** Set for routes that render a single classic-mode section. */
  section?: SectionId
  /**
   * Set for routes that render one project's long-form write-up — the id
   * matches `content.projects[].id`. Mutually exclusive with `section`.
   */
  project?: string
  /** Excluded from sitemap.xml — the 404 must never be advertised. */
  noIndex?: boolean
}

const NAME = 'Tejaswi Erattu Taj'

export const routes: RouteMeta[] = [
  {
    id: 'home',
    path: '/',
    title: `${NAME} — Software & Security Engineer`,
    description:
      'Software and security engineer, UW Informatics 2028. Explore my portfolio as a pixel-art village, or read it as a plain page.',
    heading: NAME,
  },
  {
    id: 'play',
    path: '/play',
    title: `Explore the village — ${NAME}`,
    description:
      'Walk a pixel-art village to tour my projects, experience and security work. Arrow keys or WASD to move, E to talk. Or skip to the readable version.',
    heading: 'Explore the village',
  },
  {
    id: 'about',
    path: '/about',
    title: `About — ${NAME}`,
    description:
      'UW Informatics student building data infrastructure and web applications. Database migrations, machine learning models, and production security work.',
    heading: 'About Tejaswi Erattu Taj',
    section: 'about',
  },
  {
    id: 'projects',
    path: '/projects',
    title: `Projects — ${NAME}`,
    description:
      'Findar AR object finder for iOS, a VS Code Git extension with secret scanning, TerraLend, Bump, and the Unearthed FLL site. Tech, impact and takeaways.',
    heading: 'Projects',
    section: 'projects',
  },
  {
    id: 'project-findar',
    path: '/projects/findar',
    title: `Findar — AR object finder — ${NAME}`,
    description:
      'How Findar uses ARKit, LiDAR depth sensing, and YOLOv8 object detection to find lost items and guide you to them with voice and haptic feedback.',
    heading: 'Findar — AR Object Finder (iOS)',
    project: 'findar',
  },
  {
    id: 'project-unearthed',
    path: '/projects/unearthed',
    title: `Unearthed Dinos website — ${NAME}`,
    description:
      'A full-stack FIRST LEGO League team website with an AI chatbot, interactive timeline, team profiles, and a community outreach showcase.',
    heading: 'Unearthed Dinos FIRST LEGO League Website',
    project: 'unearthed',
  },
  {
    id: 'project-terralend',
    path: '/projects/terralend',
    title: `TerraLend — climate-aware lending — ${NAME}`,
    description:
      'How TerraLend prices agricultural loans with live satellite and weather data instead of static, regional-average interest rates.',
    heading: 'TerraLend',
    project: 'terralend',
  },
  {
    id: 'project-kaw',
    path: '/projects/kaw',
    title: `Kerala Association migration — ${NAME}`,
    description:
      'A production WordPress migration that moved 2,800+ member records with custom PHP plugins, automated imports, and daily backups — zero data loss.',
    heading: 'Kerala Association Membership Platform',
    project: 'kaw',
  },
  {
    id: 'project-bump',
    path: '/projects/bump',
    title: `Bump — proximity-based meetups — ${NAME}`,
    description:
      'How Bump uses CoreLocation proximity detection and calendar integration to help friends meet up spontaneously, with privacy-first controls.',
    heading: 'Bump',
    project: 'bump',
  },
  {
    id: 'experience',
    path: '/experience',
    title: `Experience — ${NAME}`,
    description:
      'Security engineering at Palana, a 2,800-record WordPress migration for Kerala Association of Washington, machine learning at Apollo AI, and teaching.',
    heading: 'Experience',
    section: 'experience',
  },
  {
    id: 'education',
    path: '/education',
    title: `Education & skills — ${NAME}`,
    description:
      'BS Informatics at the University of Washington, expected 2028, focused on software engineering and cyber security. Full technical skills breakdown.',
    heading: 'Education & skills',
    section: 'education',
  },
  {
    id: 'security',
    path: '/security',
    title: `Security engineering — ${NAME}`,
    description:
      'STRIDE threat modeling across 10+ product surfaces, a confirmed privilege-escalation finding, Burp Suite penetration testing, and CI/CD static analysis.',
    heading: 'Security engineering',
    section: 'security',
  },
  {
    id: 'achievements',
    path: '/achievements',
    title: `Achievements & leadership — ${NAME}`,
    description:
      'AWS AI Practitioner, CompTIA Security+, AWS Cloud Practitioner, Finance Director for UW Women in Informatics, and three years of teaching.',
    heading: 'Achievements & leadership',
    section: 'achievements',
  },
  {
    id: 'contact',
    path: '/contact',
    title: `Contact — ${NAME}`,
    description:
      'Looking for 2027 software engineering and security internships. Email, LinkedIn, GitHub, and role-specific resumes for software and security tracks.',
    heading: 'Contact',
    section: 'contact',
  },
  {
    id: 'credits',
    path: '/credits',
    title: `Credits & licensing — ${NAME}`,
    description:
      'Every font, library and tool this site is built on, with author, source and licence. Site code is MIT; third-party work keeps its own terms.',
    heading: 'Credits & licensing',
  },
  {
    id: 'notFound',
    path: '/404',
    title: `Page not found — ${NAME}`,
    description: 'That path is not on the map. Head back to the village or read the portfolio.',
    heading: 'You have wandered off the map',
    noIndex: true,
  },
]

const byId = new Map(routes.map((route) => [route.id, route]))
const byPath = new Map(routes.map((route) => [route.path, route]))

export function getRoute(id: RouteId): RouteMeta {
  const route = byId.get(id)
  if (!route) throw new Error(`Unknown route id: ${id}`)
  return route
}

/**
 * Resolves a URL pathname to a route. Trailing slashes are normalised so that
 * `/about` and `/about/` are the same route rather than one of them 404ing —
 * a classic source of accidental dead links in shared URLs.
 */
export function matchRoute(pathname: string): RouteMeta {
  const normalised =
    pathname.length > 1 && pathname.endsWith('/') ? pathname.replace(/\/+$/, '') : pathname
  return byPath.get(normalised || '/') ?? getRoute('notFound')
}

/**
 * The classic-mode sections in reading order, which is also the order the
 * buildings appear when walking the village. Drives both the section nav and
 * the previous/next links at the foot of each section page.
 */
export const sectionRoutes: RouteMeta[] = routes.filter((route) => route.section !== undefined)

/**
 * The project write-up pages, in the same order they appear in `routes`
 * (which mirrors `content.projects`, minus the two projects with no
 * long-form page). Drives the previous/next links at the foot of each one.
 */
export const projectRoutes: RouteMeta[] = routes.filter((route) => route.project !== undefined)

/** Routes that belong in sitemap.xml. */
export const indexableRoutes: RouteMeta[] = routes.filter((route) => !route.noIndex)
