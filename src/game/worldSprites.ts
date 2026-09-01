/**
 * Procedurally drawn world art: building facades and the "you can interact"
 * cue.
 *
 * Nothing here is downloaded. Each function paints onto an offscreen canvas at
 * exact pixel sizes and hands back a data URL, which Kaplay loads like any
 * other sprite. Drawing is done with `fillRect` only, so every edge lands on a
 * whole pixel and the art stays crisp when the camera magnifies it.
 */

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
): string {
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

  return ctx.canvas.toDataURL()
}

/* ------------------------------------------------------------------ */
/* Interaction cue                                                     */
/* ------------------------------------------------------------------ */

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
export function createCueSprite(): string {
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

  return ctx.canvas.toDataURL()
}
