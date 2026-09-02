import { useLayoutEffect, useRef, useState } from 'react'

import { content, sections } from '../content/content'
import { Link } from '../router'
import { sectionRoutes } from '../seo/routes'
import AudioControl from './AudioControl'

export type ViewMode = 'game' | 'classic'

interface TopBarProps {
  mode: ViewMode
  onToggleMode: () => void
  onOpenCredits: () => void
}

/** Width of the edge fade, in pixels, when the strip can scroll that way. */
const FADE_WIDTH = 24

/**
 * Always-visible navigation.
 *
 * The section links are real hrefs to real prerendered routes rather than
 * in-page anchors, so they work identically whether you are reading the
 * classic page or standing in the village — and so a crawler following them
 * lands on a document that already contains the section's content.
 */
export default function TopBar({ mode, onToggleMode, onOpenCredits }: TopBarProps) {
  const linksRef = useRef<HTMLUListElement>(null)
  /**
   * Whether the link strip can currently scroll further left/right. Drives
   * an edge-fade mask so a narrow viewport — where the strip scrolls under
   * `overflow-x: auto` with its scrollbar hidden — has some visible hint
   * that links continue off-screen, instead of the row looking simply cut
   * off with nothing beyond it.
   */
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)

  useLayoutEffect(() => {
    const el = linksRef.current
    if (!el) return

    const updateFade = () => {
      // A 1px slop absorbs sub-pixel rounding so a fully-scrolled strip
      // doesn't flicker the fade on and off at its resting position.
      setCanScrollLeft(el.scrollLeft > 1)
      setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 1)
    }

    updateFade()
    el.addEventListener('scroll', updateFade, { passive: true })

    // The strip's own width changes with viewport width and with font
    // load — either can flip it between overflowing and not.
    const resizeObserver = new ResizeObserver(updateFade)
    resizeObserver.observe(el)

    return () => {
      el.removeEventListener('scroll', updateFade)
      resizeObserver.disconnect()
    }
  }, [])

  return (
    <header className="topbar">
      <nav className="topbar-inner" aria-label="Main">
        <Link to="/" className="topbar-brand">
          {content.person.name}
        </Link>

        <ul
          className="topbar-links"
          ref={linksRef}
          style={{
            ['--fade-left' as string]: canScrollLeft ? `${FADE_WIDTH}px` : '0px',
            ['--fade-right' as string]: canScrollRight ? `${FADE_WIDTH}px` : '0px',
          }}
        >
          {sectionRoutes.map((route) => {
            const label = sections.find((section) => section.id === route.section)?.label
            return (
              <li key={route.id}>
                <Link className="topbar-link" to={route.path}>
                  {label ?? route.heading}
                </Link>
              </li>
            )
          })}
          {content.person.resumes.map((resume) => (
            <li key={resume.href}>
              <a
                className="topbar-link"
                href={resume.href}
                target="_blank"
                rel="noopener noreferrer"
              >
                {resume.label}
              </a>
            </li>
          ))}
        </ul>

        <div className="topbar-actions">
          <AudioControl />
          <button type="button" className="topbar-link topbar-credits" onClick={onOpenCredits}>
            Credits
          </button>
          <button type="button" className="topbar-toggle" onClick={onToggleMode}>
            {mode === 'game' ? 'Classic view' : 'Back to the village'}
          </button>
        </div>
      </nav>
    </header>
  )
}
