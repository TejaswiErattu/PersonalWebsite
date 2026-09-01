import kaplay, { type KAPLAYCtx, type GameObj } from 'kaplay'

import { canStandAt } from './collision'
import {
  GRASS_COLOR,
  MAP,
  TILES,
  TILE_SIZE,
  WORLD_HEIGHT,
  WORLD_WIDTH,
  assertMapIsRectangular,
  findSpawnPoint,
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

/** Player walking speed, in world pixels per second. */
const PLAYER_SPEED = 78

/** How much the world is magnified. Tiles are 16px, so 2x reads as pixel art
 *  while still showing roughly two thirds of the village at once. */
const CAMERA_ZOOM = 2

/** Higher = camera snaps to the player faster. Frame-rate independent. */
const CAMERA_FOLLOW = 12

/** Draw order: tiles sit at 0, the player walks on top of them. */
const PLAYER_Z = 10

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
}

function clamp(value: number, min: number, max: number): number {
  if (max < min) return (min + max) / 2
  return Math.min(Math.max(value, min), max)
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
      Object.entries(TILES).map(([symbol, spec]) => [
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
export function createGame(canvas: HTMLCanvasElement): GameHandle {
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

  // Wait for the sprite to finish decoding before playing animations on it.
  k.onLoad(() => {
    buildLevel(k)
    const player = buildPlayer(k)

    let facing: Direction = 'down'
    let playingAnim: string | null = null
    const camera = k.vec2(player.pos.x, player.pos.y)
    k.setCamScale(CAMERA_ZOOM)
    k.setCamPos(camera)

    k.onUpdate(() => {
      // --- input -------------------------------------------------------
      const move = k.vec2(0, 0)
      if (KEY_BINDINGS.left.some((key) => k.isKeyDown(key))) move.x -= 1
      if (KEY_BINDINGS.right.some((key) => k.isKeyDown(key))) move.x += 1
      if (KEY_BINDINGS.up.some((key) => k.isKeyDown(key))) move.y -= 1
      if (KEY_BINDINGS.down.some((key) => k.isKeyDown(key))) move.y += 1

      const isMoving = move.x !== 0 || move.y !== 0

      if (isMoving) {
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
      } else if (playingAnim !== null) {
        player.stop()
        player.frame = idleFrame(facing)
        playingAnim = null
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
