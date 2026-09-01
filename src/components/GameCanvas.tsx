import { useCallback, useEffect, useRef, useState } from 'react'

import { createGame, type GameHandle } from '../game/createGame'
import type { Dialogue } from '../game/locations'
import DialogueBox from './DialogueBox'

/**
 * Hosts the Kaplay canvas and the UI layered on top of it.
 *
 * The canvas element is created inside the effect and removed in cleanup, so
 * every boot gets a fresh element and a fresh WebGL context, and unmounting
 * tears the render loop down via `handle.destroy()`.
 *
 * React StrictMode runs this effect twice in development (mount → cleanup →
 * mount), which boots and destroys the game once for nothing. That is
 * tolerated rather than dodged: `destroy()` clears Kaplay's stale context
 * pointer, so the second boot is clean. Deferring the boot to skip the
 * throwaway mount would be a false economy — `requestAnimationFrame` never
 * fires in a background tab, so the game would fail to start at all for anyone
 * who opens the site in a new tab and switches to it later.
 *
 * The canvas lives in its own child div that has no React children, because it
 * is appended imperatively — mixing that with React-rendered siblings inside
 * one node invites reconciliation bugs.
 */
export default function GameCanvas() {
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const handleRef = useRef<GameHandle | null>(null)

  const [prompt, setPrompt] = useState<string | null>(null)
  const [dialogue, setDialogue] = useState<Dialogue | null>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const canvas = document.createElement('canvas')
    canvas.className = 'game-canvas'
    // Kaplay makes the canvas focusable to capture keyboard input, so it must
    // not be aria-hidden. Label it instead and point people at classic view,
    // which carries the identical content in plain HTML.
    canvas.setAttribute('role', 'application')
    canvas.setAttribute(
      'aria-label',
      'Explorable pixel-art village. Move with the W A S D or arrow keys, and ' +
        'press E at a building door to read about it. For a text version of ' +
        'this portfolio, use the Classic view button in the top bar.',
    )
    container.appendChild(canvas)
    canvasRef.current = canvas

    handleRef.current = createGame(canvas, {
      onPromptChange: setPrompt,
      onOpenDialogue: setDialogue,
    })

    return () => {
      handleRef.current?.destroy()
      handleRef.current = null
      canvas.remove()
      canvasRef.current = null
    }
  }, [])

  /** Closes the box, unfreezes the world, and hands keyboard focus back. */
  const closeDialogue = useCallback(() => {
    setDialogue(null)
    handleRef.current?.resume()
    canvasRef.current?.focus()
  }, [])

  return (
    <div className="game-stage">
      <div className="game-viewport" ref={containerRef} />

      {prompt && !dialogue && (
        <p className="game-prompt">
          Press <kbd>E</kbd> to enter the {prompt}
        </p>
      )}

      {dialogue && <DialogueBox dialogue={dialogue} onClose={closeDialogue} />}
    </div>
  )
}
