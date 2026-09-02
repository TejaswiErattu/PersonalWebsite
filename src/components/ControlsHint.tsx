import { useCallback, useEffect, useState } from 'react'

const STORAGE_KEY = 'pixel-portfolio:controls-hint-dismissed'

/**
 * Reads the persisted dismissal.
 *
 * Used as a lazy `useState` initialiser so the value is correct on the very
 * first render. Doing it in an effect instead would paint the hint for one
 * frame and then rip it away from returning visitors.
 */
function wasDismissed(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === '1'
  } catch {
    // Storage blocked (Safari private mode, cookies off) — show the hint.
    return false
  }
}

interface ControlsHintProps {
  /** Changes the wording between "tap the pad" and "press the keys". */
  isTouch: boolean
}

/**
 * The "here's how to move" card shown over the village on first load.
 *
 * Dismissal persists, so a returning visitor is not told the controls again.
 * It is a `role="status"` region rather than a dialog: it does not trap focus
 * or block the game, because being unable to start walking until you have
 * closed a tutorial is worse than the tutorial itself.
 */
export default function ControlsHint({ isTouch }: ControlsHintProps) {
  const [dismissed, setDismissed] = useState(wasDismissed)

  const dismiss = useCallback(() => {
    setDismissed(true)
    try {
      localStorage.setItem(STORAGE_KEY, '1')
    } catch {
      /* Storage unavailable — it will simply show again next visit. */
    }
  }, [])

  // Esc closes it, matching every other overlay in the app.
  useEffect(() => {
    if (dismissed) return

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') dismiss()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [dismissed, dismiss])

  if (dismissed) return null

  return (
    <div className="controls-hint" role="status">
      <h2 className="controls-hint-title">Controls</h2>

      {isTouch ? (
        <ul className="controls-hint-list">
          <li>Use the pad at the bottom-left to walk.</li>
          <li>
            Tap <strong>E</strong> at a door to read about it.
          </li>
          <li>Tap the dialogue to advance it.</li>
        </ul>
      ) : (
        <ul className="controls-hint-list">
          <li>
            Move with <kbd>W</kbd> <kbd>A</kbd> <kbd>S</kbd> <kbd>D</kbd> or the arrow keys.
          </li>
          <li>
            Press <kbd>E</kbd> at a door to read about it.
          </li>
          <li>
            <kbd>Space</kbd> advances, <kbd>Esc</kbd> closes.
          </li>
        </ul>
      )}

      <button type="button" className="controls-hint-dismiss" onClick={dismiss}>
        Got it
      </button>
    </div>
  )
}
