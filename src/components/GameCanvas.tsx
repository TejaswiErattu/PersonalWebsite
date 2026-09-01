import { useEffect, useRef } from 'react'

import { createGame, type GameHandle } from '../game/createGame'

/**
 * Hosts the Kaplay canvas.
 *
 * React StrictMode runs every effect twice in development (mount → cleanup →
 * mount). Booting a WebGL game twice is wasteful, so the boot is deferred by
 * one animation frame: StrictMode's throwaway mount is cancelled before the
 * frame ever runs, so `kaplay()` is called exactly once.
 *
 * The canvas element itself is created inside the effect and removed in
 * cleanup, so every boot gets a fresh element and a fresh WebGL context, and a
 * real unmount tears down the render loop via `handle.destroy()`.
 */
export default function GameCanvas() {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    let handle: GameHandle | null = null
    let canvas: HTMLCanvasElement | null = null
    let cancelled = false

    const frame = requestAnimationFrame(() => {
      if (cancelled) return

      canvas = document.createElement('canvas')
      canvas.className = 'game-canvas'
      // Kaplay makes the canvas focusable to capture keyboard input, so it must
      // not be aria-hidden. Label it instead and point people at classic view,
      // which carries the identical content in plain HTML.
      canvas.setAttribute('role', 'application')
      canvas.setAttribute(
        'aria-label',
        'Explorable pixel-art village. Move with the W A S D or arrow keys. ' +
          'For a text version of this portfolio, use the Classic view button in the top bar.',
      )
      container.appendChild(canvas)

      handle = createGame(canvas)
    })

    return () => {
      cancelled = true
      cancelAnimationFrame(frame)
      handle?.destroy()
      canvas?.remove()
    }
  }, [])

  return <div className="game-stage" ref={containerRef} />
}
