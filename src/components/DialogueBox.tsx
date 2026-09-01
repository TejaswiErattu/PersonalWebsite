import { useCallback, useEffect, useRef, useState } from 'react'

import type { Dialogue } from '../game/locations'

/** Milliseconds between characters while a line is typing out. */
const TYPE_INTERVAL_MS = 18

/** Keys that advance the dialogue. Esc is handled separately, to close. */
const ADVANCE_KEYS = new Set(['Enter', ' ', 'Spacebar', 'e', 'E'])

interface DialogueBoxProps {
  dialogue: Dialogue
  onClose: () => void
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
 */
export default function DialogueBox({ dialogue, onClose }: DialogueBoxProps) {
  const [lineIndex, setLineIndex] = useState(0)
  const [visibleChars, setVisibleChars] = useState(0)
  const boxRef = useRef<HTMLDivElement>(null)
  const timerRef = useRef<number | null>(null)

  const line = dialogue.lines[lineIndex] ?? ''
  const isTyping = visibleChars < line.length
  const isLastLine = lineIndex === dialogue.lines.length - 1

  const stopTyping = useCallback(() => {
    if (timerRef.current === null) return
    window.clearInterval(timerRef.current)
    timerRef.current = null
  }, [])

  // Type the current line out, one character at a time. The interval is held
  // in a ref so skipping can cancel it — otherwise it would keep ticking and
  // overwrite the skipped-to position with a lower count.
  useEffect(() => {
    if (line.length === 0) return

    let count = 0
    timerRef.current = window.setInterval(() => {
      count += 1
      setVisibleChars(count)
      if (count >= line.length) stopTyping()
    }, TYPE_INTERVAL_MS)

    return stopTyping
  }, [lineIndex, line, stopTyping])

  // Take focus so keys land here and not on the game canvas behind it.
  useEffect(() => {
    boxRef.current?.focus()
  }, [])

  /**
   * One press does one of three things, in order: finish the line that is
   * still typing, move to the next line, or close. That is what makes the
   * typewriter skippable rather than something you have to sit through.
   *
   * The character count is reset here, in the event that causes the line to
   * change, rather than in an effect reacting to it afterwards.
   */
  const advance = useCallback(() => {
    if (isTyping) {
      stopTyping()
      setVisibleChars(line.length)
      return
    }
    if (!isLastLine) {
      setLineIndex((index) => index + 1)
      setVisibleChars(0)
      return
    }
    onClose()
  }, [isTyping, isLastLine, line.length, onClose, stopTyping])

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
          <span className="dialogue-count">
            {lineIndex + 1} / {dialogue.lines.length}
          </span>
        </div>

        <p className="dialogue-text" aria-hidden="true">
          {line.slice(0, visibleChars)}
          {isTyping && <span className="dialogue-caret" />}
        </p>
        <p className="sr-only">{line}</p>

        <div className="dialogue-foot">
          <span className="dialogue-hint">
            <kbd>Space</kbd> {isTyping ? 'skip' : isLastLine ? 'close' : 'next'} ·{' '}
            <kbd>Esc</kbd> close
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
