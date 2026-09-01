/**
 * Placeholder player art, generated at runtime.
 *
 * Phase 1 has no downloaded asset packs yet, so instead of shipping a broken
 * image reference we draw a 4-direction x 4-frame walk cycle into an offscreen
 * canvas and hand Kaplay the resulting data URL. When the real Sprout Lands
 * character art lands, only `createPlayerSpriteSheet` needs to be swapped for a
 * `loadSprite("player", "/sprites/player.png", ...)` call — the frame layout
 * and animation names below are already the standard 4x4 sheet layout.
 */

/** Width and height of a single frame, in pixels. Matches TILE_SIZE. */
export const FRAME_SIZE = 16

/** Frames per walk cycle. */
export const FRAMES_PER_DIRECTION = 4

/**
 * Row order in the sheet. Frame index = rowIndex * FRAMES_PER_DIRECTION + frame,
 * which is exactly how Kaplay indexes a sliceX/sliceY sheet.
 */
export const DIRECTIONS = ['down', 'left', 'right', 'up'] as const

export type Direction = (typeof DIRECTIONS)[number]

/** Animation name for a direction, e.g. "walk-down". */
export function walkAnim(dir: Direction): string {
  return `walk-${dir}`
}

/** First frame of a direction's row — used as the idle pose. */
export function idleFrame(dir: Direction): number {
  return DIRECTIONS.indexOf(dir) * FRAMES_PER_DIRECTION
}

const SKIN = '#e8b58c'
const HAIR = '#2e1f18'
const SHIRT = '#3f7fb5'
const PANTS = '#3a4a63'
const SHOE = '#241a14'
const OUTLINE = '#1b1410'

/**
 * Leg offsets per frame: [leftLegShorten, rightLegShorten].
 * Frames 0 and 2 are the neutral pose, 1 and 3 are the two mid-strides, which
 * reads as a walk cycle at 8fps.
 */
const LEG_CYCLE: [number, number][] = [
  [0, 0],
  [1, 0],
  [0, 0],
  [0, 1],
]

function drawFrame(
  ctx: CanvasRenderingContext2D,
  ox: number,
  oy: number,
  dir: Direction,
  frame: number,
): void {
  const px = (x: number, y: number, w: number, h: number, color: string) => {
    ctx.fillStyle = color
    ctx.fillRect(ox + x, oy + y, w, h)
  }

  const [legL, legR] = LEG_CYCLE[frame]

  // Legs first so the torso overlaps them cleanly.
  px(5, 12, 2, 3 - legL, PANTS)
  px(9, 12, 2, 3 - legR, PANTS)
  px(5, 15 - legL, 2, 1, SHOE)
  px(9, 15 - legR, 2, 1, SHOE)

  // Torso and arms.
  px(4, 8, 8, 5, SHIRT)
  px(3, 9, 1, 3, SKIN)
  px(12, 9, 1, 3, SKIN)

  // Head.
  px(4, 2, 8, 3, HAIR)
  px(4, 5, 8, 4, SKIN)

  // Direction-specific facial detail.
  if (dir === 'up') {
    // Back of the head: all hair, no face.
    px(4, 5, 8, 4, HAIR)
  } else if (dir === 'down') {
    px(6, 6, 1, 1, OUTLINE)
    px(9, 6, 1, 1, OUTLINE)
  } else if (dir === 'left') {
    px(10, 5, 2, 4, HAIR)
    px(6, 6, 1, 1, OUTLINE)
  } else {
    px(4, 5, 2, 4, HAIR)
    px(9, 6, 1, 1, OUTLINE)
  }
}

/**
 * Builds the sheet and returns it as a PNG data URL that Kaplay can load.
 * Layout: 4 columns (frames) x 4 rows (directions).
 */
export function createPlayerSpriteSheet(): string {
  const canvas = document.createElement('canvas')
  canvas.width = FRAME_SIZE * FRAMES_PER_DIRECTION
  canvas.height = FRAME_SIZE * DIRECTIONS.length

  const ctx = canvas.getContext('2d')
  if (!ctx) {
    throw new Error('Could not get a 2D context to generate the player sprite sheet.')
  }
  ctx.imageSmoothingEnabled = false

  DIRECTIONS.forEach((dir, row) => {
    for (let frame = 0; frame < FRAMES_PER_DIRECTION; frame++) {
      drawFrame(ctx, frame * FRAME_SIZE, row * FRAME_SIZE, dir, frame)
    }
  })

  return canvas.toDataURL()
}
