import { useCallback, useEffect, useRef, useState } from 'react'

import { blip } from '../audio/audio'
import { createGame, type GameHandle } from '../game/createGame'
import { experienceDialogue, type ContextualActionId, type Dialogue } from '../game/locations'
import useIsTouchDevice from '../hooks/useIsTouchDevice'
import ContextualActionButton from './ContextualActionButton'
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
  const [contextualAction, setContextualAction] = useState<ContextualActionId | null>(null)
  /**
   * True while the greenhouse's planting bed is full — the game clears the
   * finished garden a few seconds later and flips this back, so it reads as
   * a pause between rounds rather than a permanent stop. Lives here rather
   * than inside `ContextualActionButton` so it survives that component
   * unmounting while a dialogue is open.
   */
  const [gardenFull, setGardenFull] = useState(false)
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
      onContextualActionChange: setContextualAction,
      onGardenFullChange: setGardenFull,
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

  /**
   * Dispatches a contextual button press to the matching `GameHandle` stub,
   * then hands keyboard focus back to the canvas.
   *
   * Clicking an HTML `<button>` focuses that button, same as any other DOM
   * element — but Kaplay's arrow-key/WASD listeners are bound to the canvas,
   * so without this a visitor who just clicked "Send Mail" (or any other
   * contextual action) would find the arrow keys dead until they clicked the
   * canvas itself to refocus it. The button stays visible and enabled again
   * after its cooldown, so this doesn't lose anything a keyboard user needs —
   * it just returns them to the surface the movement keys actually target.
   */
  const handleContextualTrigger = useCallback((action: ContextualActionId) => {
    switch (action) {
      case 'incomingTrain':
        handleRef.current?.triggerIncomingTrain()
        break
      case 'plantMore':
        handleRef.current?.triggerPlantMore()
        break
      case 'dropFeed':
        handleRef.current?.triggerDropFeed()
        break
      case 'sendMail':
        handleRef.current?.triggerSendMail()
        break
    }
    canvasRef.current?.focus()
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

      {/* Unmounting (rather than just visually hiding) while a dialogue is
          open is what "hide contextual actions while a content overlay is
          open" means here — there is no disabled husk left behind to trip
          over, and any pending cooldown timer is torn down by the
          component's own unmount cleanup. */}
      {ready && !dialogue && (
        <ContextualActionButton
          action={contextualAction}
          isTouch={isTouch}
          onTrigger={handleContextualTrigger}
          disabledMessage={
            contextualAction === 'plantMore' && gardenFull ? 'The garden is full!' : undefined
          }
        />
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
