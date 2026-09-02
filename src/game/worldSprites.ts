/**
 * Procedurally drawn world art: building facades, scenery, and the "you can
 * interact" cue.
 *
 * Nothing here is downloaded. Each function paints onto an offscreen canvas at
 * exact pixel sizes and hands the canvas itself back, which Kaplay uploads to
 * the GPU as a texture. Returning the canvas rather than `toDataURL()` skips a
 * base64 encode and an image decode per sprite — with ~16 sprites generated at
 * boot that round-trip was the single most expensive thing happening on the
 * main thread before the world appeared.
 *
 * Drawing is done with `fillRect` only, so every edge lands on a whole pixel
 * and the art stays crisp when the camera magnifies it.
 */

/** What Kaplay is handed for every generated sprite. */
export type SpriteCanvas = HTMLCanvasElement

/** Colours for one building facade. */
export interface BuildingPalette {
  roof: string
  roofShade: string
  wall: string
  wallShade: string
  door: string
  doorFrame: string
  window: string
  outline: string
}

function newCanvas(width: number, height: number): CanvasRenderingContext2D {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('2D canvas context unavailable — cannot draw sprites.')
  return ctx
}

/** Multiplies a `#rrggbb` colour toward black. `factor` of 0.8 = 20% darker. */
function darken(hex: string, factor: number): string {
  const value = parseInt(hex.slice(1), 16)
  const r = Math.round(((value >> 16) & 0xff) * factor)
  const g = Math.round(((value >> 8) & 0xff) * factor)
  const b = Math.round((value & 0xff) * factor)
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`
}

/**
 * Builds a full facade palette from just the two colours that actually make a
 * building look distinct: its wall and its roof. Everything else is derived,
 * so all eight buildings stay visually consistent with each other.
 */
export function makePalette(wall: string, roof: string): BuildingPalette {
  return {
    wall,
    wallShade: darken(wall, 0.72),
    roof,
    roofShade: darken(roof, 0.7),
    door: darken(roof, 0.55),
    doorFrame: darken(roof, 0.38),
    window: '#cfe6f2',
    outline: '#1b1410',
  }
}

function fill(
  ctx: CanvasRenderingContext2D,
  color: string,
  x: number,
  y: number,
  w: number,
  h: number,
): void {
  ctx.fillStyle = color
  ctx.fillRect(x, y, w, h)
}

/** A 1px rectangular border, drawn as four bars so it stays pixel-exact. */
function stroke(
  ctx: CanvasRenderingContext2D,
  color: string,
  x: number,
  y: number,
  w: number,
  h: number,
): void {
  fill(ctx, color, x, y, w, 1)
  fill(ctx, color, x, y + h - 1, w, 1)
  fill(ctx, color, x, y, 1, h)
  fill(ctx, color, x + w - 1, y, 1, h)
}

/** Door opening, in pixels. Kept constant so every building reads the same. */
const DOOR_WIDTH = 18
const DOOR_HEIGHT = 26
const WINDOW_SIZE = 10
const WINDOW_GAP = 26

/**
 * Draws one building facade sized to its footprint on the map.
 *
 * The door is always centred along the bottom edge, which is what the
 * interaction trigger anchors to — see `doorAnchor()` in `buildings.ts`.
 */
export function createBuildingSprite(
  width: number,
  height: number,
  palette: BuildingPalette,
): SpriteCanvas {
  const ctx = newCanvas(width, height)

  // Roof takes the top slice; the rest is wall.
  const roofHeight = Math.max(14, Math.round(height * 0.36))

  fill(ctx, palette.wall, 0, roofHeight, width, height - roofHeight)
  fill(ctx, palette.wallShade, 0, height - 3, width, 3)

  fill(ctx, palette.roof, 0, 0, width, roofHeight)
  // Eave: a darker band along the roof's lower edge, plus a shadow on the wall.
  fill(ctx, palette.roofShade, 0, roofHeight - 4, width, 4)
  fill(ctx, palette.wallShade, 0, roofHeight, width, 2)

  // Door, centred on the bottom edge.
  const doorHeight = Math.min(DOOR_HEIGHT, height - roofHeight - 4)
  const doorX = Math.round((width - DOOR_WIDTH) / 2)
  const doorY = height - doorHeight
  fill(ctx, palette.doorFrame, doorX, doorY, DOOR_WIDTH, doorHeight)
  fill(ctx, palette.door, doorX + 2, doorY + 2, DOOR_WIDTH - 4, doorHeight - 2)
  // Handle.
  fill(ctx, palette.doorFrame, doorX + DOOR_WIDTH - 6, doorY + Math.round(doorHeight / 2), 2, 2)

  // Windows march across the wall, skipping the door and the outer border.
  const wallTop = roofHeight + 5
  const windowY = wallTop + Math.max(0, Math.round((height - wallTop - doorHeight) / 2) - 4)
  if (windowY + WINDOW_SIZE < doorY + doorHeight) {
    for (let x = 6; x + WINDOW_SIZE <= width - 6; x += WINDOW_GAP) {
      const clearsDoor = x + WINDOW_SIZE < doorX - 3 || x > doorX + DOOR_WIDTH + 3
      if (!clearsDoor) continue
      fill(ctx, palette.window, x, windowY, WINDOW_SIZE, WINDOW_SIZE)
      stroke(ctx, palette.outline, x, windowY, WINDOW_SIZE, WINDOW_SIZE)
      // Panes.
      fill(ctx, palette.outline, x + Math.floor(WINDOW_SIZE / 2), windowY, 1, WINDOW_SIZE)
      fill(ctx, palette.outline, x, windowY + Math.floor(WINDOW_SIZE / 2), WINDOW_SIZE, 1)
    }
  }

  stroke(ctx, palette.outline, 0, 0, width, height)

  return ctx.canvas
}

/**
 * Distinct facade for the Security Center. Every other building is a house
 * shape: peaked roof, house windows, one door. This one is deliberately not:
 * a flat dark roofline, a bank of glowing monitor screens instead of windows,
 * and a server rack with status lights along the base, so it reads as a
 * different kind of place at a glance, before a single line of text loads.
 */
export function createSecurityCenterSprite(
  width: number,
  height: number,
  palette: BuildingPalette,
): SpriteCanvas {
  const ctx = newCanvas(width, height)

  const bandHeight = Math.max(10, Math.round(height * 0.22))

  // Flat dark band instead of a peaked roof.
  fill(ctx, palette.roofShade, 0, 0, width, bandHeight)
  fill(ctx, palette.wallShade, 0, bandHeight, width, 3)

  // Wall.
  fill(ctx, palette.wall, 0, bandHeight, width, height - bandHeight)
  fill(ctx, palette.wallShade, 0, height - 3, width, 3)

  // Monitor bank: glowing screens where a house would have windows.
  const screenW = 12
  const screenH = 9
  const screenY = bandHeight + 6
  const screenGap = 20
  const glow = '#5be0c7'
  for (let x = 6; x + screenW <= width - 6; x += screenGap) {
    fill(ctx, palette.outline, x - 1, screenY - 1, screenW + 2, screenH + 2)
    fill(ctx, glow, x, screenY, screenW, screenH)
    fill(ctx, palette.outline, x, screenY + screenH - 2, screenW, 1)
  }

  // Server rack: a dark band with a row of tiny status lights.
  const rackHeight = 12
  const rackY = height - 18
  fill(ctx, palette.wallShade, 4, rackY, width - 8, rackHeight)
  stroke(ctx, palette.outline, 4, rackY, width - 8, rackHeight)
  const lightColors = ['#5be0c7', '#e0a45b', '#e05b5b']
  for (let x = 8, i = 0; x + 3 <= width - 8; x += 8, i++) {
    fill(ctx, lightColors[i % lightColors.length], x, rackY + 4, 2, 2)
  }

  // Centre hatch — decorative. Each terminal inside has its own trigger, so
  // this door doesn't need one of its own.
  const doorHeight = Math.min(DOOR_HEIGHT, height - bandHeight - 4)
  const doorX = Math.round((width - DOOR_WIDTH) / 2)
  const doorY = height - doorHeight
  fill(ctx, palette.doorFrame, doorX, doorY, DOOR_WIDTH, doorHeight)
  fill(ctx, palette.door, doorX + 2, doorY + 2, DOOR_WIDTH - 4, doorHeight - 2)

  stroke(ctx, palette.outline, 0, 0, width, height)

  return ctx.canvas
}


export const CUE_WIDTH = 16
export const CUE_HEIGHT = 20

/** 3x5 pixel glyph for the letter E, so no font has to be loaded. */
const GLYPH_E = [
  [1, 1, 1],
  [1, 0, 0],
  [1, 1, 1],
  [1, 0, 0],
  [1, 1, 1],
]

/**
 * The floating badge shown above whichever interactable is in range: a dark
 * key-cap with a white "E" and a little pointer underneath.
 */
export function createCueSprite(): SpriteCanvas {
  const ctx = newCanvas(CUE_WIDTH, CUE_HEIGHT)

  const badge = 16
  const bg = '#1b1410'
  const border = '#f4e9c8'

  // Key-cap with the corner pixels knocked out, which reads as rounded.
  fill(ctx, bg, 1, 0, badge - 2, badge)
  fill(ctx, bg, 0, 1, badge, badge - 2)
  fill(ctx, border, 2, 0, badge - 4, 1)
  fill(ctx, border, 2, badge - 1, badge - 4, 1)
  fill(ctx, border, 0, 2, 1, badge - 4)
  fill(ctx, border, badge - 1, 2, 1, badge - 4)

  // Pointer tapering down toward the object being highlighted.
  fill(ctx, bg, 6, badge, 4, 1)
  fill(ctx, bg, 7, badge + 1, 2, 1)
  fill(ctx, bg, 7, badge + 2, 1, 1)

  // Letter, scaled 2x and centred.
  const scale = 2
  const glyphW = GLYPH_E[0].length * scale
  const glyphH = GLYPH_E.length * scale
  const originX = Math.round((badge - glyphW) / 2)
  const originY = Math.round((badge - glyphH) / 2)
  GLYPH_E.forEach((row, y) => {
    row.forEach((on, x) => {
      if (!on) return
      fill(ctx, border, originX + x * scale, originY + y * scale, scale, scale)
    })
  })

  return ctx.canvas
}

// ---------------------------------------------------------------------------
// Scenery
// ---------------------------------------------------------------------------

/** One chicken frame is a tile; the sheet is 2 frames x 2 facings. */
export const CHICKEN_FRAME = 16
export const CHICKEN_FRAMES_PER_ROW = 2
/** Row order in the chicken sheet. Index = row * 2 + frame. */
export const CHICKEN_FACINGS = ['right', 'left'] as const

/**
 * Two-frame chicken walk cycle, facing right on row 0 and left on row 1.
 *
 * The two frames differ only in leg position and a one-pixel body bob, which
 * at 6fps is enough to read as pecking about. Drawing the left-facing row by
 * mirroring the right-facing one keeps the two halves guaranteed identical.
 */
export function createChickenSpriteSheet(): SpriteCanvas {
  const ctx = newCanvas(CHICKEN_FRAME * CHICKEN_FRAMES_PER_ROW, CHICKEN_FRAME * 2)

  const BODY = '#f6f2e8'
  const SHADE = '#d8cfbe'
  const COMB = '#d9483b'
  const BEAK = '#e8a33d'
  const EYE = '#1b1410'
  const FOOT = '#e8a33d'

  // Row 0: facing right.
  for (let frame = 0; frame < CHICKEN_FRAMES_PER_ROW; frame++) {
    const ox = frame * CHICKEN_FRAME
    // Frame 1 lifts the body a pixel and swaps which foot is forward.
    const bob = frame === 1 ? -1 : 0

    // Body.
    fill(ctx, BODY, ox + 4, 7 + bob, 7, 5)
    fill(ctx, SHADE, ox + 4, 11 + bob, 7, 1)
    // Tail.
    fill(ctx, BODY, ox + 3, 6 + bob, 2, 3)
    // Head and neck.
    fill(ctx, BODY, ox + 9, 4 + bob, 3, 4)
    fill(ctx, COMB, ox + 10, 3 + bob, 2, 1)
    fill(ctx, BEAK, ox + 12, 5 + bob, 2, 1)
    fill(ctx, EYE, ox + 11, 5 + bob, 1, 1)
    // Legs: alternate which one is forward.
    const legA = frame === 0 ? 5 : 6
    const legB = frame === 0 ? 8 : 9
    fill(ctx, FOOT, ox + legA, 12 + bob, 1, 3)
    fill(ctx, FOOT, ox + legB, 12 + bob, 1, 3)
  }

  // Row 1: the same frames mirrored, so left and right can never drift apart.
  // Mirroring the row as a whole also reverses the frame order within it, so
  // row 1 reads [frame1, frame0]. That is invisible in a two-frame loop, but
  // it does mean the neutral idle pose on the left is index 3, not index 2 —
  // see IDLE_FRAME_BY_FACING.
  ctx.save()
  ctx.translate(ctx.canvas.width, CHICKEN_FRAME)
  ctx.scale(-1, 1)
  ctx.drawImage(
    ctx.canvas,
    0,
    0,
    ctx.canvas.width,
    CHICKEN_FRAME,
    0,
    0,
    ctx.canvas.width,
    CHICKEN_FRAME,
  )
  ctx.restore()

  return ctx.canvas
}

/** Neutral standing frame for each facing. See the mirroring note above. */
export const IDLE_FRAME_BY_FACING = { right: 0, left: 3 } as const

/** Flower clusters are a tile square and come in this many colour variants. */
export const FLOWER_FRAME = 16
export const FLOWER_VARIANTS = 3

const FLOWER_COLORS = ['#f2d65c', '#e88ec0', '#9ec9f5']
const FLOWER_CENTER = '#f6f2e8'
const STEM = '#3f7a35'

/**
 * A small cluster of blooms on a transparent tile, one canvas per variant.
 *
 * These are pure decoration laid over the grass colour, so they carry no
 * collision and never sit on a path tile — placement is decided in
 * `createGame`, which owns the map.
 */
export function createFlowerSprite(variant: number): SpriteCanvas {
  const ctx = newCanvas(FLOWER_FRAME, FLOWER_FRAME)
  const petal = FLOWER_COLORS[variant % FLOWER_COLORS.length]

  // Three blooms at fixed offsets. Fixed rather than random because the
  // variety comes from which variant is placed where, and a deterministic
  // sprite is one less thing that can look different on every reload.
  const blooms: [number, number][] = [
    [3, 8],
    [8, 5],
    [11, 10],
  ]

  for (const [x, y] of blooms) {
    fill(ctx, STEM, x + 1, y + 2, 1, 4)
    fill(ctx, petal, x, y, 3, 1)
    fill(ctx, petal, x, y + 1, 1, 1)
    fill(ctx, petal, x + 2, y + 1, 1, 1)
    fill(ctx, petal, x, y + 2, 3, 1)
    fill(ctx, FLOWER_CENTER, x + 1, y + 1, 1, 1)
  }

  return ctx.canvas
}

/** Ambient motes are a single soft dot; size is set per particle by scale. */
export const MOTE_SIZE = 4

/** One pale dot with a dimmer rim, so it reads as a glow at 2x zoom. */
export function createMoteSprite(): SpriteCanvas {
  const ctx = newCanvas(MOTE_SIZE, MOTE_SIZE)
  fill(ctx, '#fdf7d0', 1, 0, 2, 4)
  fill(ctx, '#fdf7d0', 0, 1, 4, 2)
  fill(ctx, '#ffffff', 1, 1, 2, 2)
  return ctx.canvas
}
