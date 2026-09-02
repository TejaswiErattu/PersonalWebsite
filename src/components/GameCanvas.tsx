import { useCallback, useEffect, useRef, useState } from 'react'

import { blip } from '../audio/audio'
import { createGame, type GameHandle } from '../game/createGame'
import { experienceDialogue, type Dialogue } from '../game/locations'
import useIsTouchDevice from '../hooks/useIsTouchDevice'
import ControlsHint from './ControlsHint'
import DialogueBox from './DialogueBox'
import LoadingScreen from './LoadingScreen'
import TouchControls from './TouchControls'

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
  const isTouch = useIsTouchDevice()

  const [prompt, setPrompt] = useState<string | null>(null)
  const [dialogue, setDialogue] = useState<Dialogue | null>(null)
  /** Real 0..1 from Kaplay's asset loader; 1 once every sprite is decoded. */
  const [loadProgress, setLoadProgress] = useState(0)
  const [ready, setReady] = useState(false)

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
      onOpenDialogue: (next) => {
        blip('open')
        setDialogue(next)
      },
      onLoadProgress: setLoadProgress,
      onReady: () => setReady(true),
    })

    return () => {
      handleRef.current?.destroy()
      handleRef.current = null
      canvas.remove()
      canvasRef.current = null
    }
  }, [])

  /**
   * Closes the box and unfreezes the world.
   *
   * Focus is deliberately NOT moved here: `DialogueBox`'s focus trap restores
   * it to whatever opened the dialogue (the canvas for a keyboard player, the
   * on-screen E button for a touch player), which is the correct target in
   * both cases and would be clobbered by a blanket `canvas.focus()`.
   */
  const closeDialogue = useCallback(() => {
    blip('close')
    setDialogue(null)
    handleRef.current?.resume()
  }, [])

  /**
   * A station's card can point at another building's content instead of
   * repeating it — this is the mechanism that follows that pointer. The
   * world stays paused; the box below is keyed by `dialogue.id`, so swapping
   * to a new dialogue here starts it back at line one.
   */
  const crossLinkToExperience = useCallback((experienceId: string) => {
    const next = experienceDialogue(experienceId)
    if (next) {
      blip('open')
      setDialogue(next)
    }
  }, [])

  const handleTouchMove = useCallback((x: number, y: number) => {
    handleRef.current?.setTouchMove(x, y)
  }, [])

  const handleTouchInteract = useCallback(() => {
    handleRef.current?.triggerInteract()
  }, [])

  return (
    <div className="game-stage">
      <div className="game-viewport" ref={containerRef} />

      {/* Covers the canvas until the world is built. The canvas is left
          mounted underneath rather than withheld, because Kaplay needs a real
          element in the document to boot against. */}
      {!ready && <LoadingScreen progress={loadProgress} label="Decoding sprites" />}

      {ready && prompt && !dialogue && (
        <p className="game-prompt">
          {isTouch ? (
            <>
              Tap <kbd>E</kbd> to enter the {prompt}
            </>
          ) : (
            <>
              Press <kbd>E</kbd> to enter the {prompt}
            </>
          )}
        </p>
      )}

      {ready && !dialogue && <ControlsHint isTouch={isTouch} />}

      {/* Touch-only, and hidden while a dialogue is up so the pad can't be
          jabbed at a frozen world behind the overlay. */}
      {ready && isTouch && !dialogue && (
        <TouchControls onMove={handleTouchMove} onInteract={handleTouchInteract} />
      )}

      {dialogue && (
        <DialogueBox
          key={dialogue.id}
          dialogue={dialogue}
          onClose={closeDialogue}
          onCrossLink={crossLinkToExperience}
        />
      )}
    </div>
  )
}
