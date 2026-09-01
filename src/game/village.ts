/**
 * The village map.
 *
 * Edit this in any text editor — it is plain ASCII. Every row MUST be the same
 * length; `assertMapIsRectangular()` throws loudly in dev if you break that.
 *
 * Legend
 *   .  grass (walkable, no object is created — the background colour shows through)
 *   ,  stone/dirt path (walkable)
 *   P  player spawn point (walkable, renders as path)
 *   ~  water (solid)
 *   T  tree (solid)
 *   +  signpost (solid)
 *   L  Library            -> education
 *   H  Cozy House         -> about
 *   B  Tech Lab           -> projects
 *   S  Security Center    -> security
 *   G  Trophy Garden      -> achievements
 *   C  Chicken pen        -> ambience
 *   M  Town Hall          -> experience
 *   X  Mailbox            -> contact
 */

/** Size of one tile, in world pixels. Sprites are authored at this size. */
export const TILE_SIZE = 16

/** The symbol that marks where the player starts. */
export const SPAWN_SYMBOL = 'P'

export const MAP: string[] = [
  '~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~',
  '~~TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT~~',
  '~~T..........................................T~~',
  '~~T....................+.....................T~~',
  '~~T..........................................T~~',
  '~~T..LLLLLLL..HHHHHHHH..BBBBBBBBBB..SSSSSSSSST~~',
  '~~T..LLLLLLL..HHHHHHHH..BBBBBBBBBB..SSSSSSSSST~~',
  '~~T..LLLLLLL..HHHHHHHH..BBBBBBBBBB..SSSSSSSSST~~',
  '~~T..LLLLLLL..HHHHHHHH..BBBBBBBBBB..SSSSSSSSST~~',
  '~~T..LLLLLLL..HHHHHHHH..BBBBBBBBBB..SSSSSSSSST~~',
  '~~T..........................................T~~',
  '~~T,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,T~~',
  '~~T,,,,,,,,,,,,,,,,,,,,P,,,,,,,,,,,,,,,,,,,,,T~~',
  '~~T..........................................T~~',
  '~~T.GGGGGGGG...CCCCCCCC...MMMMMMMM...XXXXXX..T~~',
  '~~T.GGGGGGGG...CCCCCCCC...MMMMMMMM...XXXXXX..T~~',
  '~~T.GGGGGGGG...CCCCCCCC...MMMMMMMM...XXXXXX..T~~',
  '~~T.GGGGGGGG...CCCCCCCC...MMMMMMMM...XXXXXX..T~~',
  '~~T..........................................T~~',
  '~~T..........................................T~~',
  '~~TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT~~',
  '~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~',
  '~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~',
]

/** Colour of the ground the whole map sits on. Grass tiles draw no object. */
export const GRASS_COLOR = '#63a34a'

export interface TileSpec {
  /** Fill colour of the placeholder rectangle. */
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
  '+': { color: '#8a5a2b', solid: true, label: 'Signpost' },
  ',': { color: '#c8b184', solid: false, label: 'Path' },
  P: { color: '#c8b184', solid: false, label: 'Path' },
  L: { color: '#7a5230', solid: true, label: 'Library' },
  H: { color: '#b5651d', solid: true, label: 'Cozy House' },
  B: { color: '#4a5568', solid: true, label: 'Tech Lab' },
  S: { color: '#5b3a5b', solid: true, label: 'Security Center' },
  G: { color: '#8a6d3b', solid: true, label: 'Trophy Garden' },
  C: { color: '#a98b5d', solid: true, label: 'Chicken Pen' },
  M: { color: '#6b4f2a', solid: true, label: 'Town Hall' },
  X: { color: '#45607a', solid: true, label: 'Mailbox' },
}

/** World size in pixels, derived from the map so the two can never disagree. */
export const WORLD_WIDTH = MAP[0].length * TILE_SIZE
export const WORLD_HEIGHT = MAP.length * TILE_SIZE

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
