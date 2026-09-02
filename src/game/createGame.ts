import kaplay, { type KAPLAYCtx, type GameObj } from 'kaplay'

import { canStandAt } from './collision'
import { InteractionRegistry } from './interactions'
import { BUILDING_SYMBOLS, LOCATIONS, SIGNPOSTS, assertStationSpacing, type Dialogue } from './locations'
import { buildScenery, loadScenerySprites } from './scenery'
import {
  GRASS_COLOR,
  MAP,
  TILES,
  TILE_SIZE,
  WORLD_HEIGHT,
  WORLD_WIDTH,
  assertMapIsRectangular,
  findSpawnPoint,
  findTileRect,
} from './village'
import {
  DIRECTIONS,
  FRAMES_PER_DIRECTION,
  FRAME_SIZE,
  createPlayerSpriteSheet,
  idleFrame,
  walkAnim,
  type Direction,
} from './sprites'
import { createBuildingSprite, createCueSprite, createSecurityCenterSprite } from './worldSprites'

/** Player walking speed, in world pixels per second. */
const PLAYER_SPEED = 78

/**
 * How much the world is magnified.
 *
 * On a desktop window 2x reads as pixel art while still showing roughly two
 * thirds of the village. On a 375px-wide phone that same 2x would show only
 * ~11 tiles across, which is too claustrophobic to navigate — so zoom is
 * resolved from the canvas width every frame instead of being fixed. Picking
 * it per frame (rather than once at boot) means rotating the device or
 * resizing the window is handled for free.
 */
const CAMERA_ZOOM_DESKTOP = 2
const CAMERA_ZOOM_COMPACT = 1.5
/** Below this canvas width, drop to the compact zoom. */
const COMPACT_WIDTH = 560

function zoomForWidth(width: number): number {
  return width < COMPACT_WIDTH ? CAMERA_ZOOM_COMPACT : CAMERA_ZOOM_DESKTOP
}

/** Higher = camera snaps to the player faster. Frame-rate independent. */
const CAMERA_FOLLOW = 12

/**
 * Camera follow used when the visitor has asked for reduced motion. A much
 * higher constant means the camera effectively sticks to the player instead
 * of gliding after them, which removes the drifting parallax that triggers
 * motion sensitivity — without pinning the view somewhere unhelpful.
 */
const CAMERA_FOLLOW_REDUCED = 60

/** True when the OS/browser asks for reduced motion. Re-read per boot. */
function prefersReducedMotion(): boolean {
  return (
    typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches
  )
}

/** Draw order: tiles at 0, buildings above them, player above those. */
const BUILDING_Z = 1
const PLAYER_Z = 10
/** The cue floats above everything so a building can never cover it. */
const CUE_Z = 20

/**
 * How close the player's centre must get to a door before it responds, in
 * world pixels. A shade under two tiles: close enough to feel deliberate,
 * far enough that you don't have to hunt for the exact pixel.
 */
const INTERACT_RADIUS = 26

/**
 * Same idea as `INTERACT_RADIUS`, but tighter: multi-station buildings pack
 * several triggers along one wall, and a smaller radius keeps the player
 * standing in front of the one they mean instead of anything within a tile
 * or two of the whole row. `nearest()` would resolve overlap correctly
 * either way — this is about feel, not correctness.
 */
const STATION_INTERACT_RADIUS = 20

/**
 * Signposts are a single tile with one line of text — smaller than either
 * building radius, since there is no "door" to stand in front of, just a
 * post to walk up to.
 */
const SIGNPOST_INTERACT_RADIUS = 16

/** Gap between the door and the floating cue above it. */
const CUE_LIFT = 30

/** Bob applied to the cue so it reads as active rather than painted on. */
const CUE_BOB_SPEED = 6
const CUE_BOB_HEIGHT = 2

/** Keys that trigger the nearest interactable. */
const INTERACT_KEYS = ['e', 'space', 'enter']

/**
 * Longest distance resolved in one collision test. Keeping it well under a
 * tile means the player can never step over a wall, even after the browser
 * pauses the tab and hands us a huge delta time.
 */
const MAX_SUBSTEP = TILE_SIZE / 4

/** Upper bound on a single frame's delta, so one long stall can't teleport. */
const MAX_FRAME_DELTA = 0.1

/** Which physical keys drive which direction. */
const KEY_BINDINGS: Record<Direction, string[]> = {
  up: ['up', 'w'],
  down: ['down', 's'],
  left: ['left', 'a'],
  right: ['right', 'd'],
}

/** What `createGame` hands back to React so the effect can clean itself up. */
export interface GameHandle {
  destroy: () => void
  /** Hands control back to the player after a dialogue closes. */
  resume: () => void
  /**
   * Sets a movement direction from outside the keyboard — the on-screen
   * D-pad. Components pass a direction vector (it gets normalised here), and
   * (0, 0) to stop. It is summed with keyboard input rather than replacing
   * it, so a device with both a touchscreen and a keyboard works either way.
   */
  setTouchMove: (x: number, y: number) => void
  /** Fires the interact action, as if the player had pressed E. */
  triggerInteract: () => void
}

/**
 * How the game talks to React. The game owns the world; React owns the UI on
 * top of it. These two callbacks are the entire surface between them.
 */
export interface GameCallbacks {
  /** Label of the interactable in range, or null when there is none. */
  onPromptChange: (label: string | null) => void
  /** Player pressed the interact key on something with dialogue. */
  onOpenDialogue: (dialogue: Dialogue) => void
  /**
   * Real asset-loading progress, 0..1, forwarded straight from Kaplay's own
   * loader. Fires every frame while assets are outstanding. This is a count
   * of assets actually resolved — not a timer — so it is allowed to jump
   * straight to 1 when there is little to do.
   */
  onLoadProgress: (progress: number) => void
  /** Assets are decoded and the first frame is about to render. */
  onReady: () => void
}

function clamp(value: number, min: number, max: number): number {
  if (max < min) return (min + max) / 2
  return Math.min(Math.max(value, min), max)
}

/** Sprite name for a building, derived from its map symbol. */
function buildingSpriteName(symbol: string): string {
  return `building-${symbol}`
}

/**
 * Builds the map's visuals. Tiles carry no colliders — walls are enforced by
 * `canStandAt`, which reads the same ASCII map these rectangles are drawn from.
 */
function buildLevel(k: KAPLAYCtx): void {
  k.addLevel(MAP, {
    tileWidth: TILE_SIZE,
    tileHeight: TILE_SIZE,
    tiles: Object.fromEntries(
      Object.entries(TILES)
        // Buildings are drawn as one sprite each, not as a block of tiles.
        .filter(([symbol]) => !BUILDING_SYMBOLS.has(symbol))
        .map(([symbol, spec]) => [
          symbol,
          () => [k.rect(TILE_SIZE, TILE_SIZE), k.color(k.rgb(spec.color)), k.z(0)],
        ]),
    ),
    // Grass ('.') and anything undefined draws nothing — the background colour
    // already is grass, so skipping the object keeps the scene light.
    wildcardTile: () => null,
  })
}

/**
 * Places one sprite per building and registers a door trigger for any that
 * has dialogue wired up in `locations.ts`.
 *
 * Collision is not touched here: the ASCII map already marks these tiles
 * solid, and `canStandAt` reads the map directly.
 */
function buildBuildings(
  k: KAPLAYCtx,
  registry: InteractionRegistry,
  openDialogue: (dialogue: Dialogue) => void,
): void {
  for (const location of LOCATIONS) {
    const rect = findTileRect(location.symbol)
    if (!rect) continue

    const left = rect.col * TILE_SIZE
    const top = rect.row * TILE_SIZE
    const width = rect.cols * TILE_SIZE
    const height = rect.rows * TILE_SIZE

    k.add([
      k.sprite(buildingSpriteName(location.symbol)),
      k.pos(left, top),
      k.z(BUILDING_Z),
      'building',
    ])

    // Single-door buildings: the door is drawn centred on the bottom edge,
    // so the trigger anchors to that same point — the spot the player walks
    // up to.
    const { dialogue } = location
    if (dialogue) {
      registry.register({
        id: location.symbol,
        label: location.name,
        x: left + width / 2,
        y: top + height,
        radius: INTERACT_RADIUS,
        onInteract: () => openDialogue(dialogue()),
      })
    }

    // Multi-station buildings: one trigger per station, evenly spaced along
    // the bottom edge. Overlapping radii are fine — `registry.nearest()`
    // still guarantees only the closest one ever fires.
    if (location.stations) {
      const count = location.stations.length
      location.stations.forEach((station, index) => {
        registry.register({
          id: `${location.symbol}:${station.id}`,
          label: station.label,
          x: left + ((index + 1) * width) / (count + 1),
          y: top + height,
          radius: STATION_INTERACT_RADIUS,
          onInteract: () => openDialogue(station.dialogue()),
        })
      })
    }
  }
}

/**
 * Registers one interactable per signpost. Signposts have no sprite of
 * their own — `buildLevel()` already draws them as a plain colored tile,
 * same as water or a tree — so this only needs to add the trigger.
 */
function buildSignposts(
  registry: InteractionRegistry,
  openDialogue: (dialogue: Dialogue) => void,
): void {
  for (const signpost of SIGNPOSTS) {
    const rect = findTileRect(signpost.symbol)
    if (!rect) continue

    registry.register({
      id: `signpost:${signpost.symbol}`,
      label: 'Signpost',
      x: rect.col * TILE_SIZE + TILE_SIZE / 2,
      y: rect.row * TILE_SIZE + TILE_SIZE / 2,
      radius: SIGNPOST_INTERACT_RADIUS,
      onInteract: () =>
        openDialogue({
          id: `signpost-${signpost.symbol}`,
          title: 'Signpost',
          lines: [signpost.text],
        }),
    })
  }
}

/**
 * Moves the player by `distance` along a unit direction, in small steps, with
 * the two axes resolved independently so walking into a wall at an angle
 * slides along it instead of stopping dead.
 */
function stepPlayer(player: GameObj, dirX: number, dirY: number, distance: number): void {
  let remaining = distance

  while (remaining > 0) {
    const step = Math.min(remaining, MAX_SUBSTEP)
    remaining -= step

    const nextX = player.pos.x + dirX * step
    if (dirX !== 0 && canStandAt(nextX, player.pos.y)) {
      player.pos.x = nextX
    }

    const nextY = player.pos.y + dirY * step
    if (dirY !== 0 && canStandAt(player.pos.x, nextY)) {
      player.pos.y = nextY
    }
  }
}

function buildPlayer(k: KAPLAYCtx): GameObj {
  const spawn = findSpawnPoint()

  return k.add([
    k.sprite('player', { frame: idleFrame('down') }),
    k.pos(spawn.x, spawn.y),
    k.anchor('center'),
    k.z(PLAYER_Z),
    'player',
  ])
}

/**
 * Boots the whole game onto an existing canvas.
 *
 * The caller owns the canvas element and must call `destroy()` when unmounting.
 */
export function createGame(canvas: HTMLCanvasElement, callbacks: GameCallbacks): GameHandle {
  assertMapIsRectangular()
  assertStationSpacing()

  const k = kaplay({
    canvas,
    // Keep every Kaplay function on `k` instead of leaking them onto `window`.
    global: false,
    background: GRASS_COLOR,
    crisp: true,
    pixelDensity: 1,
    debug: false,
    touchToMouse: false,
  })

  const registry = new InteractionRegistry()

  /** Resolved once per boot; the media query does not change mid-session in
   *  any way worth tearing the game down for. */
  const reducedMotion = prefersReducedMotion()
  const cameraFollow = reducedMotion ? CAMERA_FOLLOW_REDUCED : CAMERA_FOLLOW

  /** Live direction from the on-screen D-pad. Written by `setTouchMove`. */
  const touchMove = { x: 0, y: 0 }

  /**
   * Assigned once assets finish loading. Until then the interact button has
   * nothing to call, which is correct — there is no world to interact with.
   */
  let interactFn: (() => void) | null = null

  /**
   * While a dialogue is open the world freezes: no walking, no cue, no second
   * trigger. React flips this back with `resume()` when the box closes.
   */
  let paused = false

  const openDialogue = (dialogue: Dialogue): void => {
    paused = true
    callbacks.onOpenDialogue(dialogue)
  }

  // Only tell React when the prompt actually changes, otherwise this would
  // trigger a React render on every single frame.
  let promptLabel: string | null = null
  const setPrompt = (label: string | null): void => {
    if (label === promptLabel) return
    promptLabel = label
    callbacks.onPromptChange(label)
  }

  k.loadSprite('player', createPlayerSpriteSheet(), {
    sliceX: FRAMES_PER_DIRECTION,
    sliceY: DIRECTIONS.length,
    anims: Object.fromEntries(
      DIRECTIONS.map((dir, row) => [
        walkAnim(dir),
        {
          from: row * FRAMES_PER_DIRECTION,
          to: row * FRAMES_PER_DIRECTION + FRAMES_PER_DIRECTION - 1,
          loop: true,
          speed: 8,
        },
      ]),
    ),
  })

  k.loadSprite('cue', createCueSprite())

  loadScenerySprites(k)

  // Kaplay fires this every frame while any asset is still outstanding, with
  // the real resolved/total ratio. Forwarding it verbatim is what makes the
  // loading bar honest — nothing here is interpolated or timed.
  k.onLoading((progress) => callbacks.onLoadProgress(progress))

  // Every building gets its own sprite, drawn to its exact footprint. Loaded
  // here rather than inside `onLoad` so they are decoded before anything is
  // added to the scene.
  for (const location of LOCATIONS) {
    const rect = findTileRect(location.symbol)
    if (!rect) continue
    const width = rect.cols * TILE_SIZE
    const height = rect.rows * TILE_SIZE
    const sprite =
      location.variant === 'security'
        ? createSecurityCenterSprite(width, height, location.palette)
        : createBuildingSprite(width, height, location.palette)
    k.loadSprite(buildingSpriteName(location.symbol), sprite)
  }

  // Wait for the sprites to finish decoding before playing animations on them.
  k.onLoad(() => {
    buildLevel(k)
    buildBuildings(k, registry, openDialogue)
    buildSignposts(registry, openDialogue)
    const scenery = buildScenery(k, { reducedMotion })
    const player = buildPlayer(k)

    const cue = k.add([
      k.sprite('cue'),
      k.pos(0, 0),
      k.anchor('bot'),
      k.z(CUE_Z),
      k.opacity(0),
    ])

    /**
     * Acts on the nearest interactable only, so overlapping trigger radii can
     * never fire two things from one press.
     */
    const interact = (): void => {
      if (paused) return
      const target = registry.nearest(player.pos.x, player.pos.y)
      if (!target) return
      target.onInteract()
    }

    // Published so the on-screen interact button can fire the exact same
    // path as the keyboard, rather than synthesising a fake key event.
    interactFn = interact

    INTERACT_KEYS.forEach((key) => k.onKeyPress(key, interact))

    let facing: Direction = 'down'
    let playingAnim: string | null = null
    const camera = k.vec2(player.pos.x, player.pos.y)
    // Seed the camera before the first frame so nothing pops; the update loop
    // re-resolves the zoom every frame from there.
    k.setCamScale(zoomForWidth(canvas.clientWidth))
    k.setCamPos(camera)

    const stopWalking = (): void => {
      if (playingAnim === null) return
      player.stop()
      player.frame = idleFrame(facing)
      playingAnim = null
    }

    k.onUpdate(() => {
      if (paused) {
        stopWalking()
        cue.opacity = 0
        setPrompt(null)
      } else {
        // --- input -----------------------------------------------------
        const move = k.vec2(0, 0)
        if (KEY_BINDINGS.left.some((key) => k.isKeyDown(key))) move.x -= 1
        if (KEY_BINDINGS.right.some((key) => k.isKeyDown(key))) move.x += 1
        if (KEY_BINDINGS.up.some((key) => k.isKeyDown(key))) move.y -= 1
        if (KEY_BINDINGS.down.some((key) => k.isKeyDown(key))) move.y += 1

        // The D-pad is summed in rather than checked as an either/or, so a
        // tablet with a keyboard attached responds to both without one input
        // source cancelling the other out.
        move.x += touchMove.x
        move.y += touchMove.y

        if (move.x !== 0 || move.y !== 0) {
          // Normalise so diagonals aren't ~41% faster than orthogonals.
          const dir = move.unit()
          const delta = Math.min(k.dt(), MAX_FRAME_DELTA)
          stepPlayer(player, dir.x, dir.y, PLAYER_SPEED * delta)

          // Vertical input wins ties so the sprite doesn't flicker on diagonals.
          if (move.y < 0) facing = 'up'
          else if (move.y > 0) facing = 'down'
          else if (move.x < 0) facing = 'left'
          else facing = 'right'

          const next = walkAnim(facing)
          if (playingAnim !== next) {
            player.play(next)
            playingAnim = next
          }
        } else {
          stopWalking()
        }

        // --- interaction cue -------------------------------------------
        const target = registry.nearest(player.pos.x, player.pos.y)
        if (target) {
          cue.opacity = 1
          cue.pos.x = target.x
          // The bob is the one piece of decorative motion in the world, so it
          // is the one thing dropped outright under reduced motion — the cue
          // still appears, it just sits still.
          const bob = reducedMotion ? 0 : Math.sin(k.time() * CUE_BOB_SPEED) * CUE_BOB_HEIGHT
          cue.pos.y = target.y - CUE_LIFT + bob
        } else {
          cue.opacity = 0
        }
        setPrompt(target ? target.label : null)

        // Ambient life shares the player's freeze: a chicken strolling past a
        // paused world would give away that the pause is only skin deep.
        scenery.update(Math.min(k.dt(), MAX_FRAME_DELTA), k.time())
      }

      // --- camera ------------------------------------------------------
      // Exponential smoothing: same feel at 30fps and 144fps, and it never
      // overshoots, so there is no jitter when the player stops. Under
      // reduced motion the constant is high enough that the camera is
      // effectively locked to the player instead of easing after them.
      const t = 1 - Math.exp(-cameraFollow * k.dt())
      camera.x += (player.pos.x - camera.x) * t
      camera.y += (player.pos.y - camera.y) * t

      // Zoom is resolved per frame from the live canvas width, which makes
      // rotating a phone or dragging a window edge Just Work. `clientWidth`
      // is read rather than `k.width()` because it is unambiguously CSS
      // pixels — the number the breakpoint is expressed in — whereas the
      // engine's own width can track the backing store instead.
      const zoom = zoomForWidth(canvas.clientWidth)
      k.setCamScale(zoom)

      // Keep the view inside the map so the void never shows.
      const halfWidth = k.width() / (2 * zoom)
      const halfHeight = k.height() / (2 * zoom)
      k.setCamPos(
        clamp(camera.x, halfWidth, WORLD_WIDTH - halfWidth),
        clamp(camera.y, halfHeight, WORLD_HEIGHT - halfHeight),
      )
    })

    // Everything is decoded, placed and positioned, and the camera is seeded.
    // Announcing readiness here rather than at the top of `onLoad` means the
    // loading screen never lifts on a half-built frame.
    callbacks.onReady()
  })

  return {
    resume: () => {
      paused = false
    },
    setTouchMove: (x: number, y: number) => {
      touchMove.x = x
      touchMove.y = y
    },
    triggerInteract: () => {
      interactFn?.()
    },
    destroy: () => {
      k.quit()
      // `quit()` stops the loop but leaves Kaplay's module-level pointer to the
      // "current" context in place. Without clearing it, the next boot (e.g.
      // switching to classic view and back) logs "KAPLAY already initialized,
      // ... it may lead bugs!" and force-quits an already-dead context.
      // `_k` is part of Kaplay's public surface, but its `k` field is typed as
      // always-present, hence the cast.
      ;(k._k as unknown as { k: KAPLAYCtx | null }).k = null
    },
  }
}

/** Re-exported so the React layer can size things without importing the map. */
export { FRAME_SIZE, TILE_SIZE }
