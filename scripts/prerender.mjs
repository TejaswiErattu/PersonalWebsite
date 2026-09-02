import { mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

/**
 * Build-time prerenderer.
 *
 * Runs after `vite build` (which produces dist/) and `vite build --ssr`
 * (which produces dist-ssr/prerender-entry.js). For each route it takes the
 * hashed script and stylesheet tags Vite already emitted into dist/index.html,
 * swaps in that route's <head> metadata, injects the server-rendered markup
 * into #root, and writes the result to its own path.
 *
 * The result is a static file per route containing the real content. A
 * crawler, a link preview scraper, a reader with JavaScript disabled, or a
 * plain curl all get the portfolio text without executing anything.
 */

const here = dirname(fileURLToPath(import.meta.url))
const projectRoot = resolve(here, '..')
const distDir = join(projectRoot, 'dist')
const ssrEntry = join(projectRoot, 'dist-ssr', 'prerender-entry.js')

const {
  renderAllRoutes,
  renderSitemap,
  renderRobots,
  renderLlmsTxt,
  renderCreditsMarkdown,
} = await import(ssrEntry)

const template = await readFile(join(distDir, 'index.html'), 'utf8')

/**
 * Everything Vite put in <head> except the tags we are about to replace.
 *
 * The template's own <title> and description are the build-time defaults; each
 * route supplies its own. Leaving both in would emit two <title> elements,
 * and browsers and crawlers disagree about which one wins.
 */
function stripManagedTags(head) {
  return head
    .replace(/\s*<title>[\s\S]*?<\/title>/g, '')
    .replace(/\s*<meta\s+name="description"[^>]*\/?>/g, '')
    .replace(/\s*<link\s+rel="canonical"[^>]*\/?>/g, '')
}

const headMatch = template.match(/<head>([\s\S]*?)<\/head>/)
if (!headMatch) throw new Error('dist/index.html has no <head> — did vite build run?')
const baseHead = stripManagedTags(headMatch[1])

const rootMatch = template.match(/<div id="root">\s*<\/div>/)
if (!rootMatch) throw new Error('dist/index.html has no empty <div id="root"> to fill')

function buildDocument(route) {
  return template
    .replace(/<head>[\s\S]*?<\/head>/, `<head>${baseHead}\n    ${route.head}\n  </head>`)
    .replace(/<div id="root">\s*<\/div>/, `<div id="root">${route.body}</div>`)
}

/** `/` -> dist/index.html, `/about` -> dist/about/index.html. */
function outputPathFor(routePath) {
  if (routePath === '/') return join(distDir, 'index.html')
  // The 404 must sit at dist/404.html, not dist/404/index.html — static hosts
  // look for that exact filename when serving a not-found response.
  if (routePath === '/404') return join(distDir, '404.html')
  return join(distDir, routePath.replace(/^\//, ''), 'index.html')
}

const rendered = renderAllRoutes()
const written = []

for (const route of rendered) {
  const outputPath = outputPathFor(route.path)
  await mkdir(dirname(outputPath), { recursive: true })
  const html = buildDocument(route)
  await writeFile(outputPath, html, 'utf8')
  written.push({
    path: route.path,
    file: outputPath.replace(`${projectRoot}/`, ''),
    bytes: Buffer.byteLength(html, 'utf8'),
  })
}

const today = new Date().toISOString().slice(0, 10)

await writeFile(join(distDir, 'sitemap.xml'), renderSitemap(today), 'utf8')
await writeFile(join(distDir, 'robots.txt'), renderRobots(), 'utf8')
await writeFile(join(distDir, 'llms.txt'), renderLlmsTxt(), 'utf8')
// CREDITS.md is a repo document, not a build artefact, so it is written to the
// project root and committed.
await writeFile(join(projectRoot, 'CREDITS.md'), renderCreditsMarkdown(), 'utf8')

// The SSR bundle is a build intermediate. Leaving it around means the next
// `vite preview` happily serves a stale copy of it.
await rm(join(projectRoot, 'dist-ssr'), { recursive: true, force: true })

const longest = Math.max(...written.map((entry) => entry.path.length))
console.log('\nPrerendered routes:')
for (const entry of written) {
  const html = String(entry.bytes).padStart(7)
  console.log(`  ${entry.path.padEnd(longest)}  ${html} B  ${entry.file}`)
}
console.log('\nGenerated: sitemap.xml, robots.txt, llms.txt, CREDITS.md\n')
