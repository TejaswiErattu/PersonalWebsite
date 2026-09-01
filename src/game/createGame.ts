import kaplay, { type KAPLAYCtx, type GameObj } from 'kaplay'

import { canStandAt } from './collision'
import { InteractionRegistry } from './interactions'
import { BUILDING_SYMBOLS, LOCATIONS, type Dialogue } from './locations'
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
import { createBuildingSprite, createCueSprite } from './worldSprites'

/** Player walking speed, in world pixels per second. */
const PLAYER_SPEED = 78

/** How much the world is magnified. Tiles are 16px, so 2x reads as pixel art
 *  while still showing roughly two thirds of the village at once. */
const CAMERA_ZOOM = 2

/** Higher = camera snaps to the player faster. Frame-rate independent. */
const CAMERA_FOLLOW = 12

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

    // The door is drawn centred on the building's bottom edge, so the trigger
    // anchors to that same point — the spot the player walks up to.
    const { dialogue } = location
    if (!dialogue) continue

    registry.register({
      id: location.symbol,
      label: location.name,
      x: left + width / 2,
      y: top + height,
      radius: INTERACT_RADIUS,
      onInteract: () => openDialogue(dialogue()),
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

  // Every building gets its own sprite, drawn to its exact footprint. Loaded
  // here rather than inside `onLoad` so they are decoded before anything is
  // added to the scene.
  for (const location of LOCATIONS) {
    const rect = findTileRect(location.symbol)
    if (!rect) continue
    k.loadSprite(
      buildingSpriteName(location.symbol),
      createBuildingSprite(rect.cols * TILE_SIZE, rect.rows * TILE_SIZE, location.palette),
    )
  }

  // Wait for the sprites to finish decoding before playing animations on them.
  k.onLoad(() => {
    buildLevel(k)
    buildBuildings(k, registry, openDialogue)
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

    INTERACT_KEYS.forEach((key) => k.onKeyPress(key, interact))

    let facing: Direction = 'down'
    let playingAnim: string | null = null
    const camera = k.vec2(player.pos.x, player.pos.y)
    k.setCamScale(CAMERA_ZOOM)
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
          cue.pos.y =
            target.y - CUE_LIFT + Math.sin(k.time() * CUE_BOB_SPEED) * CUE_BOB_HEIGHT
        } else {
          cue.opacity = 0
        }
        setPrompt(target ? target.label : null)
      }

      // --- camera ------------------------------------------------------
      // Exponential smoothing: same feel at 30fps and 144fps, and it never
      // overshoots, so there is no jitter when the player stops.
      const t = 1 - Math.exp(-CAMERA_FOLLOW * k.dt())
      camera.x += (player.pos.x - camera.x) * t
      camera.y += (player.pos.y - camera.y) * t

      // Keep the view inside the map so the void never shows.
      const halfWidth = k.width() / (2 * CAMERA_ZOOM)
      const halfHeight = k.height() / (2 * CAMERA_ZOOM)
      k.setCamPos(
        clamp(camera.x, halfWidth, WORLD_WIDTH - halfWidth),
        clamp(camera.y, halfHeight, WORLD_HEIGHT - halfHeight),
      )
    })
  })

  return {
    resume: () => {
      paused = false
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
