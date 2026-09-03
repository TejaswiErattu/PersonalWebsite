/**
 * Ambient life: wandering chickens, flower clusters and drifting motes.
 *
 * None of this is interactive and none of it affects collision — it exists so
 * the village looks inhabited rather than like a diagram. It is therefore also
 * the first thing to switch off when someone asks for reduced motion: under
 * that setting the chickens stand still and the motes are never spawned at
 * all, leaving the flowers, which never moved in the first place.
 *
 * Placement is driven by a seeded PRNG rather than `Math.random`, so the
 * village looks the same on every load. A field of flowers that rearranges
 * itself each refresh reads as a bug, not as variety.
 */

import type { GameObj, KAPLAYCtx } from 'kaplay'

import { canStandAt, isSolidTile } from './collision'
import { MAP, TILE_SIZE, WORLD_HEIGHT, WORLD_WIDTH } from './village'
import {
  CHICKEN_FRAMES_PER_ROW,
  FLOWER_VARIANTS,
  IDLE_FRAME_BY_FACING,
  createChickenSpriteSheet,
  createFlowerSprite,
  createMoteSprite,
} from './worldSprites'

/**
 * Draw order. `createGame` owns the ladder: tiles 0, buildings 1, player 10,
 * cue 20. Flowers tuck under the buildings, chickens walk behind the player so
 * they can never hide them, and motes float over the world but under the cue.
 */
/** Exported so `createGame.ts`'s "Plant More" flowers match ambient ones. */
export const FLOWER_Z = 0.5
const CHICKEN_Z = 9
const MOTE_Z = 15

/** Symbol for a plain grass tile — the only place scenery is allowed to sit. */
const GRASS = '.'

const CHICKEN_COUNT = 7
const FLOWER_COUNT = 26
const MOTE_COUNT = 18

/** Chicken walking speed, in world px/sec. Deliberately a third of the player's. */
const CHICKEN_SPEED = 22
/** How far a chicken will stray from where it was placed, in world pixels. */
const CHICKEN_ROAM_RADIUS = 44

/** Seconds a chicken stands still / keeps walking before re-deciding. */
const IDLE_SECONDS: [number, number] = [0.9, 2.8]
const WALK_SECONDS: [number, number] = [0.4, 1.3]

/**
 * "Drop Feed" tuning. Chickens run to the pile, peck for a few seconds, then
 * walk back to their own patch and pick up normal wandering there.
 *
 * The walk home is a real pathfound trip rather than a mode flip: the wander
 * behaviour steers by straight-line direction and only reverses when it hits
 * a wall, so a chicken left standing at the farm — a whole village away from
 * its `homeX/homeY` — would jitter against the nearest building forever
 * instead of getting anywhere.
 */
const CHICKEN_FEED_SPEED = 90
/** Unhurried walk back afterwards, so the return reads as strolling, not fleeing. */
const CHICKEN_RETURN_SPEED = 46
const FEED_PECK_SECONDS = 3.2

/**
 * Every chicken gets its own travel budget, sized from the length of the
 * path it was actually handed (`distance / speed`, plus slack for the
 * per-waypoint easing). A single fixed timeout cannot work here: chickens
 * are scattered over the whole map, so their routes to the farm range from
 * a couple of tiles to fifty, and any one number is either far too short for
 * the far ones (they stop mid-journey and peck at bare grass) or pointlessly
 * long for the near ones. The budget is only ever a stall guard — a chicken
 * that reaches its last waypoint moves on immediately.
 */
const FEED_TRAVEL_SLACK = 1.5
const FEED_TRAVEL_MIN_SECONDS = 1
/** Absolute ceiling on any single leg, so a pathological route can't hang a chicken. */
const FEED_TRAVEL_CEILING = 20

/**
 * Where each of the seven chickens gathers around the feed pile, as an
 * offset from the pile's centre. Fixed and hand-placed (not randomised) so
 * no two chickens are ever assigned the exact same spot, matching the rest
 * of this village's seeded-not-random decoration philosophy. Indexed by a
 * chicken's position in the `chickens` array, wrapping with `%` as a
 * safety net if `CHICKEN_COUNT` ever changes.
 *
 * `createGame.ts` places the pile on the open street tile immediately south
 * of the farm, so every `dy` here is biased at or below 0 — a large negative
 * offset would land back inside the farm's own (solid) footprint, which
 * `findPath` would then have to route around rather than actually reach.
 */
const FEED_GATHER_OFFSETS: readonly { dx: number; dy: number }[] = [
  { dx: 0, dy: -2 },
  { dx: 13, dy: 2 },
  { dx: -13, dy: 2 },
  { dx: 9, dy: 10 },
  { dx: -9, dy: 10 },
  { dx: 20, dy: 5 },
  { dx: -20, dy: 5 },
]

/** Mote drift, in world px/sec, and how far they sway side to side. */
const MOTE_RISE = 9
const MOTE_SWAY = 6
const MOTE_SWAY_SPEED = 0.8

/**
 * Deterministic PRNG (mulberry32). Small, fast, and good enough for scattering
 * decorations — the point is only that it produces the same sequence every
 * time from the same seed.
 */
function createRng(seed: number): () => number {
  let state = seed >>> 0
  return () => {
    state = (state + 0x6d2b79f5) >>> 0
    let t = state
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Every plain-grass tile centre, in world pixels. */
function grassTileCentres(): { x: number; y: number }[] {
  const spots: { x: number; y: number }[] = []
  for (let row = 0; row < MAP.length; row++) {
    for (let col = 0; col < MAP[row].length; col++) {
      if (MAP[row][col] !== GRASS) continue
      spots.push({
        x: col * TILE_SIZE + TILE_SIZE / 2,
        y: row * TILE_SIZE + TILE_SIZE / 2,
      })
    }
  }
  return spots
}

/**
 * Fisher-Yates, driven by the seeded RNG. Shuffling and taking a prefix is how
 * scenery gets distinct positions — sampling with replacement would stack two
 * flower clusters on one tile often enough to notice.
 */
function shuffle<T>(items: T[], rng: () => number): T[] {
  const out = items.slice()
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

function between(rng: () => number, [min, max]: [number, number]): number {
  return min + rng() * (max - min)
}

/**
 * One chicken's current behaviour. `wander` is the default ambient
 * strolling; `seeking`, `pecking` and `returning` are the three legs of a
 * feeding trip, driven entirely by `feedChickens()` — see the "Drop Feed"
 * section below.
 */
type ChickenMode = 'wander' | 'seeking' | 'pecking' | 'returning'

interface Chicken {
  obj: GameObj
  homeX: number
  homeY: number
  /** Seconds left before this chicken re-decides what to do (wander mode), or before its current feed phase (seeking/pecking) ends. */
  timer: number
  walking: boolean
  dirX: number
  dirY: number
  facing: 'right' | 'left'
  mode: ChickenMode
  /** Waypoints left to walk while `mode === 'seeking'`, tile centres plus the final personal gather point. */
  path: { x: number; y: number }[]
  pathIndex: number
}

/** What `buildScenery` hands back for the game loop to drive. */
export interface Scenery {
  /** Advances the chickens and motes. No-op under reduced motion. */
  update: (dt: number, time: number) => void
  /**
   * Sends every chicken toward the feed pile at `(pileX, pileY)`: each runs
   * to its own waypoint around the pile, pecks for a few seconds, then walks
   * back to its own patch and resumes normal wandering there. Under reduced
   * motion the run is skipped — chickens appear already gathered in a static
   * pecking pose. Safe to call repeatedly; a chicken mid-sequence simply
   * gets re-routed to the new pile.
   *
   * Returns how many seconds the gathering lasts (the slowest chicken's run
   * plus the peck), so the caller can keep the feed pile on screen for
   * exactly as long as there is something eating from it. The walk home
   * happens after that and needs no pile.
   */
  feedChickens: (pileX: number, pileY: number) => number
}

// ---------------------------------------------------------------------------
// Grid pathfinding — "Drop Feed" chickens use this to reach the feed pile
// without getting stuck behind a building, per the redesign spec's "use
// lightweight grid-based pathfinding or safe walkable waypoints" requirement.
// A 4-directional BFS over the map's tiles is more than enough: the grid is
// only ~1,600 cells, and this only ever runs a handful of times (once per
// chicken, once per "Drop Feed" click).
// ---------------------------------------------------------------------------

function tileOf(x: number, y: number): { col: number; row: number } {
  return { col: Math.floor(x / TILE_SIZE), row: Math.floor(y / TILE_SIZE) }
}

/** Total walking distance of a path, in world pixels, starting from `(x, y)`. */
function pathDistance(x: number, y: number, path: { x: number; y: number }[]): number {
  let total = 0
  let fromX = x
  let fromY = y
  for (const point of path) {
    total += Math.hypot(point.x - fromX, point.y - fromY)
    fromX = point.x
    fromY = point.y
  }
  return total
}

/**
 * How long to allow for walking `path` at `speed` before giving up on it —
 * the real travel time plus slack. See `FEED_TRAVEL_SLACK` above for why
 * this is computed per chicken rather than being one shared constant.
 */
function travelBudget(distance: number, speed: number): number {
  const seconds = (distance / speed) * FEED_TRAVEL_SLACK
  return Math.min(FEED_TRAVEL_CEILING, Math.max(FEED_TRAVEL_MIN_SECONDS, seconds))
}

function tileCenter(col: number, row: number): { x: number; y: number } {
  return { x: col * TILE_SIZE + TILE_SIZE / 2, y: row * TILE_SIZE + TILE_SIZE / 2 }
}

/**
 * The nearest walkable tile to `(col, row)`, spiralling outward ring by ring.
 * Returns the tile itself when it's already open. A feed-pile offset can
 * occasionally land inside a wall (a wide gather offset against a building
 * corner); this is what turns that into "the closest open ground" instead of
 * an unreachable pathfinding target.
 */
function nearestWalkableTile(col: number, row: number): { col: number; row: number } {
  if (!isSolidTile(col, row)) return { col, row }
  for (let radius = 1; radius <= 6; radius++) {
    for (let dRow = -radius; dRow <= radius; dRow++) {
      for (let dCol = -radius; dCol <= radius; dCol++) {
        if (Math.max(Math.abs(dRow), Math.abs(dCol)) !== radius) continue
        const c = col + dCol
        const r = row + dRow
        if (!isSolidTile(c, r)) return { col: c, row: r }
      }
    }
  }
  // Every nearby tile is solid (shouldn't happen anywhere on this map) —
  // fall back to the original tile rather than searching forever.
  return { col, row }
}

/**
 * A 4-directional breadth-first path from `(startX, startY)` to `(goalX,
 * goalY)`, as a list of waypoints in world pixels. Only orthogonal steps are
 * considered, so consecutive waypoints share an edge and a straight line
 * between them can never cut a solid tile's corner.
 *
 * The final waypoint is the exact `(goalX, goalY)` point rather than that
 * tile's centre, so a chicken ends up precisely on its own gather spot
 * instead of stacked with siblings on the same tile centre. If no path
 * exists at all (unreachable, which shouldn't happen on this fully-connected
 * map), the chicken is handed a single direct waypoint as a fallback rather
 * than nothing.
 */
function findPath(
  startX: number,
  startY: number,
  goalX: number,
  goalY: number,
): { x: number; y: number }[] {
  const startTile = tileOf(startX, startY)
  const start = nearestWalkableTile(startTile.col, startTile.row)
  const goalTileRaw = tileOf(goalX, goalY)
  const goal = nearestWalkableTile(goalTileRaw.col, goalTileRaw.row)

  if (start.col === goal.col && start.row === goal.row) {
    return [{ x: goalX, y: goalY }]
  }

  const key = (col: number, row: number): string => `${col},${row}`
  const visited = new Set<string>([key(start.col, start.row)])
  const parent = new Map<string, { col: number; row: number }>()
  const queue: { col: number; row: number }[] = [start]
  let found = false

  while (queue.length > 0) {
    const current = queue.shift()!
    if (current.col === goal.col && current.row === goal.row) {
      found = true
      break
    }
    const neighbors = [
      { col: current.col + 1, row: current.row },
      { col: current.col - 1, row: current.row },
      { col: current.col, row: current.row + 1 },
      { col: current.col, row: current.row - 1 },
    ]
    for (const next of neighbors) {
      if (isSolidTile(next.col, next.row)) continue
      const nextKey = key(next.col, next.row)
      if (visited.has(nextKey)) continue
      visited.add(nextKey)
      parent.set(nextKey, current)
      queue.push(next)
    }
  }

  if (!found) return [{ x: goalX, y: goalY }]

  const tiles: { col: number; row: number }[] = [goal]
  let cursor = key(goal.col, goal.row)
  const startKey = key(start.col, start.row)
  while (cursor !== startKey) {
    const prev = parent.get(cursor)
    if (!prev) break
    tiles.push(prev)
    cursor = key(prev.col, prev.row)
  }
  tiles.reverse()

  const waypoints = tiles.map(({ col, row }) => tileCenter(col, row))
  // Land exactly on the requested point only when it's actually walkable —
  // a wide gather offset can fall inside a solid tile (a building wall just
  // past its edge), in which case `goal` was already snapped to the nearest
  // open tile above, and the chicken should stop at that tile's centre
  // instead of being walked back into the wall.
  if (!isSolidTile(goalTileRaw.col, goalTileRaw.row)) {
    waypoints[waypoints.length - 1] = { x: goalX, y: goalY }
  }
  return waypoints
}

export interface SceneryOptions {
  /** When true nothing moves: chickens stand, motes are not created. */
  reducedMotion: boolean
}

/** Registers the sprite sheets. Must run before `buildScenery`. */
export function loadScenerySprites(k: KAPLAYCtx): void {
  k.loadSprite('chicken', createChickenSpriteSheet(), {
    sliceX: CHICKEN_FRAMES_PER_ROW,
    sliceY: 2,
    anims: {
      'peck-right': { from: 0, to: 1, loop: true, speed: 6 },
      'peck-left': { from: 2, to: 3, loop: true, speed: 6 },
    },
  })

  for (let variant = 0; variant < FLOWER_VARIANTS; variant++) {
    k.loadSprite(`flower-${variant}`, createFlowerSprite(variant))
  }

  k.loadSprite('mote', createMoteSprite())
}

/**
 * Scatters the scenery and returns the per-frame update for the moving parts.
 *
 * Call after `onLoad`, so the sprite sheets are decoded and the chickens can
 * play their animation immediately.
 */
export function buildScenery(k: KAPLAYCtx, options: SceneryOptions): Scenery {
  const rng = createRng(0x5eed)
  const open = shuffle(grassTileCentres(), rng)

  // Flowers and chickens draw from the same shuffled pool without overlapping,
  // by taking two disjoint slices of it.
  const flowerSpots = open.slice(0, FLOWER_COUNT)
  const chickenSpots = open.slice(FLOWER_COUNT, FLOWER_COUNT + CHICKEN_COUNT)

  for (const spot of flowerSpots) {
    k.add([
      k.sprite(`flower-${Math.floor(rng() * FLOWER_VARIANTS)}`),
      k.pos(spot.x, spot.y),
      k.anchor('center'),
      k.z(FLOWER_Z),
    ])
  }

  const chickens: Chicken[] = chickenSpots.map((spot) => {
    const obj = k.add([
      k.sprite('chicken', { frame: 0 }),
      k.pos(spot.x, spot.y),
      k.anchor('center'),
      k.z(CHICKEN_Z),
    ])
    return {
      obj,
      homeX: spot.x,
      homeY: spot.y,
      // Stagger the first decision so they don't all move in lockstep.
      timer: between(rng, IDLE_SECONDS),
      walking: false,
      dirX: 0,
      dirY: 0,
      facing: 'right',
      mode: 'wander',
      path: [],
      pathIndex: 0,
    }
  })

  // Motes are decorative motion with no other purpose, so under reduced
  // motion they are not created at all rather than created and frozen.
  const motes = options.reducedMotion
    ? []
    : Array.from({ length: MOTE_COUNT }, () => {
        const x = rng() * WORLD_WIDTH
        const y = rng() * WORLD_HEIGHT
        return {
          obj: k.add([
            k.sprite('mote'),
            k.pos(x, y),
            k.anchor('center'),
            k.opacity(0.25 + rng() * 0.35),
            k.z(MOTE_Z),
          ]),
          baseX: x,
          /** Phase offset so they don't all sway together. */
          phase: rng() * Math.PI * 2,
        }
      })

  /** Sends a chicken off in a new direction, or stops it for a beat. */
  const redecide = (chicken: Chicken): void => {
    const strayX = chicken.obj.pos.x - chicken.homeX
    const strayY = chicken.obj.pos.y - chicken.homeY
    const stray = Math.hypot(strayX, strayY)

    chicken.walking = rng() > 0.35
    chicken.timer = between(rng, chicken.walking ? WALK_SECONDS : IDLE_SECONDS)

    if (!chicken.walking) {
      chicken.dirX = 0
      chicken.dirY = 0
      return
    }

    if (stray > CHICKEN_ROAM_RADIUS) {
      // Too far from home: head back, so a chicken can never wander off
      // across the village and leave its patch empty.
      chicken.dirX = -strayX / stray
      chicken.dirY = -strayY / stray
    } else {
      const angle = rng() * Math.PI * 2
      chicken.dirX = Math.cos(angle)
      chicken.dirY = Math.sin(angle)
    }

    if (chicken.dirX !== 0) chicken.facing = chicken.dirX < 0 ? 'left' : 'right'
  }

  /**
   * Routes every chicken toward the feed pile. Mode/timer/path are all it
   * takes to redirect a chicken mid-behaviour — even one already wandering
   * or (on a repeat click) already mid-feed just gets its state overwritten,
   * so this never needs to special-case "already feeding".
   */
  const feedChickens = (pileX: number, pileY: number): number => {
    let slowestArrival = 0

    chickens.forEach((chicken, i) => {
      const offset = FEED_GATHER_OFFSETS[i % FEED_GATHER_OFFSETS.length]
      const targetX = pileX + offset.dx
      const targetY = pileY + offset.dy

      if (options.reducedMotion) {
        // No running under reduced motion — the chicken simply appears
        // already gathered, in a static (non-animated) pecking pose.
        chicken.obj.pos.x = targetX
        chicken.obj.pos.y = targetY
        chicken.obj.stop()
        chicken.obj.frame = IDLE_FRAME_BY_FACING[chicken.facing]
        chicken.mode = 'pecking'
        chicken.timer = FEED_PECK_SECONDS
        chicken.path = []
        chicken.pathIndex = 0
        return
      }

      const path = findPath(chicken.obj.pos.x, chicken.obj.pos.y, targetX, targetY)
      const distance = pathDistance(chicken.obj.pos.x, chicken.obj.pos.y, path)
      chicken.path = path
      chicken.pathIndex = 0
      chicken.mode = 'seeking'
      chicken.timer = travelBudget(distance, CHICKEN_FEED_SPEED)
      // The pile has to outlast the chicken with the longest run, or the far
      // ones arrive to find nothing there. Measured from the real distance
      // rather than the padded budget, so the pile disappears just as the
      // last chicken finishes its peck.
      slowestArrival = Math.max(slowestArrival, distance / CHICKEN_FEED_SPEED)
    })

    return slowestArrival + FEED_PECK_SECONDS
  }

  /**
   * Walks a chicken one frame along its current `path`. Returns true once the
   * last waypoint is reached, so the caller can move it on to its next leg.
   */
  const followPath = (chicken: Chicken, speed: number, dt: number): boolean => {
    const waypoint = chicken.path[chicken.pathIndex]
    if (!waypoint) return true

    const dx = waypoint.x - chicken.obj.pos.x
    const dy = waypoint.y - chicken.obj.pos.y
    const dist = Math.hypot(dx, dy)
    if (dist < 1.5) {
      chicken.obj.pos.x = waypoint.x
      chicken.obj.pos.y = waypoint.y
      chicken.pathIndex++
    } else {
      const step = Math.min(dist, speed * dt)
      chicken.obj.pos.x += (dx / dist) * step
      chicken.obj.pos.y += (dy / dist) * step
      if (dx !== 0) chicken.facing = dx < 0 ? 'left' : 'right'
    }

    const anim = `peck-${chicken.facing}`
    if (chicken.obj.curAnim() !== anim) chicken.obj.play(anim)

    return chicken.pathIndex >= chicken.path.length
  }

  /**
   * Hands a chicken back to the ambient wander behaviour. `timer` is zeroed
   * so the very next frame re-decides where to go, and a chicken that never
   * made it home adopts wherever it stopped as its new patch — otherwise
   * `redecide()` would spend the rest of the session steering it at a spot
   * it has already proven it cannot reach in a straight line.
   */
  const resumeWander = (chicken: Chicken, reachedHome: boolean): void => {
    chicken.mode = 'wander'
    chicken.path = []
    chicken.pathIndex = 0
    chicken.timer = 0
    if (!reachedHome) {
      chicken.homeX = chicken.obj.pos.x
      chicken.homeY = chicken.obj.pos.y
    }
  }

  const update = (dt: number, time: number): void => {
    for (const chicken of chickens) {
      if (chicken.mode === 'seeking') {
        chicken.timer -= dt
        const arrived = followPath(chicken, CHICKEN_FEED_SPEED, dt)
        if (arrived || chicken.timer <= 0) {
          chicken.mode = 'pecking'
          chicken.timer = FEED_PECK_SECONDS
        }
        continue
      }

      if (chicken.mode === 'returning') {
        chicken.timer -= dt
        const arrived = followPath(chicken, CHICKEN_RETURN_SPEED, dt)
        if (arrived || chicken.timer <= 0) resumeWander(chicken, arrived)
        continue
      }

      if (chicken.mode === 'pecking') {
        chicken.timer -= dt
        // Under reduced motion `feedChickens` already froze this chicken on
        // a static frame — leave it alone rather than starting the peck
        // animation underneath it.
        if (!options.reducedMotion) {
          const anim = `peck-${chicken.facing}`
          if (chicken.obj.curAnim() !== anim) chicken.obj.play(anim)
        }

        if (chicken.timer <= 0) {
          if (options.reducedMotion) {
            // Nothing walks under reduced motion, so the chicken stays put
            // and simply adopts the feeding area as its patch.
            resumeWander(chicken, false)
          } else {
            // Walk home along a real path. Going straight back to `wander`
            // here is what stranded the flock at the farm: wander steers by
            // straight-line direction and only reverses at walls, so a
            // chicken a village away from its patch never gets home.
            const path = findPath(
              chicken.obj.pos.x,
              chicken.obj.pos.y,
              chicken.homeX,
              chicken.homeY,
            )
            chicken.path = path
            chicken.pathIndex = 0
            chicken.mode = 'returning'
            chicken.timer = travelBudget(
              pathDistance(chicken.obj.pos.x, chicken.obj.pos.y, path),
              CHICKEN_RETURN_SPEED,
            )
          }
        }
        continue
      }

      // mode === 'wander' — the original ambient behaviour, untouched.
      if (options.reducedMotion) continue

      chicken.timer -= dt
      if (chicken.timer <= 0) redecide(chicken)

      const anim = chicken.walking ? `peck-${chicken.facing}` : null
      if (anim) {
        if (chicken.obj.curAnim() !== anim) chicken.obj.play(anim)
      } else if (chicken.obj.curAnim()) {
        chicken.obj.stop()
        chicken.obj.frame = IDLE_FRAME_BY_FACING[chicken.facing]
      }

      if (!chicken.walking) continue

      const nextX = chicken.obj.pos.x + chicken.dirX * CHICKEN_SPEED * dt
      const nextY = chicken.obj.pos.y + chicken.dirY * CHICKEN_SPEED * dt

      // Chickens obey the same map collision the player does. Walking into
      // something just ends the current stroll early — no pathfinding, which
      // is the whole point of "simple AI" (the feed pile above is the one
      // place a chicken needs a real path, since it can be sent from
      // anywhere on the map).
      if (canStandAt(nextX, chicken.obj.pos.y)) {
        chicken.obj.pos.x = nextX
      } else {
        chicken.dirX = -chicken.dirX
        chicken.facing = chicken.dirX < 0 ? 'left' : 'right'
      }

      if (canStandAt(chicken.obj.pos.x, nextY)) {
        chicken.obj.pos.y = nextY
      } else {
        chicken.dirY = -chicken.dirY
      }
    }

    for (const mote of motes) {
      mote.obj.pos.y -= MOTE_RISE * dt
      mote.obj.pos.x = mote.baseX + Math.sin(time * MOTE_SWAY_SPEED + mote.phase) * MOTE_SWAY
      // Wrap to the bottom so the same handful of objects drift forever
      // instead of being destroyed and re-created.
      if (mote.obj.pos.y < 0) {
        mote.obj.pos.y = WORLD_HEIGHT
        mote.baseX = Math.random() * WORLD_WIDTH
      }
    }
  }

  return { update, feedChickens }
}
