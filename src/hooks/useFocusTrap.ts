import { useEffect, useRef } from 'react'

/** Everything that can hold focus, minus anything explicitly removed from the tab order. */
const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), ' +
  'textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

/**
 * Traps Tab inside a container while it is open, and returns focus to
 * whatever opened it on unmount.
 *
 * This is the pair of behaviours that make a modal usable without a mouse:
 * you cannot Tab out into the page behind the overlay, and when the overlay
 * closes you are put back exactly where you were rather than at the top of
 * the document.
 *
 * The element that had focus is captured on mount, before focus is moved,
 * and is re-focused on cleanup — guarded by `isConnected`, because the
 * trigger may well have been unmounted while the overlay was open.
 *
 * Returns a ref to attach to the container.
 */
export default function useFocusTrap<T extends HTMLElement>() {
  const containerRef = useRef<T>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const previouslyFocused = document.activeElement as HTMLElement | null

    // Prefer the first real control; fall back to the container itself, which
    // callers give tabIndex={-1} so it can hold focus.
    const first = container.querySelector<HTMLElement>(FOCUSABLE)
    ;(first ?? container).focus()

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return

      const focusable = Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        // offsetParent is null for anything display:none'd, which would
        // otherwise become an invisible stop in the tab order.
        (element) => element.offsetParent !== null || element === document.activeElement,
      )

      if (focusable.length === 0) {
        // Nothing to move between — keep focus pinned to the container.
        event.preventDefault()
        container.focus()
        return
      }

      const firstEl = focusable[0]
      const lastEl = focusable[focusable.length - 1]
      const active = document.activeElement

      // Wrap around at both ends. The container itself is not in `focusable`,
      // so when it holds focus we send Tab to whichever end makes sense.
      if (event.shiftKey && (active === firstEl || active === container)) {
        event.preventDefault()
        lastEl.focus()
      } else if (!event.shiftKey && (active === lastEl || active === container)) {
        event.preventDefault()
        firstEl.focus()
      }
    }

    container.addEventListener('keydown', onKeyDown)

    return () => {
      container.removeEventListener('keydown', onKeyDown)
      if (previouslyFocused?.isConnected) previouslyFocused.focus()
    }
  }, [])

  return containerRef
}
