import { useCallback, useEffect, useRef } from 'react'

/** One D-pad direction and the unit vector it contributes. */
const DIRECTIONS = [
  { id: 'up', label: 'Move up', x: 0, y: -1, glyph: '▲' },
  { id: 'left', label: 'Move left', x: -1, y: 0, glyph: '◀' },
  { id: 'right', label: 'Move right', x: 1, y: 0, glyph: '▶' },
  { id: 'down', label: 'Move down', x: 0, y: 1, glyph: '▼' },
] as const

interface TouchControlsProps {
  /** Pushes a direction vector into the game. (0, 0) means stop. */
  onMove: (x: number, y: number) => void
  /** Fires the interact action, same path as pressing E. */
  onInteract: () => void
}

/**
 * On-screen D-pad and interact button.
 *
 * Only mounted on touch devices (see `useIsTouchDevice`) — a mouse user gets
 * nothing painted over their view.
 *
 * ── Why pointer events, and why a ref of held keys ──
 * Each pad button tracks its own press via pointerdown/pointerup, and the
 * set of currently-held directions is kept in a ref rather than state. The
 * game reads a direction vector every frame from its own loop, so re-rendering
 * React 60 times a second would be pure waste; the ref lets a press update the
 * vector immediately with no render at all.
 *
 * `setPointerCapture` is what makes a thumb that slides slightly off a button
 * keep moving the player instead of silently sticking — without it, the
 * pointerup lands on a different element and the direction is never released.
 */
export default function TouchControls({ onMove, onInteract }: TouchControlsProps) {
  /** Directions currently held down, keyed by pointer id so multi-touch works. */
  const held = useRef(new Map<number, { x: number; y: number }>())

  const publish = useCallback(() => {
    let x = 0
    let y = 0
    for (const vector of held.current.values()) {
      x += vector.x
      y += vector.y
    }
    // Clamp rather than normalise: the game normalises the summed vector
    // itself, and clamping keeps opposite directions cancelling to zero.
    onMove(Math.sign(x), Math.sign(y))
  }, [onMove])

  const press = useCallback(
    (event: React.PointerEvent<HTMLButtonElement>, vector: { x: number; y: number }) => {
      event.preventDefault()
      event.currentTarget.setPointerCapture(event.pointerId)
      held.current.set(event.pointerId, vector)
      publish()
    },
    [publish],
  )

  const release = useCallback(
    (event: React.PointerEvent<HTMLButtonElement>) => {
      held.current.delete(event.pointerId)
      publish()
    },
    [publish],
  )

  // A pointer lost to a phone call, notification sheet or tab switch would
  // otherwise leave the player walking into a wall forever.
  useEffect(() => {
    const stopAll = () => {
      held.current.clear()
      onMove(0, 0)
    }
    window.addEventListener('blur', stopAll)
    document.addEventListener('visibilitychange', stopAll)
    return () => {
      window.removeEventListener('blur', stopAll)
      document.removeEventListener('visibilitychange', stopAll)
      stopAll()
    }
  }, [onMove])

  return (
    // Hidden from assistive tech: these are a touch-only convenience layer
    // duplicating actions already reachable by keyboard, and the canvas's own
    // label explains how to play. Exposing them would add four unhelpful
    // "Move up" buttons to a screen-reader user's tour.
    <div className="touch-controls" aria-hidden="true">
      <div className="touch-dpad">
        {DIRECTIONS.map((direction) => (
          <button
            key={direction.id}
            type="button"
            tabIndex={-1}
            className={`touch-btn touch-dpad-${direction.id}`}
            aria-label={direction.label}
            onPointerDown={(event) => press(event, { x: direction.x, y: direction.y })}
            onPointerUp={release}
            onPointerCancel={release}
            onContextMenu={(event) => event.preventDefault()}
          >
            <span aria-hidden="true">{direction.glyph}</span>
          </button>
        ))}
      </div>

      <button
        type="button"
        tabIndex={-1}
        className="touch-btn touch-interact"
        aria-label="Interact"
        onPointerDown={(event) => {
          event.preventDefault()
          onInteract()
        }}
        onContextMenu={(event) => event.preventDefault()}
      >
        E
      </button>
    </div>
  )
}
