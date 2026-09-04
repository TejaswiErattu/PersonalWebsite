/**
 * The village map.
 *
 * Edit this in any text editor — it is plain ASCII. Every row MUST be the same
 * length; `assertMapIsRectangular()` throws loudly in dev if you break that.
 *
 * A clean 3x3 grid of nine locations, each a 9x5-tile block, connected by a
 * grid of generous paths: a horizontal street below each building row and a
 * vertical street beside each building column, so every district is reachable
 * by walking straight toward it from the spawn point at the centre.
 *
 * Legend
 *   .  grass (walkable, no object is created — the background colour shows through)
 *   ,  stone path (walkable) — narrow 3-tile-wide walkways, not wide plazas
 *   v  flowerbed (walkable) — borders every path and softens the greenhouse yard
 *   b  bush (walkable) — low landscaping, never blocks a route
 *   k  planting bed (walkable) — tended soil rows, greenhouse yard only
 *   P  player spawn point (walkable, renders as path)
 *   ~  water (solid)
 *   T  tree (solid)
 *   1  signpost — About Me Flower Cottage
 *   2  signpost — Current Roles Train Station
 *   3  signpost — Engineering Workshop
 *   4  signpost — AI & Teaching Schoolhouse
 *   5  signpost — Mobile Innovation Observatory
 *   6  signpost — Developer Tools Cyber Workshop
 *   7  signpost — Community Impact Greenhouse
 *   8  signpost — Growth Farm
 *   9  signpost — Contact Post Office
 *   A  About Me Flower Cottage       -> about
 *   R  Current Roles Train Station   -> experience (current)
 *   E  Engineering Workshop          -> experience (past)
 *   S  AI & Teaching Schoolhouse     -> experience (past) + achievements
 *   O  Mobile Innovation Observatory -> projects
 *   D  Developer Tools Cyber Workshop -> projects
 *   G  Community Impact Greenhouse   -> projects
 *   F  Growth Farm                   -> growth
 *   X  Contact Post Office           -> contact
 */

/** Size of one tile, in world pixels. Sprites are authored at this size. */
export const TILE_SIZE = 16

/** The symbol that marks where the player starts. */
export const SPAWN_SYMBOL = 'P'

export const MAP: string[] = [
  '~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~',
  '~~TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT~~',
  '~~T...........v,,,v.........v,,,v...........T~~',
  '~~T...........v,,,v.........v,,,v...........T~~',
  '~~T..AAAAAAAAAv,,,vRRRRRRRRRv,,,vEEEEEEEEE..T~~',
  '~~T..AAAAAAAAAv,,,vRRRRRRRRRv,,,vEEEEEEEEE..T~~',
  '~~T..AAAAAAAAAv,,,vRRRRRRRRRv,,,vEEEEEEEEE..T~~',
  '~~T..AAAAAAAAAv,,,vRRRRRRRRRv,,,vEEEEEEEEE..T~~',
  '~~T..AAAAAAAAAv,,,vRRRRRRRRRv,,,vEEEEEEEEE..T~~',
  '~~T.....P.....v,,,v.........v,,,v...........T~~',
  '~~T......1....v,,,v....2....v,,,v....3......T~~',
  '~~T...........v,,,v.........v,,,v...........T~~',
  '~~T...........v,,,v.........v,,,v...........T~~',
  '~~T...........v,,,v.........v,,,v...........T~~',
  '~~T..SSSSSSSSSv,,,vOOOOOOOOOv,,,vDDDDDDDDD..T~~',
  '~~T..SSSSSSSSSv,,,vOOOOOOOOOv,,,vDDDDDDDDD..T~~',
  '~~T..SSSSSSSSSv,,,vOOOOOOOOOv,,,vDDDDDDDDD..T~~',
  '~~T..SSSSSSSSSv,,,vOOOOOOOOOv,,,vDDDDDDDDD..T~~',
  '~~T..SSSSSSSSSv,,,vOOOOOOOOOv,,,vDDDDDDDDD..T~~',
  '~~T...........v,,,v.........v,,,v...........T~~',
  '~~T......4....v,,,v....5....v,,,v....6......T~~',
  '~~T...........v,,,v.........v,,,v...........T~~',
  '~~T...........v,,,v.........v,,,v...........T~~',
  '~~T.bvvb.bvvbTv,,,v.........v,,,v...........T~~',
  '~~T..bkkkkkkkbv,,,vFFFFFFFFFv,,,vXXXXXXXXX..T~~',
  '~~T..bGGGGGGGbv,,,vFFFFFFFFFv,,,vXXXXXXXXX..T~~',
  '~~TT.bGGGGGGGbv,,,vFFFFFFFFFv,,,vXXXXXXXXX..T~~',
  '~~T..bGGGGGGGbv,,,vFFFFFFFFFv,,,vXXXXXXXXX..T~~',
  '~~TT.bGGGGGGGbv,,,vFFFFFFFFFv,,,vXXXXXXXXX..T~~',
  '~~T...........v,,,v.........v,,,v...........T~~',
  '~~T......7....v,,,v....8....v,,,v....9......T~~',
  '~~TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT~~',
  '~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~',
]

/** Colour of the ground the whole map sits on. Grass tiles draw no object. */
export const GRASS_COLOR = '#63a34a'

export interface TileSpec {
  /** Fill colour of the tile's rectangle. */
  color: string
  /** Whether the player collides with it. */
  solid: boolean
  /** Human-readable name, used later for interactions and for debugging. */
  label: string
}

/**
 * Every non-grass symbol. Symbols missing from here are treated as grass and
 * produce no game object at all, which keeps the object count low.
 */
export const TILES: Record<string, TileSpec> = {
  '~': { color: '#3f72a4', solid: true, label: 'Water' },
  T: { color: '#2f6b3a', solid: true, label: 'Tree' },
  ',': { color: '#c8b184', solid: false, label: 'Path' },
  P: { color: '#c8b184', solid: false, label: 'Path' },
  // Drawn as sprites (a stone-path texture, a flower cluster, a small bush)
  // rather than the flat colour these fallback specs describe — see
  // `buildLevel()` in `createGame.ts`. The colours here only matter if that
  // sprite ever fails to load.
  v: { color: '#e88ec0', solid: false, label: 'Flowerbed' },
  b: { color: '#3f7a3f', solid: false, label: 'Bush' },
  k: { color: '#6b4a30', solid: false, label: 'Planting Bed' },
  // Signposts sit in the open street bands or yard margins, never in a
  // single-tile-wide gap, so there is no need for them to stay solid the way
  // the old map's narrow-gap signposts did — but keeping them non-solid costs
  // nothing and means a player can stand exactly on one without a collision
  // surprise.
  '1': { color: '#8a5a2b', solid: false, label: 'Signpost' },
  '2': { color: '#8a5a2b', solid: false, label: 'Signpost' },
  '3': { color: '#8a5a2b', solid: false, label: 'Signpost' },
  '4': { color: '#8a5a2b', solid: false, label: 'Signpost' },
  '5': { color: '#8a5a2b', solid: false, label: 'Signpost' },
  '6': { color: '#8a5a2b', solid: false, label: 'Signpost' },
  '7': { color: '#8a5a2b', solid: false, label: 'Signpost' },
  '8': { color: '#8a5a2b', solid: false, label: 'Signpost' },
  '9': { color: '#8a5a2b', solid: false, label: 'Signpost' },
  A: { color: '#c9834a', solid: true, label: 'About Me Flower Cottage' },
  R: { color: '#5b6b7a', solid: true, label: 'Current Roles Train Station' },
  E: { color: '#5d6b80', solid: true, label: 'Engineering Workshop' },
  S: { color: '#9a6b40', solid: true, label: 'AI & Teaching Schoolhouse' },
  O: { color: '#4a4a7a', solid: true, label: 'Mobile Innovation Observatory' },
  D: { color: '#3a2f4a', solid: true, label: 'Developer Tools Cyber Workshop' },
  G: { color: '#7ea8c4', solid: true, label: 'Community Impact Greenhouse' },
  F: { color: '#8a9a5a', solid: true, label: 'Growth Farm' },
  X: { color: '#54748f', solid: true, label: 'Contact Post Office' },
}

/** World size in pixels, derived from the map so the two can never disagree. */
export const WORLD_WIDTH = MAP[0].length * TILE_SIZE
export const WORLD_HEIGHT = MAP.length * TILE_SIZE

/**
 * Minimum centre-to-centre distance, in world pixels, between two station
 * triggers inside the same multi-station building. Below this the player
 * (a 16px-wide sprite) cannot reliably stand in front of one station without
 * also being within a neighbour's radius — `InteractionRegistry.nearest()`
 * still resolves that correctly, but the player has no way to aim for a
 * specific one. Every building in the current map is 9 tiles (144px) wide,
 * which clears this for up to four stations (144 / 5 = 28.8px); widen a
 * building's block if it ever needs more. `assertStationSpacing()` in
 * `locations.ts` enforces it at boot, the same way `assertMapIsRectangular`
 * enforces the map shape below.
 */
export const MIN_STATION_SPACING = 24

/**
 * Guards against the single easiest way to break an ASCII map: a row that is
 * one character too short. Called once at game start.
 */
export function assertMapIsRectangular(): void {
  const width = MAP[0].length
  MAP.forEach((row, y) => {
    if (row.length !== width) {
      throw new Error(
        `village map row ${y} is ${row.length} chars, expected ${width}. Fix src/game/village.ts.`,
      )
    }
  })
}

/** Finds the spawn tile and returns its centre in world pixels. */
export function findSpawnPoint(): { x: number; y: number } {
  for (let y = 0; y < MAP.length; y++) {
    const x = MAP[y].indexOf(SPAWN_SYMBOL)
    if (x !== -1) {
      return { x: x * TILE_SIZE + TILE_SIZE / 2, y: y * TILE_SIZE + TILE_SIZE / 2 }
    }
  }
  throw new Error(`No '${SPAWN_SYMBOL}' spawn tile found in the village map.`)
}

/** A block of tiles, in tile coordinates. */
export interface TileRect {
  col: number
  row: number
  cols: number
  rows: number
}

/**
 * The bounding box of every tile using `symbol`, or null if the map has none.
 *
 * Building footprints are drawn as solid blocks of one letter, so the bounding
 * box is the building. Deriving it from the map means moving or resizing a
 * building is an edit to the ASCII art and nothing else — the sprite, the
 * collision and the door trigger all follow automatically.
 */
export function findTileRect(symbol: string): TileRect | null {
  let minCol = Infinity
  let minRow = Infinity
  let maxCol = -1
  let maxRow = -1

  for (let row = 0; row < MAP.length; row++) {
    for (let col = 0; col < MAP[row].length; col++) {
      if (MAP[row][col] !== symbol) continue
      if (col < minCol) minCol = col
      if (col > maxCol) maxCol = col
      if (row < minRow) minRow = row
      if (row > maxRow) maxRow = row
    }
  }

  if (maxCol === -1) return null
  return { col: minCol, row: minRow, cols: maxCol - minCol + 1, rows: maxRow - minRow + 1 }
}
