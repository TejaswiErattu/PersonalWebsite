/**
 * Procedurally drawn world art: building facades, signposts, scenery, and the
 * "you can interact" cue.
 *
 * Nothing here is downloaded. Each function paints onto an offscreen canvas at
 * exact pixel sizes and hands the canvas itself back, which Kaplay uploads to
 * the GPU as a texture. Returning the canvas rather than `toDataURL()` skips a
 * base64 encode and an image decode per sprite.
 *
 * Drawing is done with `fillRect` only, so every edge lands on a whole pixel
 * and the art stays crisp when the camera magnifies it. Text is drawn with a
 * hand-authored 3x5 pixel font (see `PIXEL_FONT` below) rather than
 * `ctx.fillText`, for the same reason — browser text rendering is
 * anti-aliased and would blur under 2x pixel-art zoom.
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
 * so all nine buildings stay visually consistent with each other.
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
  ctx.fillRect(Math.round(x), Math.round(y), Math.max(1, Math.round(w)), Math.max(1, Math.round(h)))
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

// ---------------------------------------------------------------------------
// Pixel font — 3 wide x 5 tall glyphs, hand-authored so every letter stays a
// crisp block instead of an anti-aliased curve. Covers the characters every
// facade sign, signpost heading, and window plaque in this village needs:
// A-Z, space, "&", and "'".
// ---------------------------------------------------------------------------

type Glyph = readonly string[]

const G3: Record<string, Glyph> = {
  A: ['.#.', '#.#', '###', '#.#', '#.#'],
  B: ['##.', '#.#', '##.', '#.#', '##.'],
  C: ['.##', '#..', '#..', '#..', '.##'],
  D: ['##.', '#.#', '#.#', '#.#', '##.'],
  E: ['###', '#..', '##.', '#..', '###'],
  F: ['###', '#..', '##.', '#..', '#..'],
  G: ['.##', '#..', '#.#', '#.#', '.##'],
  H: ['#.#', '#.#', '###', '#.#', '#.#'],
  I: ['###', '.#.', '.#.', '.#.', '###'],
  J: ['..#', '..#', '..#', '#.#', '.#.'],
  K: ['#.#', '#.#', '##.', '#.#', '#.#'],
  L: ['#..', '#..', '#..', '#..', '###'],
  M: ['#.#', '###', '#.#', '#.#', '#.#'],
  N: ['#.#', '##.', '#.#', '.##', '#.#'],
  O: ['.#.', '#.#', '#.#', '#.#', '.#.'],
  P: ['##.', '#.#', '##.', '#..', '#..'],
  Q: ['.#.', '#.#', '#.#', '.##', '..#'],
  R: ['##.', '#.#', '##.', '##.', '#.#'],
  S: ['.##', '#..', '.#.', '..#', '##.'],
  T: ['###', '.#.', '.#.', '.#.', '.#.'],
  U: ['#.#', '#.#', '#.#', '#.#', '.#.'],
  V: ['#.#', '#.#', '#.#', '.#.', '.#.'],
  W: ['#.#', '#.#', '#.#', '###', '#.#'],
  X: ['#.#', '#.#', '.#.', '#.#', '#.#'],
  Y: ['#.#', '#.#', '.#.', '.#.', '.#.'],
  Z: ['###', '..#', '.#.', '#..', '###'],
  '&': ['.#.', '#.#', '.#.', '#.#', '.##'],
  "'": ['.#', '.#', '..', '..', '..'],
  ' ': ['...', '...', '...', '...', '...'],
}

/** Width in cells of one glyph (apostrophe is narrower). */
function glyphWidth(ch: string): number {
  return (G3[ch] ?? G3[' '])[0].length
}

/** Draws one line of pixel text at `scale` px per cell. Returns its width. */
function drawPixelText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  color: string,
  scale: number,
): number {
  let cursor = x
  for (const raw of text.toUpperCase()) {
    const glyph = G3[raw] ?? G3[' ']
    glyph.forEach((row, ry) => {
      for (let rx = 0; rx < row.length; rx++) {
        if (row[rx] !== '#') continue
        fill(ctx, color, cursor + rx * scale, y + ry * scale, scale, scale)
      }
    })
    cursor += (glyphWidth(raw) + 1) * scale
  }
  return cursor - x - scale
}

/** Measures a line of pixel text without drawing it. */
function measurePixelText(text: string, scale: number): number {
  let width = 0
  for (const raw of text.toUpperCase()) width += (glyphWidth(raw) + 1) * scale
  return Math.max(0, width - scale)
}

/** Greedily wraps `text` onto lines no longer than `maxChars` characters. */
function wrapText(text: string, maxChars: number): string[] {
  const words = text.split(/\s+/).filter(Boolean)
  const lines: string[] = []
  let current = ''
  for (const word of words) {
    const next = current ? `${current} ${word}` : word
    if (next.length > maxChars && current) {
      lines.push(current)
      current = word
    } else {
      current = next
    }
  }
  if (current) lines.push(current)
  return lines.length ? lines : ['']
}

/** Draws a centred block of pixel text, wrapped to fit `maxWidth` px. */
function drawWrappedText(
  ctx: CanvasRenderingContext2D,
  text: string,
  centerX: number,
  top: number,
  maxWidth: number,
  color: string,
  scale: number,
): number {
  const maxChars = Math.max(3, Math.floor(maxWidth / ((3 + 1) * scale)))
  const lines = wrapText(text, maxChars)
  const lineHeight = (5 + 2) * scale
  lines.forEach((line, i) => {
    const w = measurePixelText(line, scale)
    drawPixelText(ctx, line, centerX - w / 2, top + i * lineHeight, color, scale)
  })
  return lines.length * lineHeight
}

// ---------------------------------------------------------------------------
// Pixel icons — small (roughly 10x10) glyphs used on window awnings, signpost
// boards, and plaques so each is recognisable at a glance before any text
// loads. Every icon is drawn inside its own (x, y, size) box.
// ---------------------------------------------------------------------------

export type IconId =
  | 'heart'
  | 'cap'
  | 'compass'
  | 'shield'
  | 'flag'
  | 'coin'
  | 'gear'
  | 'wrench'
  | 'bolt'
  | 'robot'
  | 'chat'
  | 'book'
  | 'belt'
  | 'pin'
  | 'phone'
  | 'branch'
  | 'terminal'
  | 'leaf'
  | 'fossil'
  | 'globe'
  | 'mail'
  | 'link'
  | 'server'
  | 'sprout'
  | 'bell'
  | 'clock'

function drawIcon(
  ctx: CanvasRenderingContext2D,
  icon: IconId,
  x: number,
  y: number,
  size: number,
  color: string,
): void {
  // Every icon is authored against a 10x10 unit grid, then scaled to `size`.
  const u = size / 10
  const px = (gx: number, gy: number, gw = 1, gh = 1): void =>
    fill(ctx, color, x + gx * u, y + gy * u, gw * u, gh * u)

  switch (icon) {
    case 'heart':
      px(2, 2, 2, 2)
      px(6, 2, 2, 2)
      px(1, 3, 8, 2)
      px(2, 5, 6, 1)
      px(3, 6, 4, 1)
      px(4, 7, 2, 1)
      break
    case 'cap':
      px(1, 4, 8, 1)
      px(4, 1, 2, 3)
      px(0, 4, 10, 1)
      px(2, 6, 6, 2)
      px(7, 5, 1, 4)
      break
    case 'compass':
      stroke(ctx, color, x, y, size, size)
      px(4, 2, 1, 3)
      px(5, 5, 1, 3)
      px(2, 4, 3, 1)
      px(5, 5, 3, 1)
      break
    case 'shield':
      px(2, 1, 6, 1)
      px(1, 2, 8, 4)
      px(2, 6, 6, 2)
      px(3, 8, 4, 1)
      px(4, 3, 2, 3)
      break
    case 'flag':
      px(2, 1, 1, 8)
      px(3, 1, 5, 1)
      px(3, 2, 4, 1)
      px(3, 3, 5, 1)
      px(3, 4, 3, 1)
      break
    case 'coin':
      px(3, 1, 4, 1)
      px(1, 2, 2, 6)
      px(7, 2, 2, 6)
      px(3, 8, 4, 1)
      px(4, 3, 2, 4)
      break
    case 'gear':
      px(3, 0, 4, 2)
      px(3, 8, 4, 2)
      px(0, 3, 2, 4)
      px(8, 3, 2, 4)
      px(3, 3, 4, 4)
      px(1, 1, 2, 2)
      px(7, 1, 2, 2)
      px(1, 7, 2, 2)
      px(7, 7, 2, 2)
      break
    case 'wrench':
      px(1, 1, 3, 3)
      px(3, 3, 5, 1)
      px(6, 3, 3, 3)
      px(2, 4, 1, 5)
      px(1, 8, 3, 1)
      break
    case 'bolt':
      px(5, 0, 3, 3)
      px(3, 3, 3, 2)
      px(4, 5, 3, 2)
      px(2, 7, 3, 3)
      break
    case 'robot':
      stroke(ctx, color, x + 2 * u, y, 6 * u, 6 * u)
      px(3, 2, 1, 1)
      px(6, 2, 1, 1)
      px(3, 4, 4, 1)
      px(4, 6, 2, 2)
      px(1, 7, 2, 2)
      px(7, 7, 2, 2)
      px(4, 8, 2, 2)
      break
    case 'chat':
      fill(ctx, color, x, y, size, 6 * u)
      px(2, 6, 1, 2)
      px(1, 8, 1, 1)
      px(2, 2, 1, 2)
      px(5, 2, 1, 2)
      break
    case 'book':
      px(1, 1, 4, 8)
      px(5, 1, 4, 8)
      px(4, 1, 1, 8)
      break
    case 'belt':
      fill(ctx, color, x, y + 4 * u, size, 2 * u)
      px(4, 3, 2, 4)
      break
    case 'pin':
      px(3, 1, 4, 4)
      px(4, 5, 2, 2)
      px(4.5, 7, 1, 3)
      break
    case 'phone':
      stroke(ctx, color, x + 2.5 * u, y, 5 * u, 10 * u)
      px(4, 8, 2, 1)
      break
    case 'branch':
      px(1, 1, 2, 2)
      px(1, 3, 2, 5)
      px(7, 5, 2, 2)
      px(2, 7, 6, 1)
      px(7, 3, 2, 2)
      break
    case 'terminal':
      stroke(ctx, color, x, y, size, size)
      px(2, 3, 1, 1)
      px(3, 4, 1, 1)
      px(2, 5, 1, 1)
      px(5, 6, 3, 1)
      break
    case 'leaf':
      px(4, 1, 2, 2)
      px(2, 3, 6, 2)
      px(1, 5, 8, 2)
      px(4, 7, 2, 2)
      px(4, 3, 1, 6)
      break
    case 'fossil':
      px(1, 4, 8, 2)
      px(2, 2, 2, 2)
      px(6, 6, 2, 2)
      px(3, 3, 1, 1)
      px(6, 5, 1, 1)
      break
    case 'globe':
      px(2, 1, 6, 8)
      px(1, 3, 8, 1)
      px(1, 6, 8, 1)
      px(4, 1, 2, 8)
      break
    case 'mail':
      stroke(ctx, color, x, y + 1 * u, size, 7 * u)
      px(0, 1, 1, 1)
      px(1, 2, 1, 1)
      px(2, 3, 6, 1)
      px(8, 2, 1, 1)
      px(9, 1, 1, 1)
      break
    case 'link':
      stroke(ctx, color, x, y + 2 * u, 5 * u, 4 * u)
      stroke(ctx, color, x + 4 * u, y + 4 * u, 5 * u, 4 * u)
      break
    case 'server':
      stroke(ctx, color, x, y, size, 4 * u)
      stroke(ctx, color, x, y + 5 * u, size, 4 * u)
      px(1, 2, 1, 1)
      px(1, 7, 1, 1)
      break
    case 'sprout':
      px(4, 6, 2, 3)
      px(2, 4, 3, 2)
      px(5, 3, 3, 2)
      px(4, 2, 2, 2)
      break
    case 'bell':
      px(3, 1, 4, 1)
      px(2, 2, 6, 4)
      px(1, 6, 8, 1)
      px(4, 8, 2, 1)
      break
    case 'clock':
      stroke(ctx, color, x, y, size, size)
      px(4.5, 2, 1, 3)
      px(5, 5, 3, 1)
      break
  }
}

// ---------------------------------------------------------------------------
// Buildings
// ---------------------------------------------------------------------------

export type BuildingVariant =
  | 'cottage'
  | 'trainStation'
  | 'workshop'
  | 'schoolhouse'
  | 'observatory'
  | 'cyberWorkshop'
  | 'greenhouse'
  | 'postOffice'

/** One window/station's visual identity, in the order stations are defined. */
export interface WindowVisual {
  accent: string
  icon: IconId
  plaque: string
}

/**
 * The post office chimney's geometry, in pixels from the facade's top-right
 * corner. Shared by the brickwork in `drawVariantDecoration()` and by
 * `postOfficeChimneyMouth()`, so "Send Mail" envelopes always launch from
 * the flue that is actually drawn.
 */
const CHIMNEY_INSET = 18
const CHIMNEY_WIDTH = 9
const CHIMNEY_TOP = 3

/**
 * Where the post office's chimney flue sits, relative to the facade sprite's
 * top-left corner. Building sprites are added at their footprint's top-left
 * with no anchor, so `createGame.ts` adds this straight onto the building's
 * world position to find the spot envelopes should fly out of.
 */
export function postOfficeChimneyMouth(width: number): { x: number; y: number } {
  return { x: width - CHIMNEY_INSET + CHIMNEY_WIDTH / 2, y: CHIMNEY_TOP - 1 }
}

/** Door opening, in pixels. Kept constant so every building reads the same. */
const DOOR_WIDTH = 18
const DOOR_HEIGHT = 26
const WINDOW_SIZE = 16

/**
 * Draws a small wooden plaque centred at `xCenter`, wrapped to fit within
 * `maxWidth` (rather than growing to fit its text on one line) so that
 * plaques on adjacent, closely-spaced windows/plots never overlap each
 * other. Returns the plaque's total height, in case a caller needs it.
 */
function drawPlaque(
  ctx: CanvasRenderingContext2D,
  xCenter: number,
  top: number,
  maxWidth: number,
  text: string,
  outline: string,
): number {
  const maxChars = Math.max(3, Math.floor((maxWidth - 4) / 4))
  const lines = wrapText(text, maxChars)
  const height = 4 + lines.length * 7
  fill(ctx, '#f4e9c8', xCenter - maxWidth / 2, top, maxWidth, height)
  stroke(ctx, outline, xCenter - maxWidth / 2, top, maxWidth, height)
  drawWrappedText(ctx, text, xCenter, top + 2, maxWidth - 4, outline, 1)
  return height
}

/**
 * Draws one themed window: a coloured frame/awning, a small pixel icon, and a
 * short plaque underneath. `xCenter` is computed with the exact same formula
 * `createGame.ts` uses to place the station's interaction trigger
 * (`(index + 1) * width / (count + 1)`), so the visible window and the spot
 * the player must stand to open it are always the same point. `maxPlaqueWidth`
 * is capped to the gap between neighbouring stations so plaques can never
 * bleed into each other.
 */
function drawWindow(
  ctx: CanvasRenderingContext2D,
  xCenter: number,
  windowY: number,
  visual: WindowVisual,
  outline: string,
  glass: string,
  maxPlaqueWidth: number,
): void {
  const wx = Math.round(xCenter - WINDOW_SIZE / 2)
  // Awning: a coloured bar above the frame, the "unique colored frame" cue.
  fill(ctx, visual.accent, wx - 3, windowY - 5, WINDOW_SIZE + 6, 4)
  stroke(ctx, outline, wx - 3, windowY - 5, WINDOW_SIZE + 6, 4)
  // Frame + glass.
  fill(ctx, visual.accent, wx - 2, windowY, WINDOW_SIZE + 4, WINDOW_SIZE + 4)
  fill(ctx, glass, wx, windowY + 2, WINDOW_SIZE, WINDOW_SIZE)
  fill(ctx, outline, wx + Math.floor(WINDOW_SIZE / 2), windowY + 2, 1, WINDOW_SIZE)
  fill(ctx, outline, wx, windowY + 2 + Math.floor(WINDOW_SIZE / 2), WINDOW_SIZE, 1)
  stroke(ctx, outline, wx - 2, windowY, WINDOW_SIZE + 4, WINDOW_SIZE + 4)
  // Icon, centred on the glass.
  const iconSize = 10
  drawIcon(ctx, visual.icon, xCenter - iconSize / 2, windowY + 5, iconSize, outline)
  // Plaque, on a small plate beneath the window.
  drawPlaque(ctx, xCenter, windowY + WINDOW_SIZE + 7, maxPlaqueWidth, visual.plaque, outline)
}

/** Facade sign: a wooden plaque above the roofline reading the location name. */
function drawFacadeSign(
  ctx: CanvasRenderingContext2D,
  width: number,
  signText: string,
  outline: string,
): void {
  const textWidth = measurePixelText(signText, 1)
  const boardWidth = Math.min(width - 8, textWidth + 10)
  const boardX = (width - boardWidth) / 2
  fill(ctx, '#f4e9c8', boardX, 2, boardWidth, 9)
  stroke(ctx, outline, boardX, 2, boardWidth, 9)
  drawWrappedText(ctx, signText, width / 2, 4, boardWidth - 4, outline, 1)
}

/** Evenly spaces `count` items along `width`, matching createGame's stations. */
function stationX(index: number, count: number, width: number): number {
  return ((index + 1) * width) / (count + 1)
}

/** Draws the shared house shell every variant decorates on top of. */
function drawHouseShell(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  palette: BuildingPalette,
  roofHeightOverride?: number,
): number {
  const roofHeight = roofHeightOverride ?? Math.max(14, Math.round(height * 0.34))
  fill(ctx, palette.wall, 0, roofHeight, width, height - roofHeight)
  fill(ctx, palette.wallShade, 0, height - 3, width, 3)
  fill(ctx, palette.roof, 0, 0, width, roofHeight)
  fill(ctx, palette.roofShade, 0, roofHeight - 4, width, 4)
  fill(ctx, palette.wallShade, 0, roofHeight, width, 2)
  return roofHeight
}

/**
 * Centred door on the bottom edge. Every current building is `stations`-only
 * (`dialogue: null`), so this door is purely decorative — nothing registers
 * an interaction trigger on it. When a station's window would land on the
 * same spot (true for the middle window of any odd station count, since both
 * sit at `width / 2`), skip the door so the window — the thing that's
 * actually interactive — is what's visible, per the spec's "align every
 * trigger with the visible window" requirement, rather than silently
 * dropping the window to keep decorative geometry.
 */
function drawDoor(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  roofHeight: number,
  palette: BuildingPalette,
  skip: boolean,
): { doorX: number; doorY: number; doorHeight: number } {
  const doorHeight = Math.min(DOOR_HEIGHT, height - roofHeight - 4)
  const doorX = Math.round((width - DOOR_WIDTH) / 2)
  const doorY = height - doorHeight
  if (!skip) {
    fill(ctx, palette.doorFrame, doorX, doorY, DOOR_WIDTH, doorHeight)
    fill(ctx, palette.door, doorX + 2, doorY + 2, DOOR_WIDTH - 4, doorHeight - 2)
    fill(ctx, palette.doorFrame, doorX + DOOR_WIDTH - 6, doorY + Math.round(doorHeight / 2), 2, 2)
  }
  return { doorX, doorY, doorHeight }
}

/** Per-variant roofline and decoration drawn once the shell + windows exist. */
function drawVariantDecoration(
  ctx: CanvasRenderingContext2D,
  variant: BuildingVariant,
  width: number,
  height: number,
  roofHeight: number,
  palette: BuildingPalette,
): void {
  const outline = palette.outline
  switch (variant) {
    case 'cottage': {
      // Vines climbing the corners and a flower box under the sign.
      for (let y = roofHeight + 2; y < height - 4; y += 5) {
        fill(ctx, '#4a7a35', 2, y, 2, 3)
        fill(ctx, '#4a7a35', width - 4, y, 2, 3)
      }
      const boxY = height - 6
      fill(ctx, '#8a5a2b', 6, boxY, width - 12, 4)
      const petals = ['#e88ec0', '#f2d65c', '#9ec9f5']
      for (let x = 8, i = 0; x < width - 8; x += 6, i++) {
        fill(ctx, petals[i % petals.length], x, boxY - 2, 2, 2)
      }
      break
    }
    case 'trainStation': {
      // Flat platform canopy and a clock. The actual track runs in the
      // world above the building's roofline (see `createGame.ts`'s
      // `TRAIN_TRACK_OFFSET`), so the facade carries no rail of its own —
      // drawing one at the base would point at open street where no train
      // ever runs.
      fill(ctx, palette.roofShade, 0, roofHeight, width, 2)
      fill(ctx, '#f4e9c8', width / 2 - 6, 3, 12, 12)
      stroke(ctx, outline, width / 2 - 6, 3, 12, 12)
      fill(ctx, outline, width / 2 - 1, 6, 1, 4)
      fill(ctx, outline, width / 2, 8, 3, 1)
      break
    }
    case 'workshop': {
      // A big gear silhouette and a workbench strip near the base.
      drawIcon(ctx, 'gear', width - 24, roofHeight + 4, 18, palette.roofShade)
      fill(ctx, '#7a6a52', 4, height - 8, width - 8, 4)
      stroke(ctx, outline, 4, height - 8, width - 8, 4)
      break
    }
    case 'schoolhouse': {
      // Bell tower on the peak and a chalkboard strip.
      fill(ctx, palette.roofShade, width / 2 - 5, 0, 10, 6)
      fill(ctx, '#d8cfbe', width / 2 - 2, 1, 4, 3)
      fill(ctx, '#2e2a24', 4, height - 8, width - 8, 5)
      stroke(ctx, '#c9b98a', 4, height - 8, width - 8, 5)
      break
    }
    case 'observatory': {
      // Dome roof cap and a telescope tube leaning off the roofline.
      fill(ctx, palette.roofShade, width / 2 - 10, 0, 20, roofHeight - 2)
      stroke(ctx, outline, width / 2 - 10, 0, 20, roofHeight - 2)
      const stars = ['#f4e9c8', '#cfe6f2']
      fill(ctx, stars[0], 8, 4, 1, 1)
      fill(ctx, stars[1], 16, 8, 1, 1)
      fill(ctx, stars[0], width - 14, 5, 1, 1)
      break
    }
    case 'cyberWorkshop': {
      // A monitor bank glow strip near the top and a warning stripe near base.
      const glowY = roofHeight + 4
      for (let x = 6; x + 8 <= width - 6; x += 18) {
        fill(ctx, '#e88ec0', x, glowY, 8, 5)
        stroke(ctx, outline, x, glowY, 8, 5)
      }
      for (let x = 2; x < width - 2; x += 8) fill(ctx, '#e0a45b', x, height - 5, 4, 3)
      break
    }
    case 'greenhouse': {
      // A proper glasshouse: a pane-gridded glass roof under a ridge beam
      // with a propped vent, glazed end panels down both wall edges, and
      // seedling trays showing through the glass at the base. The pane grid
      // is what really sells it — a flat wash of pale blue reads as a
      // painted roof, while a lattice of small panes reads as glass.
      const glass = '#d7eef7'
      const glassDeep = '#b3d8e8'
      const bar = palette.roofShade

      // Glass field, with the lower courses slightly deeper so the roof
      // reads as a pitched plane catching light at the ridge.
      fill(ctx, glass, 2, 2, width - 4, roofHeight - 4)
      fill(ctx, glassDeep, 2, roofHeight - 8, width - 4, 4)

      // Glazing bars: uprights every 8px, rails every 5px.
      for (let x = 2; x < width - 2; x += 8) fill(ctx, bar, x, 2, 1, roofHeight - 4)
      for (let y = 2; y < roofHeight - 2; y += 5) fill(ctx, bar, 2, y, width - 4, 1)

      // Sheen: two short diagonals across the panes.
      for (let i = 0; i < 5; i++) {
        fill(ctx, '#ffffff', 8 + i, 4 + i, 1, 1)
        fill(ctx, '#ffffff', width - 22 + i, 5 + i, 1, 1)
      }

      // Ridge beam along the very top, with a vent panel propped open on it.
      fill(ctx, bar, 1, 1, width - 2, 2)
      stroke(ctx, outline, 1, 1, width - 2, 2)
      const ventWidth = 18
      const ventX = Math.round(width / 2 - ventWidth / 2) + 14
      fill(ctx, glass, ventX, 0, ventWidth, 4)
      stroke(ctx, outline, ventX, 0, ventWidth, 4)
      fill(ctx, bar, ventX + 2, 4, 2, 3)

      // Glazed end panels down the outer wall edges, clear of the station
      // windows (which sit around the quarter/half/three-quarter marks).
      const panelTop = roofHeight + 2
      const panelHeight = Math.max(6, height - panelTop - 16)
      for (const px of [2, width - 7]) {
        fill(ctx, glass, px, panelTop, 5, panelHeight)
        fill(ctx, bar, px + 2, panelTop, 1, panelHeight)
        for (let y = panelTop + 4; y < panelTop + panelHeight; y += 6) {
          fill(ctx, bar, px, y, 5, 1)
        }
        stroke(ctx, outline, px, panelTop, 5, panelHeight)
      }

      // Seedling trays tucked in the bottom corners, behind the glass.
      for (const tx of [3, width - 14]) {
        const trayY = height - 8
        fill(ctx, '#6b4a30', tx, trayY, 11, 4)
        stroke(ctx, outline, tx, trayY, 11, 4)
        for (let i = 0; i < 3; i++) {
          fill(ctx, '#4f8a3a', tx + 2 + i * 3, trayY - 3, 1, 3)
          fill(ctx, '#6f9a45', tx + 1 + i * 3, trayY - 4, 3, 1)
        }
      }
      break
    }
    case 'postOffice': {
      // Brick chimney with a flared cap — the envelopes for "Send Mail" fly
      // out of its flue, so it needs to read unmistakably as a chimney
      // rather than the plain bar it used to be. `CHIMNEY_*` are shared with
      // `postOfficeChimneyMouth()` below so the animation's spawn point and
      // the drawn flue can never drift apart.
      const stackX = width - CHIMNEY_INSET
      const stackBottom = roofHeight + 3
      const brick = '#8a4a3a'
      const brickShade = darken(brick, 0.7)
      const mortar = '#cbb9a8'

      fill(ctx, brick, stackX, CHIMNEY_TOP, CHIMNEY_WIDTH, stackBottom - CHIMNEY_TOP)
      fill(ctx, brickShade, stackX + CHIMNEY_WIDTH - 3, CHIMNEY_TOP, 3, stackBottom - CHIMNEY_TOP)
      // Mortar courses, with the head joints alternating each row so the
      // brickwork staggers the way real bond does.
      let course = 0
      for (let y = CHIMNEY_TOP + 3; y < stackBottom - 1; y += 3, course++) {
        fill(ctx, mortar, stackX, y, CHIMNEY_WIDTH, 1)
        fill(ctx, mortar, stackX + (course % 2 === 0 ? 3 : 5), y + 1, 1, 2)
      }
      stroke(ctx, outline, stackX, CHIMNEY_TOP, CHIMNEY_WIDTH, stackBottom - CHIMNEY_TOP)

      // Flared cap and the dark flue opening the mail flies out of.
      fill(ctx, brickShade, stackX - 2, CHIMNEY_TOP - 2, CHIMNEY_WIDTH + 4, 3)
      stroke(ctx, outline, stackX - 2, CHIMNEY_TOP - 2, CHIMNEY_WIDTH + 4, 3)
      fill(ctx, '#241c18', stackX + 1, CHIMNEY_TOP - 1, CHIMNEY_WIDTH - 2, 1)

      // Mailbox by the door.
      fill(ctx, '#54748f', 6, height - 14, 6, 10)
      stroke(ctx, outline, 6, height - 14, 6, 10)
      fill(ctx, '#e88ec0', 7, height - 12, 4, 2)
      break
    }
  }
}

/**
 * Draws one themed building facade sized to its footprint on the map, with a
 * facade sign and one distinctly coloured/iconed window per station.
 */
export function createBuildingSprite(
  width: number,
  height: number,
  palette: BuildingPalette,
  variant: BuildingVariant,
  signText: string,
  windows: WindowVisual[],
): SpriteCanvas {
  const ctx = newCanvas(width, height)
  const roofHeight = drawHouseShell(ctx, width, height, palette)

  // A window lands exactly on the door's centre whenever a station sits at
  // `width / 2` — true for the middle window of any odd station count, since
  // both are centred the same way. In that case skip the decorative door
  // rather than the window: see `drawDoor()`'s doc comment.
  const doorCenter = width / 2
  const windowOnDoor = windows.some(
    (_, i) => Math.abs(stationX(i, windows.length, width) - doorCenter) < DOOR_WIDTH / 2 + WINDOW_SIZE / 2,
  )
  const { doorY } = drawDoor(ctx, width, height, roofHeight, palette, windowOnDoor)

  const windowY = roofHeight + Math.max(6, Math.round((doorY - roofHeight - WINDOW_SIZE) / 2) - 6)
  const maxPlaqueWidth = Math.max(24, width / (windows.length + 1) - 4)
  windows.forEach((visual, i) => {
    const x = stationX(i, windows.length, width)
    drawWindow(ctx, x, windowY, visual, palette.outline, palette.window, maxPlaqueWidth)
  })

  drawVariantDecoration(ctx, variant, width, height, roofHeight, palette)
  drawFacadeSign(ctx, width, signText, palette.outline)
  stroke(ctx, palette.outline, 0, 0, width, height)

  return ctx.canvas
}

/**
 * The Growth Farm: a fenced plot area rather than a house. Three planting
 * plots (one per growth station) sit inside a low fence, each with its own
 * coloured marker post, icon, and plaque — a small wooden notice board takes
 * the facade-sign's place.
 */
export function createFarmSprite(
  width: number,
  height: number,
  palette: BuildingPalette,
  signText: string,
  windows: WindowVisual[],
): SpriteCanvas {
  const ctx = newCanvas(width, height)
  const outline = palette.outline
  const soil = '#6b4a30'
  const soilShade = '#5a3d28'

  // Tilled earth fills the whole footprint.
  fill(ctx, soil, 0, 0, width, height)
  for (let y = 6; y < height - 4; y += 6) fill(ctx, soilShade, 2, y, width - 4, 2)

  // Perimeter fence.
  const postGap = 14
  for (let x = 0; x < width; x += postGap) {
    fill(ctx, palette.roofShade, x, 0, 3, height)
  }
  fill(ctx, palette.roof, 0, 4, width, 3)
  fill(ctx, palette.roof, 0, height - 7, width, 3)

  // Notice board, centred at the top like a facade sign.
  drawFacadeSign(ctx, width, signText, outline)

  // Three plots, each with crop rows, a marker post, icon, and plaque. Plaque
  // width is capped to the gap between plot centres so neighbouring plaques
  // can never bleed into each other — long labels wrap to a second line
  // instead of growing sideways.
  const plotY = Math.round(height * 0.32)
  const plotHeight = height - plotY - 16
  const maxPlaqueWidth = Math.max(24, width / (windows.length + 1) - 4)
  windows.forEach((visual, i) => {
    const x = stationX(i, windows.length, width)
    const plotWidth = Math.min(34, width / (windows.length + 1) - 6)
    const plotX = x - plotWidth / 2

    fill(ctx, '#4f6b2f', plotX, plotY, plotWidth, plotHeight)
    stroke(ctx, outline, plotX, plotY, plotWidth, plotHeight)
    for (let cx = plotX + 3; cx < plotX + plotWidth - 2; cx += 5) {
      fill(ctx, '#6f9a45', cx, plotY + 2, 2, plotHeight - 4)
    }

    // Marker post + coloured flag, matching the window convention.
    const postX = x - 1
    fill(ctx, '#8a5a2b', postX, plotY - 10, 2, 10)
    fill(ctx, visual.accent, postX - 4, plotY - 12, 10, 6)
    stroke(ctx, outline, postX - 4, plotY - 12, 10, 6)
    drawIcon(ctx, visual.icon, postX - 3, plotY - 11, 8, outline)

    drawPlaque(ctx, x, plotY + plotHeight + 3, maxPlaqueWidth, visual.plaque, outline)
  })

  // Small feeding-area basket, off to one side, purely decorative here (the
  // interactive feeding animation is a later phase).
  fill(ctx, '#8a5a2b', width - 16, height - 12, 10, 8)
  stroke(ctx, outline, width - 16, height - 12, 10, 8)

  stroke(ctx, outline, 0, 0, width, height)
  return ctx.canvas
}

// ---------------------------------------------------------------------------
// Signposts
// ---------------------------------------------------------------------------

/**
 * A themed signpost: a wooden post holding a coloured board that shows only
 * the location's heading (per spec — no description in the world itself,
 * that lives in the overlay) plus a small icon matching the location.
 *
 * Deliberately compact: signposts sit in the street tile directly below a
 * building, anchored bottom-first like the interaction cue, and the street
 * band only gives about two tiles (32px) of clearance before the building's
 * wall starts. Sized so even a two-line heading fits inside that budget.
 */
export function createSignpostSprite(heading: string, accent: string, icon: IconId): SpriteCanvas {
  const outline = '#1b1410'
  const lineHeight = 6
  const lines = wrapText(heading, 9)
  const widestLine = Math.max(...lines.map((line) => measurePixelText(line, 1)))
  const boardWidth = Math.min(70, Math.max(22, widestLine + 6, 18))
  const boardHeight = 13 + lines.length * lineHeight
  const postHeight = 6
  const width = boardWidth
  const height = boardHeight + postHeight

  const ctx = newCanvas(width, height)

  // Post.
  fill(ctx, '#7a5a35', width / 2 - 2, boardHeight, 4, postHeight)

  // Board.
  fill(ctx, accent, 1, 0, width - 2, boardHeight)
  stroke(ctx, outline, 1, 0, width - 2, boardHeight)
  fill(ctx, '#f4e9c8', 3, 2, width - 6, boardHeight - 4)

  drawIcon(ctx, icon, width / 2 - 4, 2, 8, outline)
  lines.forEach((line, i) => {
    const lineWidth = measurePixelText(line, 1)
    drawPixelText(ctx, line, width / 2 - lineWidth / 2, 11 + i * lineHeight, outline, 1)
  })

  return ctx.canvas
}

// ---------------------------------------------------------------------------
// Incoming Train
// ---------------------------------------------------------------------------

export const TRAIN_WIDTH = 40
export const TRAIN_HEIGHT = 18

/**
 * A small pixel locomotive for the Current Roles Train Station's "Incoming
 * Train" interaction — a boxy maroon cab with a smokestack, two window
 * openings, and four wheels. Purely decorative: `createGame.ts` drives it
 * with no collider, so it can never block the player.
 */
export function createTrainSprite(): SpriteCanvas {
  const ctx = newCanvas(TRAIN_WIDTH, TRAIN_HEIGHT)
  const outline = '#1b1410'
  const body = '#8a3a3a'
  const bodyShade = darken(body, 0.7)
  const trim = '#f4e9c8'
  const glass = '#cfe6f2'
  const wheel = '#2e2a24'
  const stack = '#4a453e'

  // Main body.
  fill(ctx, body, 5, 3, TRAIN_WIDTH - 9, 10)
  fill(ctx, bodyShade, 5, 11, TRAIN_WIDTH - 9, 2)
  // Sloped nose at the front (leading edge when travelling right).
  fill(ctx, body, 1, 5, 5, 8)
  fill(ctx, bodyShade, 1, 11, 5, 2)
  fill(ctx, outline, 0, 6, 1, 6)

  // Smokestack near the front.
  fill(ctx, stack, 9, 0, 3, 4)
  fill(ctx, outline, 9, 0, 3, 1)

  // Two cab windows.
  fill(ctx, trim, 15, 4, 8, 6)
  fill(ctx, glass, 16, 5, 6, 4)
  fill(ctx, trim, 26, 4, 8, 6)
  fill(ctx, glass, 27, 5, 6, 4)

  // Trim stripe along the base of the body.
  fill(ctx, trim, 5, 10, TRAIN_WIDTH - 9, 1)

  // Wheels along the bottom edge.
  for (let x = 4; x + 4 <= TRAIN_WIDTH - 4; x += 11) {
    fill(ctx, wheel, x, TRAIN_HEIGHT - 4, 4, 4)
  }

  stroke(ctx, outline, 1, 3, TRAIN_WIDTH - 2, TRAIN_HEIGHT - 7)

  return ctx.canvas
}

/** Visual height of the world track laid by `createRailSprite`. */
export const RAIL_HEIGHT = 6

/**
 * A horizontal track — two rails and evenly-spaced sleepers — sized to span
 * the full width of the world. Always present above the train station (see
 * `TRAIN_TRACK_OFFSET` in `createGame.ts`), whether or not a train is
 * currently running, so the Incoming Train interaction has visible track to
 * arrive on rather than crossing bare grass.
 */
export function createRailSprite(width: number): SpriteCanvas {
  const ctx = newCanvas(width, RAIL_HEIGHT)
  const sleeper = '#6b4a30'
  const rail = '#8a8a86'
  const railShade = '#5a5a56'

  for (let x = 0; x + 4 <= width; x += 10) {
    fill(ctx, sleeper, x, 0, 4, RAIL_HEIGHT)
  }
  fill(ctx, rail, 0, 1, width, 1)
  fill(ctx, rail, 0, RAIL_HEIGHT - 2, width, 1)
  fill(ctx, railShade, 0, 2, width, 1)
  fill(ctx, railShade, 0, RAIL_HEIGHT - 1, width, 1)

  return ctx.canvas
}

// ---------------------------------------------------------------------------
// Interaction cue
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Drop Feed
// ---------------------------------------------------------------------------

const FEED_PILE_WIDTH = 14
const FEED_PILE_HEIGHT = 10

/**
 * The small feed pile dropped in the Growth Farm's feeding area for the
 * "Drop Feed" interaction — a shallow basket of scattered grain. Purely
 * decorative: `createGame.ts` adds and removes it with no collider, the same
 * way the train has none.
 */
export function createFeedPileSprite(): SpriteCanvas {
  const ctx = newCanvas(FEED_PILE_WIDTH, FEED_PILE_HEIGHT)
  const outline = '#1b1410'
  const basket = '#8a5a2b'
  const basketShade = darken(basket, 0.75)
  const grain = '#e0a45b'
  const grainLight = '#f2d65c'

  fill(ctx, basket, 1, 4, FEED_PILE_WIDTH - 2, FEED_PILE_HEIGHT - 4)
  fill(ctx, basketShade, 1, FEED_PILE_HEIGHT - 3, FEED_PILE_WIDTH - 2, 2)
  stroke(ctx, outline, 1, 4, FEED_PILE_WIDTH - 2, FEED_PILE_HEIGHT - 4)

  const grains: [number, number, string][] = [
    [3, 2, grainLight],
    [6, 1, grain],
    [9, 2, grainLight],
    [4, 4, grain],
    [8, 4, grainLight],
    [6, 3, grain],
  ]
  for (const [x, y, color] of grains) fill(ctx, color, x, y, 2, 2)

  return ctx.canvas
}

// ---------------------------------------------------------------------------
// Send Mail
// ---------------------------------------------------------------------------

export const ENVELOPE_WIDTH = 9
export const ENVELOPE_HEIGHT = 7

/**
 * A small pixel envelope for the Contact Post Office's "Send Mail"
 * interaction: a cream card with a darker flap crease and a stamp corner.
 * Decorative only — `createGame.ts` flies these out of the chimney and
 * destroys them, and nothing here sends any actual mail.
 */
export function createEnvelopeSprite(): SpriteCanvas {
  const ctx = newCanvas(ENVELOPE_WIDTH, ENVELOPE_HEIGHT)
  const outline = '#1b1410'
  const paper = '#f4e9c8'
  const crease = '#d8cfbe'
  const stamp = '#e88ec0'

  fill(ctx, paper, 0, 0, ENVELOPE_WIDTH, ENVELOPE_HEIGHT)
  stroke(ctx, outline, 0, 0, ENVELOPE_WIDTH, ENVELOPE_HEIGHT)

  // Flap: a shallow V creased down from the top two corners.
  fill(ctx, crease, 1, 1, 2, 1)
  fill(ctx, crease, 2, 2, 2, 1)
  fill(ctx, crease, 3, 3, 3, 1)
  fill(ctx, crease, 5, 2, 2, 1)
  fill(ctx, crease, 6, 1, 2, 1)

  // Stamp corner.
  fill(ctx, stamp, ENVELOPE_WIDTH - 3, 1, 2, 2)

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
