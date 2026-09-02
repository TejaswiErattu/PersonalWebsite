/**
 * Site-wide identity constants.
 *
 * `SITE_ORIGIN` is the single source of truth for the canonical origin. Every
 * absolute URL on the site — canonical tags, Open Graph, JSON-LD, sitemap.xml,
 * robots.txt, llms.txt — is derived from it. If the domain ever changes, this
 * one line changes and everything else follows.
 *
 * No trailing slash: every helper below joins paths onto it, and a trailing
 * slash here would produce `//about`, which is a different URL to a crawler.
 */
export const SITE_ORIGIN = 'https://tejaswierattutaj.vercel.app'

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
