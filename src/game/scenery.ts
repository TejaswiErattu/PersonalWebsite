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

import { canStandAt } from './collision'
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
const FLOWER_Z = 0.5
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

interface Chicken {
  obj: GameObj
  homeX: number
  homeY: number
  /** Seconds left before this chicken re-decides what to do. */
  timer: number
  walking: boolean
  dirX: number
  dirY: number
  facing: 'right' | 'left'
}

/** What `buildScenery` hands back for the game loop to drive. */
export interface Scenery {
  /** Advances the chickens and motes. No-op under reduced motion. */
  update: (dt: number, time: number) => void
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

  const update = (dt: number, time: number): void => {
    if (!options.reducedMotion) {
      for (const chicken of chickens) {
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
        // is the whole point of "simple AI".
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

  return { update }
}
