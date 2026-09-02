import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useSyncExternalStore,
  type AnchorHTMLAttributes,
  type ReactNode,
} from 'react'

import { matchRoute, type RouteMeta } from './seo/routes'

/**
 * A ~100 line History API router.
 *
 * react-router would work fine, but it costs roughly 10 kB gzip on every
 * visitor, and classic mode is currently ~78 kB total. Paying an extra 13% of
 * the page weight for nested routes, loaders and data APIs this site will
 * never use is a bad trade. What we actually need is: read the path, render a
 * view, intercept same-origin clicks, and handle back/forward.
 */

/**
 * When the prerenderer renders `/about`, there is no `window.location` to read
 * — and even in a DOM there would only ever be one location, while the build
 * needs to render every route in the same process. This context lets the
 * static renderer pin a route explicitly. In the browser it stays null and the
 * live location wins.
 */
const StaticRouteContext = createContext<RouteMeta | null>(null)

export function StaticRouter({ route, children }: { route: RouteMeta; children: ReactNode }) {
  return <StaticRouteContext.Provider value={route}>{children}</StaticRouteContext.Provider>
}

const LOCATION_EVENT = 'app:navigation'

function subscribe(onChange: () => void): () => void {
  // `popstate` covers back/forward. Our own pushState calls do not fire it, so
  // `navigate` dispatches LOCATION_EVENT to close that gap.
  window.addEventListener('popstate', onChange)
  window.addEventListener(LOCATION_EVENT, onChange)
  return () => {
    window.removeEventListener('popstate', onChange)
    window.removeEventListener(LOCATION_EVENT, onChange)
  }
}

// Returns a primitive, not a route object. useSyncExternalStore compares
// snapshots with Object.is, so returning a freshly built object here would
// re-render forever.
function getPathname(): string {
  return window.location.pathname
}

function getServerPathname(): string {
  return '/'
}

export function useRoute(): RouteMeta {
  const staticRoute = useContext(StaticRouteContext)
  const pathname = useSyncExternalStore(subscribe, getPathname, getServerPathname)
  const liveRoute = useMemo(() => matchRoute(pathname), [pathname])
  return staticRoute ?? liveRoute
}

/**
 * Pushes a new path and notifies subscribers.
 *
 * `replace` is used when a navigation should not add a history entry — for
 * example the redirect that happens when the game is dismissed, where a back
 * button that returned you to the thing you just closed would feel broken.
 */
export function navigate(path: string, options: { replace?: boolean } = {}): void {
  if (window.location.pathname === path) return
  if (options.replace) {
    window.history.replaceState(null, '', path)
  } else {
    window.history.pushState(null, '', path)
  }
  window.dispatchEvent(new Event(LOCATION_EVENT))
}

type LinkProps = AnchorHTMLAttributes<HTMLAnchorElement> & { to: string }

/**
 * An internal link. Renders a real <a href> — which matters far more than the
 * click handler does, because crawlers, "open in new tab", middle-click and
 * "copy link address" all read the href and never run the JavaScript. The
 * handler is only an optimisation to avoid a full page reload.
 */
export function Link({ to, onClick, ...rest }: LinkProps) {
  const handleClick = useCallback(
    (event: React.MouseEvent<HTMLAnchorElement>) => {
      onClick?.(event)
      if (event.defaultPrevented) return
      // Let the browser handle anything that is not a plain left click:
      // cmd/ctrl-click opens a new tab, shift-click a new window, and
      // middle-click is not a click event at all.
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
        return
      }
      event.preventDefault()
      navigate(to)
    },
    [onClick, to],
  )

  return <a href={to} onClick={handleClick} {...rest} />
}
