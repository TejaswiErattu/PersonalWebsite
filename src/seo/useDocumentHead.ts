import { useEffect } from 'react'

import { absoluteUrl } from './site'
import type { RouteMeta } from './routes'

/**
 * Keeps <head> in sync with the current route on client-side navigation.
 *
 * Every route is also prerendered with these exact tags baked in, so a crawler
 * or a curl never depends on this hook running. It exists for the second and
 * subsequent navigations in a session, where no new document is fetched and
 * the tags would otherwise be left describing the page the visitor arrived on
 * — which is what social scrapers and browser history entries would pick up.
 */
function setMeta(selector: string, create: () => HTMLElement, value: string): void {
  let element = document.head.querySelector<HTMLElement>(selector)
  if (!element) {
    element = create()
    document.head.appendChild(element)
  }
  if (element instanceof HTMLMetaElement) {
    element.content = value
  } else if (element instanceof HTMLLinkElement) {
    element.href = value
  }
}

function namedMeta(name: string, value: string): void {
  setMeta(`meta[name="${name}"]`, () => {
    const meta = document.createElement('meta')
    meta.name = name
    return meta
  }, value)
}

function propertyMeta(property: string, value: string): void {
  setMeta(`meta[property="${property}"]`, () => {
    const meta = document.createElement('meta')
    meta.setAttribute('property', property)
    return meta
  }, value)
}

export function useDocumentHead(route: RouteMeta): void {
  useEffect(() => {
    const canonical = absoluteUrl(route.path)

    document.title = route.title
    namedMeta('description', route.description)
    propertyMeta('og:title', route.title)
    propertyMeta('og:description', route.description)
    propertyMeta('og:url', canonical)
    namedMeta('twitter:title', route.title)
    namedMeta('twitter:description', route.description)

    setMeta(
      'link[rel="canonical"]',
      () => {
        const link = document.createElement('link')
        link.rel = 'canonical'
        return link
      },
      canonical,
    )

    // The 404 view is reachable at any unmatched path, so it must actively
    // ask not to be indexed. Every other route removes the tag again, because
    // a stale noindex left behind by a previous navigation would quietly
    // deindex real pages.
    const existingRobots = document.head.querySelector('meta[name="robots"]')
    if (route.noIndex) {
      namedMeta('robots', 'noindex, follow')
    } else if (existingRobots) {
      existingRobots.remove()
    }
  }, [route])
}
