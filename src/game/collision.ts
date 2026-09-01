import { MAP, TILES, TILE_SIZE } from './village'

/**
 * Grid collision.
 *
 * Kaplay's `body()` physics resolves overlaps with a minimum-translation
 * vector. For a small top-down hit box walking into 16px tiles that is
 * unreliable: once the box's centre passes a tile's centre the shortest way
 * out is the *far* side, so the player pops through walls.
 *
 * The village is a uniform grid, so we don't need a physics engine at all.
 * Testing the destination against the map is exact, cheap, cannot tunnel, and
 * gives us wall-sliding for free by resolving each axis separately. It also
 * means the 600+ map tiles are pure visuals with no colliders attached.
 */

/**
 * The player's collision box, in world pixels, relative to the sprite centre.
 * Only the feet collide, so the character can overlap the base of a building
 * without snagging on it.
 */
export const PLAYER_BOX = {
  halfWidth: 4.5,
  halfHeight: 3,
  /** Push the box down from the sprite centre towards the feet. */
  offsetY: 5,
}

const ROW_COUNT = MAP.length
const COL_COUNT = MAP[0].length

/** Nudge box edges inwards so a box that merely touches a tile edge is free. */
const EDGE_EPSILON = 0.001

/** Is this tile coordinate solid? Anything outside the map counts as solid. */
export function isSolidTile(col: number, row: number): boolean {
  if (row < 0 || row >= ROW_COUNT || col < 0 || col >= COL_COUNT) return true
  const spec = TILES[MAP[row][col]]
  return spec !== undefined && spec.solid
}

/**
 * Could the player stand with their sprite centred on this world position?
 * Every tile the hit box overlaps is checked, so this stays correct even if the
 * box is later made bigger than a single tile.
 */
export function canStandAt(x: number, y: number): boolean {
  const centerY = y + PLAYER_BOX.offsetY

  const left = x - PLAYER_BOX.halfWidth + EDGE_EPSILON
  const right = x + PLAYER_BOX.halfWidth - EDGE_EPSILON
  const top = centerY - PLAYER_BOX.halfHeight + EDGE_EPSILON
  const bottom = centerY + PLAYER_BOX.halfHeight - EDGE_EPSILON

  const firstCol = Math.floor(left / TILE_SIZE)
  const lastCol = Math.floor(right / TILE_SIZE)
  const firstRow = Math.floor(top / TILE_SIZE)
  const lastRow = Math.floor(bottom / TILE_SIZE)

  for (let row = firstRow; row <= lastRow; row++) {
    for (let col = firstCol; col <= lastCol; col++) {
      if (isSolidTile(col, row)) return false
    }
  }
  return true
}
