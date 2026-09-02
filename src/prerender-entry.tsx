import { renderToStaticMarkup } from 'react-dom/server'

import App from './App'
import { StaticRouter } from './router'
import { content } from './content/content'
import { creditGroups, originalWork } from './content/credits'
import { routes, indexableRoutes, type RouteMeta } from './seo/routes'
import {
  OG_IMAGE_ALT,
  OG_IMAGE_HEIGHT,
  OG_IMAGE_PATH,
  OG_IMAGE_WIDTH,
  SITE_NAME,
  SITE_ORIGIN,
  absoluteUrl,
} from './seo/site'
import { buildPersonSchema, serialiseSchema } from './seo/structuredData'

/**
 * Build-time rendering entry point.
 *
 * This module is compiled by `vite build --ssr` and executed by
 * `scripts/prerender.mjs` in plain Node. Rendering the real components rather
 * than hand-writing template strings is the whole point: there is exactly one
 * definition of the markup, so the static HTML a crawler reads can never drift
 * from the HTML the app renders.
 */

/** Escapes text for safe interpolation into an HTML attribute. */
function attr(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/**
 * The per-route <head>. Every tag here is also set at runtime by
 * `useDocumentHead`, but baking them into the static file means a crawler,
 * a social scraper or a plain `curl` gets the right metadata without running
 * any JavaScript at all — which is the difference between a link preview
 * working and showing a blank card.
 */
function renderHead(route: RouteMeta): string {
  const canonical = absoluteUrl(route.path)
  const ogImage = absoluteUrl(OG_IMAGE_PATH)
  const tags: string[] = [
    `<title>${attr(route.title)}</title>`,
    `<meta name="description" content="${attr(route.description)}" />`,
    `<link rel="canonical" href="${canonical}" />`,

    `<meta property="og:type" content="${route.id === 'home' ? 'profile' : 'website'}" />`,
    `<meta property="og:site_name" content="${attr(SITE_NAME)}" />`,
    `<meta property="og:title" content="${attr(route.title)}" />`,
    `<meta property="og:description" content="${attr(route.description)}" />`,
    `<meta property="og:url" content="${canonical}" />`,
    `<meta property="og:locale" content="en_US" />`,
    `<meta property="og:image" content="${ogImage}" />`,
    `<meta property="og:image:type" content="image/png" />`,
    `<meta property="og:image:width" content="${OG_IMAGE_WIDTH}" />`,
    `<meta property="og:image:height" content="${OG_IMAGE_HEIGHT}" />`,
    `<meta property="og:image:alt" content="${attr(OG_IMAGE_ALT)}" />`,

    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${attr(route.title)}" />`,
    `<meta name="twitter:description" content="${attr(route.description)}" />`,
    `<meta name="twitter:image" content="${ogImage}" />`,
    `<meta name="twitter:image:alt" content="${attr(OG_IMAGE_ALT)}" />`,

    `<meta name="author" content="${attr(content.person.name)}" />`,
  ]

  if (route.id === 'home') {
    tags.push(
      `<meta property="profile:first_name" content="Tejaswi" />`,
      `<meta property="profile:last_name" content="Erattu Taj" />`,
    )
  }

  if (route.noIndex) {
    tags.push(`<meta name="robots" content="noindex, follow" />`)
  }

  // JSON-LD goes on every page so any entry point carries the identity, which
  // is what lets a search engine connect the routes to one person rather than
  // to seven unrelated documents.
  tags.push(
    `<script type="application/ld+json">${serialiseSchema(buildPersonSchema())}</script>`,
  )

  return tags.join('\n    ')
}

/** The prerendered body markup for a route. */
function renderBody(route: RouteMeta): string {
  return renderToStaticMarkup(
    <StaticRouter route={route}>
      <App />
    </StaticRouter>,
  )
}

export interface RenderedRoute {
  id: string
  path: string
  head: string
  body: string
}

export function renderAllRoutes(): RenderedRoute[] {
  return routes.map((route) => ({
    id: route.id,
    path: route.path,
    head: renderHead(route),
    body: renderBody(route),
  }))
}

/* ------------------------------------------------------------------ */
/* Generated text files                                                */
/* ------------------------------------------------------------------ */

export function renderSitemap(lastModified: string): string {
  const urls = indexableRoutes
    .map((route) => {
      // The homepage is the entry point and carries the most content; section
      // pages sit below it. Priority is a hint, not a ranking lever, but an
      // unset one lets a crawler guess badly.
      const priority = route.id === 'home' ? '1.0' : route.section ? '0.8' : '0.5'
      return [
        '  <url>',
        `    <loc>${absoluteUrl(route.path)}</loc>`,
        `    <lastmod>${lastModified}</lastmod>`,
        `    <changefreq>monthly</changefreq>`,
        `    <priority>${priority}</priority>`,
        '  </url>',
      ].join('\n')
    })
    .join('\n')

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`
}

export function renderRobots(): string {
  return `# https://www.robotstxt.org/robotstxt.html
User-agent: *
Allow: /

Sitemap: ${SITE_ORIGIN}/sitemap.xml
`
}

/**
 * llms.txt — a plain-text summary for language models.
 *
 * The format is deliberately simple: a heading, a one-line summary, then
 * linked sections. The reason this file exists is practical rather than
 * theoretical — recruiters increasingly paste a portfolio URL into an
 * assistant and ask it to summarise, and a model that can read prose instead
 * of guessing from a JavaScript bundle gives a far more accurate answer.
 */
export function renderLlmsTxt(): string {
  const { person, about, education, security, contact, projects } = content

  const lines: string[] = [
    `# ${person.name}`,
    '',
    `> ${person.title}. ${about.subheadline}`,
    '',
    `${person.name} is an Informatics student at the ${education.school} (${education.degree}, focus: ${education.focusArea}, expected ${education.expectedGraduation}) and a ${security.role} at ${security.organization}. Based in ${person.location}. ${contact.availability}.`,
    '',
    '## Pages',
    '',
  ]

  for (const route of indexableRoutes) {
    lines.push(`- [${route.heading}](${absoluteUrl(route.path)}): ${route.description}`)
  }

  lines.push('', '## Projects', '')
  for (const project of projects) {
    lines.push(`- **${project.title}**${project.period ? ` (${project.period})` : ''}: ${project.blurb} Tech: ${project.tech.join(', ')}.`)
  }

  lines.push('', '## Contact', '')
  lines.push(`- Email: ${contact.email}`)
  lines.push(`- LinkedIn: ${contact.linkedin}`)
  lines.push(`- GitHub: ${contact.github}`)
  lines.push(`- Seeking: ${contact.rolesSeeking.join(', ')}`)

  lines.push('', '## Notes', '')
  lines.push(
    '- This site has two equivalent presentations: an explorable pixel-art village and a plain readable page. Both contain the same information.',
  )
  lines.push('- Site code is MIT licensed. See /credits for third-party licences.')
  lines.push('')

  return lines.join('\n')
}

/** CREDITS.md, generated from the same data the credits UI renders. */
export function renderCreditsMarkdown(): string {
  const lines: string[] = [
    '# Credits',
    '',
    '<!-- Generated by scripts/prerender.mjs from src/content/credits.ts. Edit that file, not this one. -->',
    '',
    "This site leans on other people's work. Everything below is listed with its author, a link to the source, and the licence it is used under.",
    '',
  ]

  for (const group of creditGroups) {
    lines.push(`## ${group.title}`, '')
    for (const entry of group.entries) {
      lines.push(`### ${entry.name}`, '')
      lines.push(`- **Author:** ${entry.author}`)
      lines.push(`- **Source:** <${entry.source}>`)
      lines.push(`- **Licence:** [${entry.license}](${entry.licenseUrl})`)
      lines.push(`- **Used for:** ${entry.usage}`)
      lines.push('')
    }
  }

  lines.push('## Original to this project', '')
  for (const item of originalWork) {
    lines.push(`### ${item.title}`, '')
    lines.push(item.detail, '')
  }

  lines.push('## Licensing', '')
  lines.push(
    'The code for this site is released under the MIT licence — see [LICENSE](./LICENSE). That licence covers the code only. Third-party libraries and the typeface retain their own licences, listed above, and nothing in this repository grants any additional rights over them.',
    '',
  )

  return lines.join('\n')
}
