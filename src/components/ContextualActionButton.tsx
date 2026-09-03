import { useCallback, useEffect, useRef, useState } from 'react'

import { contextualActions } from '../content/content'
import type { ContextualActionId } from '../game/locations'

/**
 * Cooldown per action, in milliseconds. Planted flowers vanish after 5 seconds;
 * that cooldown duration prevents rapid re-planting on the same tiles while
 * flowers are still visible, creating a brief bloom-then-fade visual feedback.
 */
const COOLDOWN_MS: Record<ContextualActionId, number> = {
  incomingTrain: 10_000,
  plantMore: 5_000,
  dropFeed: 8_000,
  sendMail: 3_000,
}

interface ContextualActionButtonProps {
  /** The nearby special location's action, or null when none is in range. */
  action: ContextualActionId | null
  /** Adds a touch-specific position class so it clears the D-pad/E button. */
  isTouch: boolean
  /** Dispatches to the matching `GameHandle.trigger*()` stub. */
  onTrigger: (action: ContextualActionId) => void
  /**
   * Replaces the button's label and permanently disables it — used once the
   * greenhouse's session flower cap is reached ("The garden is full!"),
   * which unlike a cooldown never clears on its own.
   */
  disabledMessage?: string
}

/**
 * The single contextual action button shown near a special location —
 * "Incoming Train", "Plant More", "Drop Feed", or "Send Mail".
 *
 * Only one can ever be visible at a time (`action` is the nearest in-range
 * location, resolved in `createGame.ts`), and `GameCanvas` unmounts this
 * component entirely while a dialogue is open, which is what satisfies
 * "hide contextual actions while a content overlay is open" — there is
 * nothing left to disable.
 *
 * Cooldown is tracked as a `Set` of currently-cooling-down action ids in
 * state, keyed by action rather than reset on every prop change, so walking
 * from the train station past the greenhouse and back doesn't forget an
 * in-progress cooldown for the one just left. The pending `setTimeout` that
 * clears an action's cooldown is scheduled independently of what's
 * currently rendered, and lives in a ref purely so unmounting mid-cooldown
 * can clear it — `disabled` itself is a plain, render-pure read of state.
 */
export default function ContextualActionButton({
  action,
  isTouch,
  onTrigger,
  disabledMessage,
}: ContextualActionButtonProps) {
  const [cooling, setCooling] = useState<ReadonlySet<ContextualActionId>>(() => new Set())
  const timeouts = useRef<Partial<Record<ContextualActionId, ReturnType<typeof setTimeout>>>>({})

  // Cancels every pending cooldown timer on unmount, so a dialogue opening
  // (or the whole game view unmounting) mid-cooldown can't fire a stale
  // `setCooling` call after the component is gone.
  useEffect(() => {
    const pending = timeouts.current
    return () => {
      for (const id of Object.values(pending)) clearTimeout(id)
    }
  }, [])

  const handleClick = useCallback(() => {
    if (!action || disabledMessage) return

    setCooling((prev) => new Set(prev).add(action))
    onTrigger(action)

    const existing = timeouts.current[action]
    if (existing !== undefined) clearTimeout(existing)
    timeouts.current[action] = setTimeout(() => {
      delete timeouts.current[action]
      setCooling((prev) => {
        if (!prev.has(action)) return prev
        const next = new Set(prev)
        next.delete(action)
        return next
      })
    }, COOLDOWN_MS[action])
  }, [action, disabledMessage, onTrigger])

  if (!action) return null

  const label = disabledMessage ?? contextualActions[action]
  const disabled = Boolean(disabledMessage) || cooling.has(action)

  return (
    <button
      type="button"
      className={`contextual-action${isTouch ? ' contextual-action--touch' : ''}`}
      aria-label={label}
      disabled={disabled}
      onClick={handleClick}
    >
      {label}
    </button>
  )
}
