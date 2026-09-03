/**
 * Player art, drawn at runtime into an offscreen canvas.
 *
 * The whole character is generated in code rather than shipped as a PNG: a
 * 4-direction x 4-frame walk cycle costs about a hundred lines here and zero
 * bytes over the network, and it keeps the palette editable as constants
 * instead of locked inside an image. The canvas is handed straight to Kaplay,
 * which uploads it to the GPU as a texture.
 *
 * The layout is the conventional 4x4 sheet, so swapping in a downloaded sheet
 * later means changing only `createPlayerSpriteSheet` — the frame indices and
 * animation names below already match.
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
/** Dark brown, per spec's "dark brown or pink-tinted hair" — kept dark for
 *  contrast against the bright pink clothing rather than tinting it too. */
const HAIR = '#4a2a20'
/** Pink shirt/dress — the character's main colour, distinct from the
 *  village's own palette so only the player reads as pink. */
const SHIRT = '#ee6fa8'
/** Dark pink/burgundy skirt and legs. */
const LOWER = '#7a2350'
const SHOE = '#2e1f1c'
/** Bow / hair clip accent — a brighter pink than the shirt so it still
 *  reads as a distinct accessory rather than blending into the hair. */
const BOW = '#ff9fd0'
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

  // Legs first so the torso/skirt overlaps them cleanly. Same geometry and
  // per-frame shortening as before — only the colour changed — so the walk
  // cycle timing and silhouette are unchanged.
  px(5, 12, 2, 3 - legL, LOWER)
  px(9, 12, 2, 3 - legR, LOWER)
  px(5, 15 - legL, 2, 1, SHOE)
  px(9, 15 - legR, 2, 1, SHOE)

  // Skirt hem: a band one pixel wider than the torso on each side, drawn
  // before the torso so only its flared edges peek out from underneath —
  // reads as a dress/skirt rather than plain trousers.
  px(3, 11, 10, 2, LOWER)

  // Torso and arms.
  px(4, 8, 8, 5, SHIRT)
  px(3, 9, 1, 3, SKIN)
  px(12, 9, 1, 3, SKIN)

  // Head.
  px(4, 2, 8, 3, HAIR)
  px(4, 5, 8, 4, SKIN)

  // Direction-specific hair (drawn longer than the original short crop —
  // it drapes to shoulder height, or further down the back when facing
  // away) and facial detail.
  if (dir === 'up') {
    // Back of the head: hair falls past the shoulder line, but stops short
    // of the torso's bottom edge so the pink shirt still reads clearly.
    px(4, 5, 8, 5, HAIR)
  } else if (dir === 'down') {
    // Two long locks framing the face down to the shoulders.
    px(3, 6, 1, 6, HAIR)
    px(12, 6, 1, 6, HAIR)
    px(6, 6, 1, 1, OUTLINE)
    px(9, 6, 1, 1, OUTLINE)
  } else if (dir === 'left') {
    px(10, 5, 3, 7, HAIR)
    px(6, 6, 1, 1, OUTLINE)
  } else {
    px(3, 5, 3, 7, HAIR)
    px(9, 6, 1, 1, OUTLINE)
  }

  // Bow / hair clip — a small brighter-pink accessory at the crown, visible
  // from every angle since the top of the head always faces the camera.
  px(6, 1, 1, 1, BOW)
  px(9, 1, 1, 1, BOW)
  px(7, 1, 2, 1, OUTLINE)
}

/**
 * Builds the sheet and hands back the canvas for Kaplay to upload directly.
 * Layout: 4 columns (frames) x 4 rows (directions).
 */
export function createPlayerSpriteSheet(): HTMLCanvasElement {
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

  return canvas
}
