/**
 * Site-wide identity constants.
 *
 * `SITE_ORIGIN` is the single source of truth for the canonical origin. Every
 * absolute URL on the site — canonical tags, Open Graph, JSON-LD, sitemap.xml,
 * robots.txt, llms.txt — is derived from it. If the domain ever changes, this
 * one line changes and everything else follows.
 *
 * This redesign is a separate, unreleased project from the live portfolio at
 * `https://tejaswierattuwebsite.vercel.app/` — this file must never touch
 * that site's configuration, and this project has no deployment of its own
 * yet. So rather than hardcoding a URL that would either overwrite the live
 * site's canonical domain or invent a not-yet-real one for this project,
 * `SITE_ORIGIN` reads `VITE_SITE_ORIGIN` (typed in `vite-env.d.ts`) and falls
 * back to the local dev server's own origin. That keeps every generated
 * absolute URL truthful for wherever this is actually being served right
 * now, and makes wiring in a real deployment URL later a one-line env var —
 * in Vercel's project settings, or a local `.env.local` — with no code
 * change and no risk of silently pointing at a domain this project isn't
 * actually deployed to.
 *
 * No trailing slash: every helper below joins paths onto it, and a trailing
 * slash here would produce `//about`, which is a different URL to a crawler.
 */
const configuredOrigin = (import.meta.env.VITE_SITE_ORIGIN ?? '').trim().replace(/\/+$/, '')
export const SITE_ORIGIN = configuredOrigin || 'http://localhost:5173'

/** Shown as the site name in Open Graph and browser tab suffixes. */
export const SITE_NAME = 'Tejaswi Erattu Taj'

/**
 * The Open Graph / Twitter card image. This is a real screenshot of the game
 * world rather than a generated placeholder, at the 1200x630 that Facebook,
 * LinkedIn and Slack all crop against. Twitter's `summary_large_image` uses
 * the same file at 2:1-ish, which 1200x630 satisfies.
 */
export const OG_IMAGE_PATH = '/og-image.png'
export const OG_IMAGE_WIDTH = 1200
export const OG_IMAGE_HEIGHT = 630
export const OG_IMAGE_ALT =
  'A pixel-art village with a grass path winding between wooden buildings, flower beds and wandering chickens — the explorable version of Tejaswi Erattu Taj’s portfolio.'

/** Turns a site-relative path into the absolute URL used in canonical/OG tags. */
export function absoluteUrl(path: string): string {
  if (path === '/') return `${SITE_ORIGIN}/`
  return `${SITE_ORIGIN}${path.startsWith('/') ? path : `/${path}`}`
}
