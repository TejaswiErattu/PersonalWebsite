import { useEffect, useRef } from 'react'

import useFocusTrap from '../hooks/useFocusTrap'
import type { Dialogue } from '../game/locations'
import { DetailBlockView } from './DetailBlockView'
import PixelIcon from './PixelIcon'
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
 * Everything the dialogue carries — its subtitle, its grouped highlight
 * lines, a signpost's legend, a contact panel, its full `DetailBlock`
 * write-up (the same array and the same `DetailBlockView` the project's own
 * `/projects/<id>` page renders), a closing note, and its closing card of
 * tech chips, links, and cross-link — is rendered on one scrollable page.
 * There is no paging, no typewriter, and no "press again to continue": the
 * visitor scrolls, the way they would read any other long page.
 *
 * `dialogue.accent`/`dialogue.icon` (set per-location by `withTheme()` in
 * `locations.ts`) drive a *subtle* per-location colour theme: they set the
 * `--accent` custom property on the panel itself, which every themed rule in
 * `App.css` already reads from — so About, Current Roles, Engineering, AI &
 * Teaching, Mobile Innovation, Developer Tools, Greenhouse, Farm, and
 * Contact each get their own tint without needing a parallel set of CSS
 * rules per location. The global `--accent` (outside any dialogue) is
 * untouched.
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
  // A short entry (a one-line achievement, a two-sentence farm plot) should
  // read as a compact card within the large overlay frame rather than
  // stretching to fill it — `.dialogue-compact` caps the panel's height
  // instead of letting it grow to the usual `max-height`. Anything with a
  // real long-form write-up, a legend, or several highlight lines still
  // gets the full-size panel.
  const isCompact =
    blocks.length === 0 &&
    !dialogue.legend &&
    !dialogue.contact &&
    !dialogue.suggestionForm &&
    dialogue.lines.length <= 1

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
        className={isCompact ? 'dialogue dialogue-compact' : 'dialogue'}
        role="dialog"
        aria-modal="true"
        aria-label={dialogue.title}
        tabIndex={-1}
        onKeyDown={handleKeyDown}
        style={dialogue.accent ? ({ '--accent': dialogue.accent } as React.CSSProperties) : undefined}
      >
        <div className="dialogue-head">
          <div className="dialogue-head-text">
            {dialogue.icon && (
              <span className="dialogue-head-icon" aria-hidden="true">
                <PixelIcon id={dialogue.icon} size={18} />
              </span>
            )}
            <div className="dialogue-head-titles">
              <h2 className="dialogue-title">{dialogue.title}</h2>
              {dialogue.subtitle && <p className="dialogue-subtitle">{dialogue.subtitle}</p>}
            </div>
          </div>
          <button type="button" className="dialogue-close" onClick={onClose}>
            Close
          </button>
        </div>

        <div className="dialogue-content" ref={contentRef}>
          {dialogue.lines.length > 0 && (
            <div className="dialogue-lines">
              {dialogue.linesLabel && <p className="dialogue-eyebrow">{dialogue.linesLabel}</p>}
              {dialogue.lines.map((line) => (
                <p key={line}>{line}</p>
              ))}
            </div>
          )}

          {dialogue.note && (
            <div className="dialogue-note">
              <p className="dialogue-eyebrow">{dialogue.note.label}</p>
              <p>{dialogue.note.text}</p>
            </div>
          )}

          {dialogue.legend && (
            <ul className="dialogue-legend">
              {dialogue.legend.map((entry) => (
                <li key={entry.id} className="dialogue-legend-entry">
                  <span
                    className="dialogue-legend-marker"
                    aria-hidden="true"
                    style={{ color: entry.accent, borderColor: entry.accent }}
                  >
                    <PixelIcon id={entry.icon} size={16} />
                  </span>
                  <div className="dialogue-legend-text">
                    <p className="dialogue-legend-label">{entry.label}</p>
                    <p className="dialogue-legend-description">{entry.description}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}

          {dialogue.contact && (
            <div className="dialogue-contact-grid">
              {dialogue.contact.map((panel) => (
                <div className="dialogue-contact-panel" key={panel.href}>
                  <span className="dialogue-contact-icon" aria-hidden="true">
                    <PixelIcon id={panel.icon} size={22} />
                  </span>
                  <div className="dialogue-contact-text">
                    <p className="dialogue-contact-label">{panel.label}</p>
                    <p className="dialogue-contact-description">{panel.description}</p>
                  </div>
                  <a
                    className="dialogue-contact-action"
                    href={panel.href}
                    target={panel.href.startsWith('mailto:') ? undefined : '_blank'}
                    rel={panel.href.startsWith('mailto:') ? undefined : 'noopener noreferrer'}
                  >
                    {panel.actionLabel}
                  </a>
                </div>
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
