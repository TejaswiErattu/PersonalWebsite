import { useEffect, useRef } from 'react'

import useFocusTrap from '../hooks/useFocusTrap'
import type { Dialogue } from '../game/locations'
import { DetailBlockView } from './DetailBlockView'
import { SuggestionForm } from './SuggestionForm'

interface DialogueBoxProps {
  dialogue: Dialogue
  onClose: () => void
  /** Opens another building's dialogue in place of this one, by experience id. */
  onCrossLink: (experienceId: string) => void
}

/**
 * The overlay shown for a window, station, plot, or signpost.
 *
 * Everything the dialogue carries — its lines, its full `DetailBlock`
 * write-up (the same array and the same `DetailBlockView` the project's own
 * `/projects/<id>` page renders), and its closing card of tech chips, links,
 * and cross-link — is rendered on one scrollable page. There is no paging,
 * no typewriter, and no "press again to continue": the visitor scrolls, the
 * way they would read any other long page.
 *
 * Rendered as DOM rather than painted into the canvas, which buys real text
 * selection, real focus handling and a screen-reader path for free. The
 * pixel look is CSS.
 *
 * The caller should key this component by `dialogue.id`, so a cross-link —
 * which replaces the `dialogue` prop without unmounting — still remounts a
 * fresh overlay (scrolled to the top, focus trapped again) instead of
 * silently swapping content under a reader's feet.
 */
export default function DialogueBox({ dialogue, onClose, onCrossLink }: DialogueBoxProps) {
  // Traps Tab inside the box while it is open and hands focus back to
  // whatever opened it on unmount. Also does the initial focus.
  const boxRef = useFocusTrap<HTMLDivElement>()
  // Scoped to the scrollable content so the video cleanup below only ever
  // touches videos this overlay itself rendered.
  const contentRef = useRef<HTMLDivElement>(null)

  // Locks body scroll for as long as any overlay is open. A ref-counted
  // depth would be needed if overlays could ever nest, but only one is ever
  // mounted at a time (`GameCanvas` renders at most one `DialogueBox`), so a
  // plain save-and-restore is enough.
  useEffect(() => {
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [])

  // Videos autoplay muted when the overlay opens (via the `videoAutoplay`
  // prop below) and must pause and rewind when it closes — including when a
  // cross-link swaps this dialogue out for another one, since the component
  // unmounts either way. `DetailBlockView` is shared with `ProjectPage`,
  // which does not want this behaviour, so the cleanup lives here rather
  // than inside that component.
  useEffect(() => {
    const container = contentRef.current
    return () => {
      container?.querySelectorAll('video').forEach((video) => {
        video.pause()
        video.currentTime = 0
      })
    }
  }, [])

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Escape') {
      event.preventDefault()
      onClose()
    }
  }

  const blocks = dialogue.blocks ?? []

  return (
    <div
      className="dialogue-backdrop"
      // "Intentional" backdrop click only: closes when the click both starts
      // and ends on the backdrop itself, never when it bubbles up from the
      // panel or its content (selecting text, releasing a drag, etc.).
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <div
        ref={boxRef}
        className="dialogue"
        role="dialog"
        aria-modal="true"
        aria-label={dialogue.title}
        tabIndex={-1}
        onKeyDown={handleKeyDown}
      >
        <div className="dialogue-head">
          <h2 className="dialogue-title">{dialogue.title}</h2>
          <button type="button" className="dialogue-close" onClick={onClose}>
            Close
          </button>
        </div>

        <div className="dialogue-content" ref={contentRef}>
          {dialogue.lines.length > 0 && (
            <div className="dialogue-lines">
              {dialogue.lines.map((line) => (
                <p key={line}>{line}</p>
              ))}
            </div>
          )}

          {dialogue.suggestionForm && <SuggestionForm />}

          {blocks.map((block, index) => (
            // Block order is fixed content from content.ts, never reordered
            // or filtered at runtime, so an index key is stable here — same
            // convention as `ProjectPage`, which renders this same array.
            <DetailBlockView key={index} block={block} level={3} videoAutoplay />
          ))}

          {dialogue.card && (
            <div className="dialogue-card">
              {!!dialogue.card.tech?.length && (
                <ul className="dialogue-card-tech">
                  {dialogue.card.tech.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              )}
              {!!dialogue.card.links?.length && (
                <div className="dialogue-card-links">
                  {dialogue.card.links.map((link) => (
                    <a
                      key={link.href}
                      className="dialogue-card-link"
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {link.label}
                    </a>
                  ))}
                </div>
              )}
              {dialogue.card.crossLink && (
                <button
                  type="button"
                  className="dialogue-card-crosslink"
                  onClick={() => onCrossLink(dialogue.card!.crossLink!.experienceId)}
                >
                  {dialogue.card.crossLink.label} →
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
