import { useCallback, useEffect, useRef, useState } from 'react'

import { blip } from '../audio/audio'
import useFocusTrap from '../hooks/useFocusTrap'
import type { Dialogue } from '../game/locations'
import { DetailBlockView } from './DetailBlockView'

/** Milliseconds between characters while a line is typing out. */
const TYPE_INTERVAL_MS = 18

/** Keys that advance the dialogue. Esc is handled separately, to close. */
const ADVANCE_KEYS = new Set(['Enter', ' ', 'Spacebar', 'e', 'E'])

type Phase = 'lines' | 'blocks' | 'card'

interface DialogueBoxProps {
  dialogue: Dialogue
  onClose: () => void
  /** Opens another building's dialogue in place of this one, by experience id. */
  onCrossLink: (experienceId: string) => void
}

/**
 * The dialogue box.
 *
 * Rendered as DOM rather than painted into the canvas, which buys real text
 * selection, real focus handling and a screen-reader path for free. The pixel
 * look is CSS.
 *
 * The typed-out text is hidden from assistive tech and the complete line is
 * exposed alongside it, so a screen reader announces whole sentences instead
 * of a stream of partial words.
 *
 * Three phases, in order, each optional except `lines`: the typewriter text,
 * then — for a project with a full write-up — one `DetailBlock` at a time
 * from `dialogue.blocks` (the same array and the same `DetailBlockView` the
 * project's own `/projects/<id>` page renders), then `card` (tech chips,
 * links, a cross-link). The caller should key this component by
 * `dialogue.id`, so a cross-link — which replaces the `dialogue` prop
 * without unmounting — still starts back at line one instead of resuming
 * mid-block or mid-card.
 */
export default function DialogueBox({ dialogue, onClose, onCrossLink }: DialogueBoxProps) {
  const [lineIndex, setLineIndex] = useState(0)
  const [visibleChars, setVisibleChars] = useState(0)
  const [blockIndex, setBlockIndex] = useState(0)
  const [phase, setPhase] = useState<Phase>('lines')
  // Traps Tab inside the box while it is open and hands focus back to
  // whatever opened it on unmount. Also does the initial focus, replacing the
  // manual `boxRef.current?.focus()` this component used to do.
  const boxRef = useFocusTrap<HTMLDivElement>()
  const timerRef = useRef<number | null>(null)

  const line = dialogue.lines[lineIndex] ?? ''
  const isTyping = visibleChars < line.length
  const isLastLine = lineIndex === dialogue.lines.length - 1

  const blocks = dialogue.blocks ?? []
  const isLastBlock = blockIndex === blocks.length - 1

  const stopTyping = useCallback(() => {
    if (timerRef.current === null) return
    window.clearInterval(timerRef.current)
    timerRef.current = null
  }, [])

  // Type the current line out, one character at a time. The interval is held
  // in a ref so skipping can cancel it — otherwise it would keep ticking and
  // overwrite the skipped-to position with a lower count.
  useEffect(() => {
    if (phase !== 'lines' || line.length === 0) return

    let count = 0
    timerRef.current = window.setInterval(() => {
      count += 1
      setVisibleChars(count)
      if (count >= line.length) stopTyping()
    }, TYPE_INTERVAL_MS)

    return stopTyping
  }, [phase, lineIndex, line, stopTyping])

  // Take focus so keys land here and not on the game canvas behind it.
  // (Handled by useFocusTrap, which also restores focus on close.)

  /**
   * One press moves forward exactly one step through `lines` → `blocks` →
   * `card` → close, finishing a still-typing line first rather than skipping
   * it outright. That is what makes the typewriter skippable rather than
   * something you have to sit through, and what makes a long write-up
   * something you can flip through a block at a time instead of dumping the
   * whole thing on one screen.
   */
  const advance = useCallback(() => {
    if (phase === 'card') {
      onClose()
      return
    }

    if (phase === 'blocks') {
      if (!isLastBlock) {
        blip('advance')
        setBlockIndex((index) => index + 1)
        return
      }
      if (dialogue.card) {
        blip('advance')
        setPhase('card')
        return
      }
      onClose()
      return
    }

    // phase === 'lines'
    if (isTyping) {
      stopTyping()
      setVisibleChars(line.length)
      return
    }
    if (!isLastLine) {
      blip('advance')
      setLineIndex((index) => index + 1)
      setVisibleChars(0)
      return
    }
    if (blocks.length > 0) {
      blip('advance')
      setPhase('blocks')
      return
    }
    if (dialogue.card) {
      blip('advance')
      setPhase('card')
      return
    }
    onClose()
  }, [
    phase,
    isLastBlock,
    isTyping,
    isLastLine,
    line.length,
    blocks.length,
    onClose,
    stopTyping,
    dialogue.card,
  ])

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Escape') {
      event.preventDefault()
      onClose()
      return
    }
    if (ADVANCE_KEYS.has(event.key)) {
      // Stop Space from scrolling the page underneath.
      event.preventDefault()
      advance()
    }
  }

  const countLabel = (() => {
    if (phase === 'card') return 'Details'
    if (phase === 'blocks') return `${blockIndex + 1} / ${blocks.length}`
    return `${lineIndex + 1} / ${dialogue.lines.length}`
  })()

  const advanceHint = (() => {
    if (phase === 'card') return 'close'
    if (phase === 'blocks') return isLastBlock ? (dialogue.card ? 'details' : 'close') : 'next'
    // phase === 'lines'
    if (isTyping) return 'skip'
    if (!isLastLine) return 'next'
    if (blocks.length > 0) return 'next'
    return dialogue.card ? 'details' : 'close'
  })()

  return (
    <div className="dialogue-backdrop">
      <div
        ref={boxRef}
        className="dialogue"
        role="dialog"
        aria-modal="true"
        aria-label={dialogue.title}
        tabIndex={-1}
        onKeyDown={handleKeyDown}
        onClick={advance}
      >
        <div className="dialogue-head">
          <h2 className="dialogue-title">{dialogue.title}</h2>
          <span className="dialogue-count">{countLabel}</span>
        </div>

        {phase === 'lines' && (
          <>
            <p className="dialogue-text" aria-hidden="true">
              {line.slice(0, visibleChars)}
              {isTyping && <span className="dialogue-caret" />}
            </p>
            <p className="sr-only">{line}</p>
          </>
        )}

        {phase === 'blocks' && (
          // Scrolling, playing a video, or selecting code inside a block
          // shouldn't also advance/close the dialogue the way a click on
          // empty space in it does.
          <div className="dialogue-blocks" onClick={(event) => event.stopPropagation()}>
            <DetailBlockView block={blocks[blockIndex]} level={3} />
          </div>
        )}

        {phase === 'card' && (
          <div className="dialogue-card">
            {!!dialogue.card?.tech?.length && (
              <ul className="dialogue-card-tech">
                {dialogue.card.tech.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            )}
            {!!dialogue.card?.links?.length && (
              <div className="dialogue-card-links">
                {dialogue.card.links.map((link) => (
                  <a
                    key={link.href}
                    className="dialogue-card-link"
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(event) => event.stopPropagation()}
                  >
                    {link.label}
                  </a>
                ))}
              </div>
            )}
            {dialogue.card?.crossLink && (
              <button
                type="button"
                className="dialogue-card-crosslink"
                onClick={(event) => {
                  event.stopPropagation()
                  onCrossLink(dialogue.card!.crossLink!.experienceId)
                }}
              >
                {dialogue.card.crossLink.label} →
              </button>
            )}
          </div>
        )}

        <div className="dialogue-foot">
          <span className="dialogue-hint">
            <kbd>Space</kbd> {advanceHint} · <kbd>Esc</kbd> close
          </span>
          <button
            type="button"
            className="dialogue-close"
            onClick={(event) => {
              event.stopPropagation()
              onClose()
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
