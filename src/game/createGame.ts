import kaplay, { type KAPLAYCtx, type GameObj } from 'kaplay'

import { playTrainHorn } from '../audio/audio'
import { canStandAt } from './collision'
import { InteractionRegistry } from './interactions'
import {
  BUILDING_SYMBOLS,
  LOCATIONS,
  SIGNPOSTS,
  SIGNPOST_SYMBOLS,
  assertStationSpacing,
  type ContextualActionId,
  type Dialogue,
} from './locations'
import { FLOWER_Z, buildScenery, loadScenerySprites } from './scenery'
import {
  GRASS_COLOR,
  MAP,
  TILES,
  TILE_SIZE,
  WORLD_HEIGHT,
  WORLD_WIDTH,
  assertMapIsRectangular,
  findSpawnPoint,
  findTileRect,
} from './village'
import {
  DIRECTIONS,
  FRAMES_PER_DIRECTION,
  FRAME_SIZE,
  createPlayerSpriteSheet,
  idleFrame,
  walkAnim,
  type Direction,
} from './sprites'
import {
  FLOWER_VARIANTS,
  TRAIN_WIDTH,
  createBuildingSprite,
  createBushSprite,
  createCueSprite,
  createFarmSprite,
  createFeedPileSprite,
  createEnvelopeSprite,
  createPathTileSprite,
  createPlantingBedSprite,
  createRailSprite,
  createSignpostSprite,
  createSmokePuffSprite,
  createTrainSprite,
  createTreeSprite,
  postOfficeChimneyMouth,
  trainSmokestackMouth,
} from './worldSprites'

/** Player walking speed, in world pixels per second. */
const PLAYER_SPEED = 78

/**
 * How much the world is magnified.
 *
 * On a desktop window 2x reads as pixel art while still showing roughly two
 * thirds of the village. On a 375px-wide phone that same 2x would show only
 * ~11 tiles across, which is too claustrophobic to navigate — so zoom is
 * resolved from the canvas width every frame instead of being fixed. Picking
 * it per frame (rather than once at boot) means rotating the device or
 * resizing the window is handled for free.
 */
const CAMERA_ZOOM_DESKTOP = 2
const CAMERA_ZOOM_COMPACT = 1.5
/** Below this canvas width, drop to the compact zoom. */
const COMPACT_WIDTH = 560

function zoomForWidth(width: number): number {
  return width < COMPACT_WIDTH ? CAMERA_ZOOM_COMPACT : CAMERA_ZOOM_DESKTOP
}

/** Higher = camera snaps to the player faster. Frame-rate independent. */
const CAMERA_FOLLOW = 12

/**
 * Camera follow used when the visitor has asked for reduced motion. A much
 * higher constant means the camera effectively sticks to the player instead
 * of gliding after them, which removes the drifting parallax that triggers
 * motion sensitivity — without pinning the view somewhere unhelpful.
 */
const CAMERA_FOLLOW_REDUCED = 60

/**
 * How close, in world pixels from a building's edge, counts as "approaching"
 * it for the purposes of the camera zoom-in. Comfortably outside every
 * building's station radius, so the zoom has settled in by the time a
 * station's cue appears rather than starting at the same instant.
 */
const NEAR_BUILDING_RADIUS = 56

/** Extra zoom applied on top of the base zoom while near a building. */
const NEAR_BUILDING_ZOOM = 1.25

/** Higher = the zoom eases toward its target faster. Same idea as CAMERA_FOLLOW. */
const CAMERA_ZOOM_FOLLOW = 6

/** Near-instant zoom transition under reduced motion, mirroring CAMERA_FOLLOW_REDUCED. */
const CAMERA_ZOOM_FOLLOW_REDUCED = 60

/** True when the OS/browser asks for reduced motion. Re-read per boot. */
function prefersReducedMotion(): boolean {
  return (
    typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches
  )
}

/** Draw order: tiles at 0, buildings above them, player above those. */
const BUILDING_Z = 1
const PLAYER_Z = 10
/** The cue floats above everything so a building can never cover it. */
const CUE_Z = 20
/**
 * Same layer as the player — the train is a foreground vehicle passing
 * through the street, not backdrop scenery at `BUILDING_Z`, which would let
 * a signpost (also `BUILDING_Z`) drawn later in the same frame cover it.
 */
const TRAIN_Z = PLAYER_Z

/**
 * How close the player's centre must get to a door before it responds, in
 * world pixels. A shade under two tiles: close enough to feel deliberate,
 * far enough that you don't have to hunt for the exact pixel.
 */
const INTERACT_RADIUS = 26

/**
 * Same idea as `INTERACT_RADIUS`, but tighter: multi-station buildings pack
 * several triggers along one wall, and a smaller radius keeps the player
 * standing in front of the one they mean instead of anything within a tile
 * or two of the whole row. `nearest()` would resolve overlap correctly
 * either way — this is about feel, not correctness.
 */
const STATION_INTERACT_RADIUS = 20

/**
 * Signposts are a single tile with one line of text — smaller than either
 * building radius, since there is no "door" to stand in front of, just a
 * post to walk up to.
 */
const SIGNPOST_INTERACT_RADIUS = 16

/**
 * How close, in world pixels from a special location's edge, shows its
 * contextual action button (Incoming Train, Plant More, Drop Feed, Send
 * Mail). Generous on purpose — this is a coarse "you're at this location"
 * signal, not a precise station target the way `STATION_INTERACT_RADIUS` is,
 * so it roughly matches `NEAR_BUILDING_RADIUS`'s camera zoom-in range.
 */
const SPECIAL_ACTION_RADIUS = NEAR_BUILDING_RADIUS

/**
 * Incoming Train tuning. The train travels the full world width (off one
 * edge, through the station, off the other), slowing within
 * `TRAIN_SLOW_RADIUS` of the station centre and holding there for
 * `TRAIN_HOLD_SECONDS` before continuing off in the same direction it
 * arrived. At `TRAIN_CRUISE_SPEED` the full journey comfortably finishes
 * inside the contextual button's ~10s cooldown (see
 * `ContextualActionButton`'s `COOLDOWN_MS`), so the button stays disabled
 * for the entire time the train is on screen.
 */
const TRAIN_CRUISE_SPEED = 200
const TRAIN_SLOW_RADIUS = 110
const TRAIN_MIN_SPEED_FACTOR = 0.15
const TRAIN_HOLD_SECONDS = 3
/** Under reduced motion the train never moves — just appears, sits briefly, and is gone. */
const TRAIN_REDUCED_HOLD_SECONDS = 2.5
/**
 * How far above the station's top edge the track sits, in world pixels —
 * far enough to clear the roofline and sit in the open grass margin above
 * the top row of buildings, not overlapping the station's own facade.
 */
const TRAIN_TRACK_OFFSET = 12

/**
 * How far in from each edge of the world the track's rails stop, in map
 * tiles — the water border (2 tiles) plus the tree line behind it (1 tile),
 * so the rail sprite and the train's whole journey stay on green land
 * instead of appearing to run through water or emerge from outside the
 * village. Both sides of the map use the same border width, so a track
 * this much shorter than `WORLD_WIDTH` stays centred on it for free.
 */
const RAIL_MARGIN_TILES = 3
const RAIL_MARGIN = RAIL_MARGIN_TILES * TILE_SIZE
const RAIL_WIDTH = WORLD_WIDTH - RAIL_MARGIN * 2

/**
 * Arrival sequence, once the train reaches the platform: a puff of smoke
 * from the stack, then — partway through the hold, giving the smoke a beat
 * to read on its own — the departure horn, then the train pulls out at the
 * hold's existing end. `TRAIN_HORN_DELAY_SECONDS` has to stay well inside
 * `TRAIN_HOLD_SECONDS` or the horn would never get a chance to play before
 * the train leaves.
 */
const TRAIN_HORN_DELAY_SECONDS = 1.5
/** Under reduced motion the whole hold is shorter, so the horn comes sooner too. */
const TRAIN_REDUCED_HORN_DELAY_SECONDS = 1

/**
 * Smoke puffs from the stack: a small burst with varied size, drift and
 * lifetime so the cloud reads as puffy rather than one uniform blob — the
 * same "vary each particle's kinematics, not when it spawns" approach the
 * Send Mail envelopes use.
 */
const TRAIN_SMOKE_COUNT = 4
const TRAIN_SMOKE_LIFE_SECONDS = 0.9
const TRAIN_SMOKE_LIFE_STAGGER = 0.15
const TRAIN_SMOKE_RISE_SPEED = 20
const TRAIN_SMOKE_RISE_STAGGER = 6
const TRAIN_SMOKE_DRIFT = 7
/** Reduced motion: puffs appear already drifted apart and hold in place. */
const TRAIN_SMOKE_REDUCED_LIFE_SECONDS = 1.2
const TRAIN_SMOKE_REDUCED_SPREAD = 6

/**
 * A single, lighter puff while the train is actually travelling (as opposed
 * to the fuller `TRAIN_SMOKE_COUNT`-puff burst on arrival) — a trail rather
 * than a cloud. Only reached from the 'entering'/'leaving' phases, which
 * reduced motion never enters (it starts straight in 'reducedHold'), so this
 * naturally never fires under reduced motion without needing its own guard.
 */
const TRAIN_MOVING_SMOKE_INTERVAL_SECONDS = 0.35
const TRAIN_MOVING_SMOKE_LIFE_SECONDS = 0.7

/**
 * Fixed, predetermined empty grass tiles near the Community Impact
 * Greenhouse where "Plant More" is allowed to add a cluster — per spec, a
 * fixed list rather than anything derived or random, so a click can never
 * land on a building, path, water, tree, or interaction trigger. Column/row
 * are `village.ts` map coordinates, hand-picked and confirmed grass ('.').
 * Eleven sit in the open margin directly south of the greenhouse; one sits
 * north of it, across the tree row. Exactly twelve, matching the session cap.
 */
const PLANT_MORE_TILES: readonly { col: number; row: number }[] = [
  { col: 3, row: 29 },
  { col: 4, row: 29 },
  { col: 5, row: 29 },
  { col: 6, row: 29 },
  { col: 7, row: 29 },
  { col: 8, row: 29 },
  { col: 9, row: 29 },
  { col: 10, row: 29 },
  { col: 11, row: 29 },
  { col: 12, row: 29 },
  { col: 13, row: 29 },
  // A second row in the open margin below, skipping col 9 where the
  // greenhouse's signpost stands. Every tile has to be somewhere the player
  // can actually walk to in a straight line from the bed, because the
  // flower only blooms once they arrive — the old twelfth tile sat north of
  // the greenhouse, walled off by the tree row, so the walk stalled against
  // the building and the flower appeared a whole house away.
  { col: 4, row: 30 },
  { col: 7, row: 30 },
  { col: 11, row: 30 },
  { col: 13, row: 30 },
]

/**
 * How long the finished garden is left standing before every flower is
 * cleared at once and the bed is free to be replanted, in seconds. Flowers
 * persist as they are planted (rather than each fading on its own timer), so
 * this beat is the only chance to see all fifteen in bloom together.
 */
const GARDEN_FULL_HOLD = 3

/** How close the player can be to a tile before it's skipped for that click. */
const PLANT_MORE_PLAYER_CLEARANCE = 12

/**
 * Soft-lock guard for the "Plant More" auto-walk: if the player hasn't
 * reached the planting tile within this many seconds (an unexpectedly long
 * detour around collision, say), the flower plants anyway rather than
 * leaving the click with no visible effect. `PLANT_MORE_PLAYER_CLEARANCE` is
 * reused as the arrival distance — the same "close enough" radius already
 * used to skip a tile the player is standing on, so the player visibly
 * arrives at the spot without needing to land exactly on the flower's centre
 * (which would otherwise sit half-hidden under the player sprite).
 */
const AUTO_WALK_TIMEOUT = 2.5

/**
 * "Send Mail" tuning. Each click throws one burst of envelopes out of the
 * post office chimney: they climb (slowing as they go), drift sideways, and
 * wobble on a sine, so no two trace the same arc. Burst sizes are cycled
 * rather than randomised — five to eight per the spec — and the whole batch
 * is gone well inside the button's own 3s cooldown.
 */
const MAIL_BURST_SIZES = [6, 8, 5, 7] as const
const MAIL_LIFE_SECONDS = 1.7
/** Per-envelope life stagger, so a burst thins out rather than vanishing together. */
const MAIL_LIFE_STAGGER = 0.06
const MAIL_RISE_SPEED = 46
const MAIL_RISE_STAGGER = 4
/** Widest sideways lean of the fan, world px/sec at the outer edges. */
const MAIL_DRIFT_SPREAD = 54
const MAIL_SWAY_SPEED = 2.6
const MAIL_SWAY_WIDTH = 26
/** Reduced motion: a static cluster above the chimney instead of flight. */
const MAIL_REDUCED_HOLD_SECONDS = 1.4
const MAIL_REDUCED_CLUSTER_WIDTH = 30
const MAIL_REDUCED_CLUSTER_LIFT = 12

/** Gap between the door and the floating cue above it. */
const CUE_LIFT = 30

/** Bob applied to the cue so it reads as active rather than painted on. */
const CUE_BOB_SPEED = 6
const CUE_BOB_HEIGHT = 2

/** Keys that trigger the nearest interactable. */
const INTERACT_KEYS = ['e', 'space', 'enter']

/**
 * Longest distance resolved in one collision test. Keeping it well under a
 * tile means the player can never step over a wall, even after the browser
 * pauses the tab and hands us a huge delta time.
 */
const MAX_SUBSTEP = TILE_SIZE / 4

/** Upper bound on a single frame's delta, so one long stall can't teleport. */
const MAX_FRAME_DELTA = 0.1

/** Which physical keys drive which direction. */
const KEY_BINDINGS: Record<Direction, string[]> = {
  up: ['up', 'w'],
  down: ['down', 's'],
  left: ['left', 'a'],
  right: ['right', 'd'],
}

/** What `createGame` hands back to React so the effect can clean itself up. */
export interface GameHandle {
  destroy: () => void
  /** Hands control back to the player after a dialogue closes. */
  resume: () => void
  /**
   * Sets a movement direction from outside the keyboard — the on-screen
   * D-pad. Components pass a direction vector (it gets normalised here), and
   * (0, 0) to stop. It is summed with keyboard input rather than replacing
   * it, so a device with both a touchscreen and a keyboard works either way.
   */
  setTouchMove: (x: number, y: number) => void
  /** Fires the interact action, as if the player had pressed E. */
  triggerInteract: () => void
  /**
   * Contextual side-button actions — one per special location. Each is a
   * tiny stub for now (Phase 8 adds the button and the plumbing to reach
   * these; a later phase fills in the actual train/planting/feeding/mail
   * animation behind each one). Naming them individually, rather than one
   * `triggerContextualAction(id)`, is deliberate: it gives each future
   * animation its own obvious place to grow into, and a caller can never
   * pass a mismatched id.
   */
  triggerIncomingTrain: () => void
  triggerPlantMore: () => void
  triggerDropFeed: () => void
  triggerSendMail: () => void
}

/**
 * How the game talks to React. The game owns the world; React owns the UI on
 * top of it. These two callbacks are the entire surface between them.
 */
export interface GameCallbacks {
  /** Label of the interactable in range, or null when there is none. */
  onPromptChange: (label: string | null) => void
  /** Player pressed the interact key on something with dialogue. */
  onOpenDialogue: (dialogue: Dialogue) => void
  /**
   * Id of the special location's contextual action currently in range, or
   * null when the player isn't near one. Drives which single side button
   * (Incoming Train / Plant More / Drop Feed / Send Mail) React shows.
   */
  onContextualActionChange: (action: ContextualActionId | null) => void
  /**
   * Fires with `true` the moment the greenhouse's fixed planting list is
   * used up, then with `false` a few seconds later when the finished garden
   * is cleared and the bed can be replanted. Drives the button's "The garden
   * is full!" state, which is therefore a pause between rounds rather than a
   * permanent end.
   */
  onGardenFullChange: (full: boolean) => void
  /**
   * Real asset-loading progress, 0..1, forwarded straight from Kaplay's own
   * loader. Fires every frame while assets are outstanding. This is a count
   * of assets actually resolved — not a timer — so it is allowed to jump
   * straight to 1 when there is little to do.
   */
  onLoadProgress: (progress: number) => void
  /** Assets are decoded and the first frame is about to render. */
  onReady: () => void
}

function clamp(value: number, min: number, max: number): number {
  if (max < min) return (min + max) / 2
  return Math.min(Math.max(value, min), max)
}

/** Sprite name for a building, derived from its map symbol. */
function buildingSpriteName(symbol: string): string {
  return `building-${symbol}`
}

/** Sprite name for a signpost, derived from its map symbol. */
function signpostSpriteName(symbol: string): string {
  return `signpost-${symbol}`
}

/**
 * Symbols drawn as a dedicated sprite rather than a flat colour rectangle —
 * the stone path and its two non-solid landscaping accents. `v` always uses
 * the same flower variant: these tiles are hand-placed in `village.ts`, and a
 * fixed variant keeps the map's own art deterministic, matching the seeded
 * (never `Math.random()`) placement philosophy `scenery.ts` uses for the
 * ambient flowers scattered on top of plain grass.
 */
const GROUND_SPRITE_SYMBOLS: Record<string, string> = {
  ',': 'path',
  P: 'path',
  b: 'bush',
  v: `flower-${Math.min(1, FLOWER_VARIANTS - 1)}`,
  T: 'tree',
  k: 'planting-bed',
}

/**
 * Builds the map's visuals. Tiles carry no colliders — walls are enforced by
 * `canStandAt`, which reads the same ASCII map these rectangles are drawn from.
 */
function buildLevel(k: KAPLAYCtx): void {
  k.addLevel(MAP, {
    tileWidth: TILE_SIZE,
    tileHeight: TILE_SIZE,
    tiles: {
      ...Object.fromEntries(
        Object.entries(TILES)
          // Buildings and signposts are drawn as their own sprite, not as a
          // flat block of tile colour. Ground sprite symbols are handled
          // below instead of falling through to the flat-colour fallback.
          .filter(
            ([symbol]) =>
              !BUILDING_SYMBOLS.has(symbol) &&
              !SIGNPOST_SYMBOLS.has(symbol) &&
              !(symbol in GROUND_SPRITE_SYMBOLS),
          )
          .map(([symbol, spec]) => [
            symbol,
            () => [k.rect(TILE_SIZE, TILE_SIZE), k.color(k.rgb(spec.color)), k.z(0)],
          ]),
      ),
      ...Object.fromEntries(
        Object.entries(GROUND_SPRITE_SYMBOLS).map(([symbol, sprite]) => [
          symbol,
          () => [k.sprite(sprite), k.z(0)],
        ]),
      ),
    },
    // Grass ('.') and anything undefined draws nothing — the background colour
    // already is grass, so skipping the object keeps the scene light.
    wildcardTile: () => null,
  })
}

/**
 * Places one sprite per building and registers a door trigger for any that
 * has dialogue wired up in `locations.ts`.
 *
 * Collision is not touched here: the ASCII map already marks these tiles
 * solid, and `canStandAt` reads the map directly.
 */
function buildBuildings(
  k: KAPLAYCtx,
  registry: InteractionRegistry,
  openDialogue: (dialogue: Dialogue) => void,
): void {
  for (const location of LOCATIONS) {
    const rect = findTileRect(location.symbol)
    if (!rect) continue

    const left = rect.col * TILE_SIZE
    const top = rect.row * TILE_SIZE
    const width = rect.cols * TILE_SIZE
    const height = rect.rows * TILE_SIZE

    k.add([
      k.sprite(buildingSpriteName(location.symbol)),
      k.pos(left, top),
      k.z(BUILDING_Z),
      'building',
    ])

    // Single-door buildings: the door is drawn centred on the bottom edge,
    // so the trigger anchors to that same point — the spot the player walks
    // up to.
    const { dialogue } = location
    if (dialogue) {
      registry.register({
        id: location.symbol,
        label: location.name,
        x: left + width / 2,
        y: top + height,
        radius: INTERACT_RADIUS,
        onInteract: () => openDialogue(dialogue()),
      })
    }

    // Multi-station buildings: one trigger per station, evenly spaced along
    // the bottom edge. Overlapping radii are fine — `registry.nearest()`
    // still guarantees only the closest one ever fires.
    if (location.stations) {
      const count = location.stations.length
      location.stations.forEach((station, index) => {
        registry.register({
          id: `${location.symbol}:${station.id}`,
          label: station.label,
          x: left + ((index + 1) * width) / (count + 1),
          y: top + height,
          radius: STATION_INTERACT_RADIUS,
          onInteract: () => openDialogue(station.dialogue()),
        })
      })
    }
  }
}

/**
 * Places one themed sign sprite per signpost and registers its interactable.
 *
 * The sprite is anchored bottom-centre on the signpost's tile, like the
 * interaction cue, so its post appears to be planted in the ground at that
 * exact tile regardless of how tall the wrapped heading makes the board.
 */
function buildSignposts(
  k: KAPLAYCtx,
  registry: InteractionRegistry,
  openDialogue: (dialogue: Dialogue) => void,
): void {
  for (const signpost of SIGNPOSTS) {
    const rect = findTileRect(signpost.symbol)
    if (!rect) continue

    k.add([
      k.sprite(signpostSpriteName(signpost.symbol)),
      k.pos(rect.col * TILE_SIZE + TILE_SIZE / 2, rect.row * TILE_SIZE + TILE_SIZE),
      k.anchor('bot'),
      k.z(BUILDING_Z),
      'signpost',
    ])

    registry.register({
      id: `signpost:${signpost.symbol}`,
      label: signpost.title,
      x: rect.col * TILE_SIZE + TILE_SIZE / 2,
      y: rect.row * TILE_SIZE + TILE_SIZE / 2,
      radius: SIGNPOST_INTERACT_RADIUS,
      onInteract: () =>
        openDialogue({
          id: `signpost-${signpost.symbol}`,
          title: signpost.title,
          subtitle: signpost.subtitle,
          lines: [],
          legend: signpost.legend,
          locationId: signpost.locationId,
          accent: signpost.themeAccent,
          icon: signpost.themeIcon,
        }),
    })
  }
}

/**
 * Moves the player by `distance` along a unit direction, in small steps, with
 * the two axes resolved independently so walking into a wall at an angle
 * slides along it instead of stopping dead.
 */
function stepPlayer(player: GameObj, dirX: number, dirY: number, distance: number): void {
  let remaining = distance

  while (remaining > 0) {
    const step = Math.min(remaining, MAX_SUBSTEP)
    remaining -= step

    const nextX = player.pos.x + dirX * step
    if (dirX !== 0 && canStandAt(nextX, player.pos.y)) {
      player.pos.x = nextX
    }

    const nextY = player.pos.y + dirY * step
    if (dirY !== 0 && canStandAt(player.pos.x, nextY)) {
      player.pos.y = nextY
    }
  }
}

/** A building's footprint in world pixels, for the camera zoom-in check. */
interface WorldRect {
  left: number
  top: number
  right: number
  bottom: number
}

/** Shortest distance from a point to the outside of a rect; 0 if inside it. */
function distanceToRect(x: number, y: number, rect: WorldRect): number {
  const dx = Math.max(rect.left - x, 0, x - rect.right)
  const dy = Math.max(rect.top - y, 0, y - rect.bottom)
  return Math.hypot(dx, dy)
}

/** Every building's footprint, in world pixels, for the camera zoom-in check. */
function collectBuildingRects(): WorldRect[] {
  const rects: WorldRect[] = []
  for (const location of LOCATIONS) {
    const rect = findTileRect(location.symbol)
    if (!rect) continue
    rects.push({
      left: rect.col * TILE_SIZE,
      top: rect.row * TILE_SIZE,
      right: (rect.col + rect.cols) * TILE_SIZE,
      bottom: (rect.row + rect.rows) * TILE_SIZE,
    })
  }
  return rects
}

/** One special location's footprint plus which contextual action it shows. */
interface SpecialActionRect {
  id: ContextualActionId
  rect: WorldRect
}

/**
 * The four locations with a contextual action button, with their footprints
 * in world pixels. Built once at boot from whichever `LOCATIONS` entries set
 * `contextualAction`, so adding or moving a special location is a
 * `locations.ts`/`village.ts` edit only — nothing here hardcodes a symbol.
 */
function collectSpecialActionRects(): SpecialActionRect[] {
  const rects: SpecialActionRect[] = []
  for (const location of LOCATIONS) {
    if (!location.contextualAction) continue
    const rect = findTileRect(location.symbol)
    if (!rect) continue
    rects.push({
      id: location.contextualAction,
      rect: {
        left: rect.col * TILE_SIZE,
        top: rect.row * TILE_SIZE,
        right: (rect.col + rect.cols) * TILE_SIZE,
        bottom: (rect.row + rect.rows) * TILE_SIZE,
      },
    })
  }
  return rects
}

function buildPlayer(k: KAPLAYCtx): GameObj {
  const spawn = findSpawnPoint()

  return k.add([
    k.sprite('player', { frame: idleFrame('down') }),
    k.pos(spawn.x, spawn.y),
    k.anchor('center'),
    k.z(PLAYER_Z),
    'player',
  ])
}

/**
 * Boots the whole game onto an existing canvas.
 *
 * The caller owns the canvas element and must call `destroy()` when unmounting.
 */
export function createGame(canvas: HTMLCanvasElement, callbacks: GameCallbacks): GameHandle {
  assertMapIsRectangular()
  assertStationSpacing()

  const k = kaplay({
    canvas,
    // Keep every Kaplay function on `k` instead of leaking them onto `window`.
    global: false,
    background: GRASS_COLOR,
    crisp: true,
    pixelDensity: 1,
    debug: false,
    touchToMouse: false,
  })

  const registry = new InteractionRegistry()

  /** Resolved once per boot; the media query does not change mid-session in
   *  any way worth tearing the game down for. */
  const reducedMotion = prefersReducedMotion()
  const cameraFollow = reducedMotion ? CAMERA_FOLLOW_REDUCED : CAMERA_FOLLOW
  const zoomFollow = reducedMotion ? CAMERA_ZOOM_FOLLOW_REDUCED : CAMERA_ZOOM_FOLLOW

  /** Live direction from the on-screen D-pad. Written by `setTouchMove`. */
  const touchMove = { x: 0, y: 0 }

  /**
   * Assigned once assets finish loading. Until then the interact button has
   * nothing to call, which is correct — there is no world to interact with.
   */
  let interactFn: (() => void) | null = null

  /** Assigned inside `onLoad`, once the train station's world position is known. */
  let triggerTrainFn: (() => void) | null = null
  /** Destroys any smoke puffs still drifting. Used by `destroy()`. */
  let clearTrainSmokeFn: (() => void) | null = null

  /** Assigned inside `onLoad`, once the player object exists. */
  let triggerPlantMoreFn: (() => void) | null = null

  /** Assigned inside `onLoad`, once the farm's world position is known. */
  let triggerDropFeedFn: (() => void) | null = null

  /** Assigned inside `onLoad`, once the post office's chimney position is known. */
  let triggerSendMailFn: (() => void) | null = null
  /** Destroys any envelopes still in flight. Used by `destroy()`. */
  let clearMailFn: (() => void) | null = null

  /** Envelopes fly over the rooftops, so they sit above buildings but under the cue. */
  const MAIL_Z = PLAYER_Z + 1
  /** Which burst size the next "Send Mail" click uses. See `MAIL_BURST_SIZES`. */
  let mailBurst = 0

  /**
   * Set while the player is walking to a "Plant More" tile before its flower
   * appears (see the "Plant More" section in `onLoad` below). `null` means
   * normal keyboard/touch input drives the player.
   */
  let autoWalk: { targetX: number; targetY: number; elapsed: number; onArrive: () => void } | null =
    null

  /**
   * While a dialogue is open the world freezes: no walking, no cue, no second
   * trigger. React flips this back with `resume()` when the box closes.
   */
  let paused = false

  const openDialogue = (dialogue: Dialogue): void => {
    paused = true
    callbacks.onOpenDialogue(dialogue)
  }

  // Only tell React when the prompt actually changes, otherwise this would
  // trigger a React render on every single frame.
  let promptLabel: string | null = null
  const setPrompt = (label: string | null): void => {
    if (label === promptLabel) return
    promptLabel = label
    callbacks.onPromptChange(label)
  }

  // Same debouncing as `setPrompt`, for the contextual action button.
  let contextualAction: ContextualActionId | null = null
  const setContextualAction = (action: ContextualActionId | null): void => {
    if (action === contextualAction) return
    contextualAction = action
    callbacks.onContextualActionChange(action)
  }

  k.loadSprite('player', createPlayerSpriteSheet(), {
    sliceX: FRAMES_PER_DIRECTION,
    sliceY: DIRECTIONS.length,
    anims: Object.fromEntries(
      DIRECTIONS.map((dir, row) => [
        walkAnim(dir),
        {
          from: row * FRAMES_PER_DIRECTION,
          to: row * FRAMES_PER_DIRECTION + FRAMES_PER_DIRECTION - 1,
          loop: true,
          speed: 8,
        },
      ]),
    ),
  })

  k.loadSprite('cue', createCueSprite())
  k.loadSprite('train', createTrainSprite())
  k.loadSprite('smokePuff', createSmokePuffSprite())
  k.loadSprite('rail', createRailSprite(RAIL_WIDTH))
  k.loadSprite('feedPile', createFeedPileSprite())
  k.loadSprite('envelope', createEnvelopeSprite())
  k.loadSprite('path', createPathTileSprite())
  k.loadSprite('bush', createBushSprite())
  k.loadSprite('tree', createTreeSprite())
  k.loadSprite('planting-bed', createPlantingBedSprite())

  loadScenerySprites(k)

  // Kaplay fires this every frame while any asset is still outstanding, with
  // the real resolved/total ratio. Forwarding it verbatim is what makes the
  // loading bar honest — nothing here is interpolated or timed.
  k.onLoading((progress) => callbacks.onLoadProgress(progress))

  // Every building gets its own sprite, drawn to its exact footprint. Loaded
  // here rather than inside `onLoad` so they are decoded before anything is
  // added to the scene.
  //
  // Each location has its own themed facade (train station, schoolhouse,
  // greenhouse, ...) with one coloured/iconed window per station, and the
  // farm draws as a fenced plot area instead of a house. The window x
  // positions come from the same `stationX()` formula `buildBuildings()`
  // uses for the interaction triggers below, so the visible window and the
  // spot the player must stand in are always the same point.
  for (const location of LOCATIONS) {
    const rect = findTileRect(location.symbol)
    if (!rect) continue
    const width = rect.cols * TILE_SIZE
    const height = rect.rows * TILE_SIZE
    const windows = (location.stations ?? []).map((station) => ({
      accent: station.accent,
      icon: station.icon,
      plaque: station.plaque,
    }))
    const sprite =
      location.variant === null
        ? createFarmSprite(width, height, location.palette, location.signText, windows)
        : createBuildingSprite(width, height, location.palette, location.variant, location.signText, windows)
    k.loadSprite(buildingSpriteName(location.symbol), sprite)
  }

  // One themed signpost sprite per location, sized to its wrapped heading.
  for (const signpost of SIGNPOSTS) {
    k.loadSprite(
      signpostSpriteName(signpost.symbol),
      createSignpostSprite(signpost.heading, signpost.accent, signpost.icon),
    )
  }

  // Wait for the sprites to finish decoding before playing animations on them.
  k.onLoad(() => {
    buildLevel(k)
    buildBuildings(k, registry, openDialogue)
    buildSignposts(k, registry, openDialogue)
    const scenery = buildScenery(k, { reducedMotion })
    const player = buildPlayer(k)
    const buildingRects = collectBuildingRects()
    const specialActionRects = collectSpecialActionRects()

    const cue = k.add([
      k.sprite('cue'),
      k.pos(0, 0),
      k.anchor('bot'),
      k.z(CUE_Z),
      k.opacity(0),
    ])

    /**
     * Acts on the nearest interactable only, so overlapping trigger radii can
     * never fire two things from one press.
     */
    const interact = (): void => {
      if (paused) return
      const target = registry.nearest(player.pos.x, player.pos.y)
      if (!target) return
      target.onInteract()
    }

    // Published so the on-screen interact button can fire the exact same
    // path as the keyboard, rather than synthesising a fake key event.
    interactFn = interact

    INTERACT_KEYS.forEach((key) => k.onKeyPress(key, interact))

    // --- Incoming Train ----------------------------------------------------
    // Looked up by `contextualAction` rather than hardcoding the 'R' symbol,
    // so moving the station in `village.ts`/`locations.ts` needs no change
    // here. `updateTrain` stays a no-op if the location is ever missing.
    let updateTrain: (dt: number) => void = () => {}
    {
      const trainStationLocation = LOCATIONS.find(
        (location) => location.contextualAction === 'incomingTrain',
      )
      const stationRect = trainStationLocation ? findTileRect(trainStationLocation.symbol) : null

      if (stationRect) {
        const stationCenterX = (stationRect.col + stationRect.cols / 2) * TILE_SIZE
        const trackY = stationRect.row * TILE_SIZE - TRAIN_TRACK_OFFSET
        // The train enters and leaves at the track's own ends rather than
        // the world's — `RAIL_MARGIN` keeps both on green land, so the
        // train never appears to cross water or arrive from outside the
        // village (see `RAIL_MARGIN_TILES`'s doc comment). Offset by half
        // the train's own width so its `anchor('center')` sprite never
        // overhangs past the rail's end into the water border.
        const entryX = RAIL_MARGIN + TRAIN_WIDTH / 2
        const exitX = WORLD_WIDTH - RAIL_MARGIN - TRAIN_WIDTH / 2

        // A permanent rail, visible whether or not a train is currently
        // running, so "Incoming Train" has real track to arrive on instead
        // of crossing bare grass. Sized to `RAIL_WIDTH` (not the full world)
        // so both ends land on grass, clear of the water border; centred on
        // the world because the border is the same width on both sides.
        // `anchor('center')` matches the train's own anchor, so the two
        // share the same vertical centre — "aligned with the track" is a
        // shared `trackY`, not a coincidence.
        k.add([
          k.sprite('rail'),
          k.pos(WORLD_WIDTH / 2, trackY),
          k.anchor('center'),
          k.z(BUILDING_Z),
        ])

        type TrainPhase = 'entering' | 'holding' | 'leaving' | 'reducedHold'
        let train: {
          obj: GameObj
          phase: TrainPhase
          timer: number
          hornPlayed: boolean
          /** Seconds since the last travelling smoke puff — only ticks in 'entering'/'leaving'. */
          smokeTimer: number
        } | null = null

        interface SmokePuff {
          obj: GameObj
          age: number
          life: number
          driftX: number
          riseY: number
        }
        const smokePuffs: SmokePuff[] = []

        const clearSmoke = (): void => {
          for (const puff of smokePuffs) puff.obj.destroy()
          smokePuffs.length = 0
        }

        // A puff of smoke from the stack, timed to the moment the train
        // reaches the platform (or, under reduced motion, the moment it
        // simply appears already stopped there).
        const spawnSmoke = (trainX: number, trainY: number): void => {
          const mouth = trainSmokestackMouth()
          const stackX = trainX + mouth.x
          const stackY = trainY + mouth.y

          for (let i = 0; i < TRAIN_SMOKE_COUNT; i++) {
            // Fan the puffs out a little so the burst reads as a puffy
            // cloud rather than one blob — same idea as the Send Mail
            // envelopes' per-particle spread, just vertical here since
            // smoke rises rather than being thrown.
            const spread = i / (TRAIN_SMOKE_COUNT - 1) - 0.5
            const obj = k.add([
              k.sprite('smokePuff'),
              k.pos(stackX, stackY),
              k.anchor('center'),
              k.z(TRAIN_Z + 1),
              k.opacity(1),
              k.scale(0.7 + i * 0.12),
            ])

            if (reducedMotion) {
              // No rise, no drift — the puffs simply appear already spread
              // apart above the stack and hold there.
              obj.pos.x = stackX + spread * TRAIN_SMOKE_REDUCED_SPREAD
              obj.pos.y = stackY - Math.abs(spread) * 3
            }

            smokePuffs.push({
              obj,
              age: 0,
              life: reducedMotion
                ? TRAIN_SMOKE_REDUCED_LIFE_SECONDS
                : TRAIN_SMOKE_LIFE_SECONDS + i * TRAIN_SMOKE_LIFE_STAGGER,
              driftX: spread * TRAIN_SMOKE_DRIFT,
              riseY: TRAIN_SMOKE_RISE_SPEED + i * TRAIN_SMOKE_RISE_STAGGER,
            })
          }
        }

        // One light puff from the stack while the train is under way — the
        // "while it moves" half of the smoke behaviour, distinct from
        // `spawnSmoke`'s fuller burst on arrival. Pushed into the same
        // `smokePuffs` array, so it ages, drifts and gets destroyed by the
        // exact same `updateSmoke`/`clearSmoke` every other puff does —
        // nothing new to track or leak.
        const spawnTrailPuff = (trainX: number, trainY: number): void => {
          const mouth = trainSmokestackMouth()
          const stackX = trainX + mouth.x
          const stackY = trainY + mouth.y
          const obj = k.add([
            k.sprite('smokePuff'),
            k.pos(stackX, stackY),
            k.anchor('center'),
            k.z(TRAIN_Z + 1),
            k.opacity(1),
            k.scale(0.55),
          ])
          smokePuffs.push({
            obj,
            age: 0,
            life: TRAIN_MOVING_SMOKE_LIFE_SECONDS,
            driftX: 0,
            riseY: TRAIN_SMOKE_RISE_SPEED,
          })
        }

        const updateSmoke = (dt: number): void => {
          for (let i = smokePuffs.length - 1; i >= 0; i--) {
            const puff = smokePuffs[i]
            puff.age += dt
            const progress = puff.age / puff.life

            if (progress >= 1) {
              puff.obj.destroy()
              smokePuffs.splice(i, 1)
              continue
            }

            if (!reducedMotion) {
              puff.obj.pos.y -= puff.riseY * dt
              puff.obj.pos.x += puff.driftX * dt
            }
            // Fades across the whole life, unlike the mail envelopes' late
            // fade — smoke thins from the moment it leaves the stack.
            puff.obj.opacity = 1 - progress
          }
        }

        // Removes the temporary train object and clears the "active" state
        // the stacking guard below checks — called both on natural
        // completion and would be equally safe to call from anywhere else,
        // since it's idempotent when `train` is already null. Any smoke
        // still drifting is left alone — it finishes fading on its own via
        // `updateSmoke`, independent of the train object it came from.
        const despawnTrain = (): void => {
          train?.obj.destroy()
          train = null
        }

        const spawnTrain = (): void => {
          // A train is already on screen — ignore the request rather than
          // stacking a second one. The contextual button's own ~10s cooldown
          // (see `ContextualActionButton`) is the first line of defence;
          // this is the belt-and-braces guard at the game layer itself.
          if (train) return

          const startX = reducedMotion ? stationCenterX : entryX
          const obj = k.add([
            k.sprite('train'),
            k.pos(startX, trackY),
            k.anchor('center'),
            k.z(TRAIN_Z),
            'train',
          ])
          // No k.area()/k.body() — a train with no collider physically
          // cannot block the player, regardless of where it visually sits.
          train = {
            obj,
            phase: reducedMotion ? 'reducedHold' : 'entering',
            timer: 0,
            hornPlayed: false,
            smokeTimer: 0,
          }

          // Reduced motion skips 'entering' entirely — the train is already
          // at the platform the instant it appears, so this is the one and
          // only moment it "reaches the station".
          if (reducedMotion) spawnSmoke(obj.pos.x, obj.pos.y)
        }

        updateTrain = (dt: number): void => {
          updateSmoke(dt)
          if (!train) return

          // Reduced motion: skip the cross-screen animation entirely — the
          // train simply appears already stopped at the station, sits for a
          // shorter beat, and is gone. Smoke already puffed on arrival (see
          // `spawnTrain`); only the horn is still pending here.
          if (train.phase === 'reducedHold') {
            train.timer += dt
            if (!train.hornPlayed && train.timer >= TRAIN_REDUCED_HORN_DELAY_SECONDS) {
              playTrainHorn()
              train.hornPlayed = true
            }
            if (train.timer >= TRAIN_REDUCED_HOLD_SECONDS) despawnTrain()
            return
          }

          if (train.phase === 'entering') {
            const dx = stationCenterX - train.obj.pos.x
            const dist = Math.abs(dx)
            // Eases from full cruise speed down to a minimum as it nears the
            // station, rather than stopping abruptly.
            const speedFactor = Math.max(TRAIN_MIN_SPEED_FACTOR, Math.min(1, dist / TRAIN_SLOW_RADIUS))
            const step = Math.min(dist, TRAIN_CRUISE_SPEED * speedFactor * dt)
            train.obj.pos.x += Math.sign(dx) * step
            // A light trailing puff every `TRAIN_MOVING_SMOKE_INTERVAL_SECONDS`
            // while under way — subtracting rather than zeroing keeps the
            // cadence steady instead of drifting a frame late each time.
            train.smokeTimer += dt
            if (train.smokeTimer >= TRAIN_MOVING_SMOKE_INTERVAL_SECONDS) {
              train.smokeTimer -= TRAIN_MOVING_SMOKE_INTERVAL_SECONDS
              spawnTrailPuff(train.obj.pos.x, train.obj.pos.y)
            }
            if (dist <= 1) {
              train.obj.pos.x = stationCenterX
              train.phase = 'holding'
              train.timer = 0
              // Reaches the station: smoke puffs immediately, the horn
              // follows partway through the hold (see `updateTrain`'s
              // 'holding' branch below), and it leaves once the hold's
              // existing `TRAIN_HOLD_SECONDS` timer runs out.
              spawnSmoke(train.obj.pos.x, train.obj.pos.y)
            }
            return
          }

          if (train.phase === 'holding') {
            train.timer += dt
            if (!train.hornPlayed && train.timer >= TRAIN_HORN_DELAY_SECONDS) {
              playTrainHorn()
              train.hornPlayed = true
            }
            if (train.timer >= TRAIN_HOLD_SECONDS) {
              train.phase = 'leaving'
              // Starts the departure's trailing smoke cadence fresh, rather
              // than carrying over whatever was left of the arrival's timer.
              train.smokeTimer = 0
            }
            return
          }

          // 'leaving' — accelerates back up to cruise speed and continues in
          // the same direction it arrived, off the opposite edge of the map.
          const traveled = train.obj.pos.x - stationCenterX
          const speedFactor = Math.max(TRAIN_MIN_SPEED_FACTOR, Math.min(1, traveled / TRAIN_SLOW_RADIUS))
          train.obj.pos.x += TRAIN_CRUISE_SPEED * speedFactor * dt
          train.smokeTimer += dt
          if (train.smokeTimer >= TRAIN_MOVING_SMOKE_INTERVAL_SECONDS) {
            train.smokeTimer -= TRAIN_MOVING_SMOKE_INTERVAL_SECONDS
            spawnTrailPuff(train.obj.pos.x, train.obj.pos.y)
          }
          if (train.obj.pos.x >= exitX) despawnTrain()
        }

        // Published so the contextual action button can fire this, the same
        // way `interactFn` publishes the interact action above.
        triggerTrainFn = spawnTrain
        clearTrainSmokeFn = clearSmoke
      }
    }

    // --- Plant More ----------------------------------------------------
    let updateGarden: (dt: number) => void = () => {}
    {
      // `true` once a tile has a cluster on it, so one click never plants a
      // second cluster on the same tile. Reset as a set when the finished
      // garden is cleared below.
      const planted = PLANT_MORE_TILES.map(() => false)
      /** Every flower currently in bloom, so the whole bed can be cleared at once. */
      const flowers: GameObj[] = []
      let plantedCount = 0
      /** Seconds left of the "look at the full garden" beat, or null when not full. */
      let gardenHold: number | null = null

      // Clears the finished garden in one go and frees the bed for another
      // fifteen. Flowers are destroyed together rather than each on its own
      // timer, which is what makes the bed fill up visibly as you plant.
      const clearGarden = (): void => {
        for (const flower of flowers) flower.destroy()
        flowers.length = 0
        planted.fill(false)
        plantedCount = 0
        gardenHold = null
        callbacks.onGardenFullChange(false)
      }

      updateGarden = (dt: number): void => {
        if (gardenHold === null) return
        gardenHold -= dt
        if (gardenHold <= 0) clearGarden()
      }

      // Plants tile index `i`. Split out from `triggerPlantMoreFn` so it can
      // run either immediately (reduced motion — see below) or once the
      // player's walk to that tile finishes.
      const plantAt = (i: number): void => {
        const tile = PLANT_MORE_TILES[i]
        const x = tile.col * TILE_SIZE + TILE_SIZE / 2
        const y = tile.row * TILE_SIZE + TILE_SIZE / 2

        planted[i] = true
        plantedCount++
        flowers.push(
          k.add([
            // Cycling variants deterministically (not `Math.random()`) keeps
            // a reload-then-replant sequence identical, matching the rest
            // of this village's "seeded, not random" decoration philosophy.
            k.sprite(`flower-${i % FLOWER_VARIANTS}`),
            k.pos(x, y),
            k.anchor('center'),
            k.z(FLOWER_Z),
          ]),
        )

        // Bed full: hold the finished garden on screen for a beat, then
        // clear the lot and let the visitor start over.
        if (plantedCount >= PLANT_MORE_TILES.length) {
          gardenHold = GARDEN_FULL_HOLD
          callbacks.onGardenFullChange(true)
        }
      }

      triggerPlantMoreFn = (): void => {
        // The bed is full and about to be cleared — ignore clicks until it
        // is. The button is already showing its "garden is full" state by
        // then; this is the game-layer backstop.
        if (gardenHold !== null) return
        // A walk to a previous click's tile hasn't finished yet — ignore
        // this click rather than queuing a second destination.
        if (autoWalk) return

        for (let i = 0; i < PLANT_MORE_TILES.length; i++) {
          if (planted[i]) continue
          const tile = PLANT_MORE_TILES[i]
          const x = tile.col * TILE_SIZE + TILE_SIZE / 2
          const y = tile.row * TILE_SIZE + TILE_SIZE / 2
          // Never target a tile the player is already standing on.
          if (Math.hypot(player.pos.x - x, player.pos.y - y) < PLANT_MORE_PLAYER_CLEARANCE) continue

          if (reducedMotion) {
            // No walking animation under reduced motion — plant immediately,
            // exactly as before this phase.
            plantAt(i)
          } else {
            // Walk to the tile first; the flower blooms once the player
            // actually arrives, rather than appearing instantly wherever
            // they happened to be standing.
            autoWalk = { targetX: x, targetY: y, elapsed: 0, onArrive: () => plantAt(i) }
          }
          return
        }
        // Every remaining tile is currently blocked by the player — treat
        // this click as a no-op rather than erroring or planting elsewhere.
      }
    }

    // --- Drop Feed ----------------------------------------------------
    // Looked up by `contextualAction`, the same pattern as the train station
    // above — moving the farm in `village.ts`/`locations.ts` needs no change
    // here.
    let updateFeed: (dt: number) => void = () => {}
    {
      const farmLocation = LOCATIONS.find((location) => location.contextualAction === 'dropFeed')
      const farmRect = farmLocation ? findTileRect(farmLocation.symbol) : null

      if (farmRect) {
        const left = farmRect.col * TILE_SIZE
        const width = farmRect.cols * TILE_SIZE
        // Off to one side of the farm's bottom edge, on the open street tile
        // south of it — the farm's own tiles are solid, so the pile (and the
        // chickens gathering around it) need to sit on ground they can
        // actually stand on.
        const pileX = left + width * 0.8
        const pileY = (farmRect.row + farmRect.rows) * TILE_SIZE + TILE_SIZE / 2

        let pile: GameObj | null = null
        /** Seconds left before the pile is removed and the session ends. */
        let feedTimer: number | null = null

        const despawnPile = (): void => {
          pile?.destroy()
          pile = null
          feedTimer = null
        }

        const spawnFeed = (): void => {
          // A feeding session is already active — ignore the request rather
          // than dropping a second pile. Belt-and-braces guard, same idea as
          // the train's `if (train) return`; the contextual button's own 8s
          // cooldown is the first line of defence.
          if (pile) return

          pile = k.add([k.sprite('feedPile'), k.pos(pileX, pileY), k.anchor('center'), k.z(FLOWER_Z)])
          // The scenery knows how far each chicken has to run, so it owns the
          // timing: the pile stays until the slowest one has finished its
          // peck. (Chickens then walk home on their own; that needs no pile.)
          feedTimer = scenery.feedChickens(pileX, pileY)
        }

        updateFeed = (dt: number): void => {
          if (feedTimer === null) return
          feedTimer -= dt
          if (feedTimer <= 0) despawnPile()
        }

        // Published so the contextual action button can fire this, the same
        // way `triggerTrainFn`/`triggerPlantMoreFn` do.
        triggerDropFeedFn = spawnFeed
      }
    }

    // --- Send Mail -----------------------------------------------------
    // Looked up by `contextualAction` like the three interactions above, so
    // moving the post office needs no change here. Purely decorative: this
    // sends no email of any kind, it only throws pixel envelopes out of the
    // chimney the facade actually draws.
    let updateMail: (dt: number) => void = () => {}
    {
      const postOfficeLocation = LOCATIONS.find(
        (location) => location.contextualAction === 'sendMail',
      )
      const postRect = postOfficeLocation ? findTileRect(postOfficeLocation.symbol) : null

      if (postRect) {
        const left = postRect.col * TILE_SIZE
        const top = postRect.row * TILE_SIZE
        const width = postRect.cols * TILE_SIZE
        // Straight from the drawn flue — `postOfficeChimneyMouth()` is the
        // same geometry the brickwork is painted from.
        const mouth = postOfficeChimneyMouth(width)
        const chimneyX = left + mouth.x
        const chimneyY = top + mouth.y

        interface Envelope {
          obj: GameObj
          /** Seconds this envelope has been in the air. */
          age: number
          /** Total seconds before it is removed. */
          life: number
          /** Sideways drift, world px/sec — negative blows left. */
          driftX: number
          /** Upward speed, world px/sec. */
          riseY: number
          /** Sine wobble that bends the climb into a curve. */
          swayPhase: number
          swaySpeed: number
          swayWidth: number
        }

        const envelopes: Envelope[] = []

        const clearEnvelopes = (): void => {
          for (const envelope of envelopes) envelope.obj.destroy()
          envelopes.length = 0
        }

        const spawnMail = (): void => {
          // Envelopes are still in the air — ignore the click rather than
          // adding a second batch. With the button's own 3s cooldown in
          // front of it, this is what makes "repeated clicks cannot create
          // unlimited envelopes" true at the game layer too.
          if (envelopes.length > 0) return

          // Five to eight per burst, varied per activation but cycled rather
          // than randomised, matching the village's seeded-decoration habit.
          const count = MAIL_BURST_SIZES[mailBurst % MAIL_BURST_SIZES.length]
          mailBurst++

          for (let i = 0; i < count; i++) {
            // Fan the batch out: each envelope leans a little further from
            // its neighbour and climbs at its own rate, so no two trace the
            // same arc. Runs -0.5 (hard left) to +0.5 (hard right); every
            // burst size is at least five, so this never divides by zero.
            const spread = i / (count - 1) - 0.5
            const obj = k.add([
              k.sprite('envelope'),
              k.pos(chimneyX, chimneyY),
              k.anchor('center'),
              k.z(MAIL_Z),
              k.opacity(1),
            ])

            envelopes.push({
              obj,
              age: 0,
              life: reducedMotion
                ? MAIL_REDUCED_HOLD_SECONDS
                : MAIL_LIFE_SECONDS + i * MAIL_LIFE_STAGGER,
              driftX: spread * MAIL_DRIFT_SPREAD,
              riseY: MAIL_RISE_SPEED + i * MAIL_RISE_STAGGER,
              swayPhase: i * 1.1,
              swaySpeed: MAIL_SWAY_SPEED + i * 0.35,
              swayWidth: MAIL_SWAY_WIDTH,
            })

            // Reduced motion: no flight at all. The envelopes simply appear
            // clustered just above the chimney, hold, and vanish.
            if (reducedMotion) {
              obj.pos.x = chimneyX + spread * MAIL_REDUCED_CLUSTER_WIDTH
              obj.pos.y = chimneyY - MAIL_REDUCED_CLUSTER_LIFT - Math.abs(spread) * 4
            }
          }
        }

        updateMail = (dt: number): void => {
          if (envelopes.length === 0) return

          for (let i = envelopes.length - 1; i >= 0; i--) {
            const envelope = envelopes[i]
            envelope.age += dt
            const progress = envelope.age / envelope.life

            if (progress >= 1) {
              envelope.obj.destroy()
              envelopes.splice(i, 1)
              continue
            }

            if (!reducedMotion) {
              // Curved path: a steady climb that slows as it goes, a
              // sideways drift, and a sine wobble laid over the top.
              const climb = envelope.riseY * (1 - progress * 0.55) * dt
              envelope.obj.pos.y -= climb
              envelope.obj.pos.x +=
                envelope.driftX * dt +
                Math.cos(envelope.swayPhase + envelope.age * envelope.swaySpeed) *
                  envelope.swayWidth *
                  dt
            }

            // Fade out over the back half of the flight, so they thin into
            // nothing instead of blinking off.
            envelope.obj.opacity = progress < 0.5 ? 1 : 1 - (progress - 0.5) / 0.5
          }
        }

        // Published for the contextual action button, same as the others.
        triggerSendMailFn = spawnMail
        // Destroying the game mid-flight must not leave objects behind;
        // `k.quit()` tears the scene down anyway, but this keeps the local
        // bookkeeping honest if the handle is reused.
        clearMailFn = clearEnvelopes
      }
    }

    let facing: Direction = 'down'
    let playingAnim: string | null = null
    const camera = k.vec2(player.pos.x, player.pos.y)
    // Seed the camera before the first frame so nothing pops; the update loop
    // re-resolves the zoom every frame from there. `currentZoom` is the
    // smoothed value the update loop eases toward `targetZoom` — starting it
    // at the real base zoom means the first frame never has to catch up.
    let currentZoom = zoomForWidth(canvas.clientWidth)
    k.setCamScale(currentZoom)
    k.setCamPos(camera)

    const stopWalking = (): void => {
      if (playingAnim === null) return
      player.stop()
      player.frame = idleFrame(facing)
      playingAnim = null
    }

    k.onUpdate(() => {
      if (paused) {
        stopWalking()
        cue.opacity = 0
        setPrompt(null)
        // Hides the contextual button while an overlay is open, same as the
        // interaction prompt above.
        setContextualAction(null)
      } else {
        // --- input / auto-walk ------------------------------------------
        if (autoWalk) {
          // "Plant More" is walking the player to the flower's tile.
          // Keyboard/touch input is ignored while this runs — it's a brief,
          // deliberate walk, not something the player needs to steer.
          autoWalk.elapsed += Math.min(k.dt(), MAX_FRAME_DELTA)
          const dx = autoWalk.targetX - player.pos.x
          const dy = autoWalk.targetY - player.pos.y
          const dist = Math.hypot(dx, dy)

          if (dist <= PLANT_MORE_PLAYER_CLEARANCE || autoWalk.elapsed >= AUTO_WALK_TIMEOUT) {
            stopWalking()
            const onArrive = autoWalk.onArrive
            autoWalk = null
            onArrive()
          } else {
            const delta = Math.min(k.dt(), MAX_FRAME_DELTA)
            stepPlayer(player, dx / dist, dy / dist, PLAYER_SPEED * delta)

            if (Math.abs(dy) > Math.abs(dx)) facing = dy < 0 ? 'up' : 'down'
            else facing = dx < 0 ? 'left' : 'right'

            const next = walkAnim(facing)
            if (playingAnim !== next) {
              player.play(next)
              playingAnim = next
            }
          }
        } else {
          const move = k.vec2(0, 0)
          if (KEY_BINDINGS.left.some((key) => k.isKeyDown(key))) move.x -= 1
          if (KEY_BINDINGS.right.some((key) => k.isKeyDown(key))) move.x += 1
          if (KEY_BINDINGS.up.some((key) => k.isKeyDown(key))) move.y -= 1
          if (KEY_BINDINGS.down.some((key) => k.isKeyDown(key))) move.y += 1

          // The D-pad is summed in rather than checked as an either/or, so a
          // tablet with a keyboard attached responds to both without one
          // input source cancelling the other out.
          move.x += touchMove.x
          move.y += touchMove.y

          if (move.x !== 0 || move.y !== 0) {
            // Normalise so diagonals aren't ~41% faster than orthogonals.
            const dir = move.unit()
            const delta = Math.min(k.dt(), MAX_FRAME_DELTA)
            stepPlayer(player, dir.x, dir.y, PLAYER_SPEED * delta)

            // Vertical input wins ties so the sprite doesn't flicker on diagonals.
            if (move.y < 0) facing = 'up'
            else if (move.y > 0) facing = 'down'
            else if (move.x < 0) facing = 'left'
            else facing = 'right'

            const next = walkAnim(facing)
            if (playingAnim !== next) {
              player.play(next)
              playingAnim = next
            }
          } else {
            stopWalking()
          }
        }

        // --- interaction cue -------------------------------------------
        const target = registry.nearest(player.pos.x, player.pos.y)
        if (target) {
          cue.opacity = 1
          cue.pos.x = target.x
          // The bob is the one piece of decorative motion in the world, so it
          // is the one thing dropped outright under reduced motion — the cue
          // still appears, it just sits still.
          const bob = reducedMotion ? 0 : Math.sin(k.time() * CUE_BOB_SPEED) * CUE_BOB_HEIGHT
          cue.pos.y = target.y - CUE_LIFT + bob
        } else {
          cue.opacity = 0
        }
        setPrompt(target ? target.label : null)

        // --- contextual action button ------------------------------------
        // Nearest-in-range special location, if any. Distance-based (not the
        // interaction registry) so it shows well before the player is close
        // enough to trigger a station, matching the camera zoom-in's feel.
        let nearestSpecial: ContextualActionId | null = null
        let nearestSpecialDistance = Infinity
        for (const special of specialActionRects) {
          const distance = distanceToRect(player.pos.x, player.pos.y, special.rect)
          if (distance < nearestSpecialDistance) {
            nearestSpecialDistance = distance
            nearestSpecial = special.id
          }
        }
        setContextualAction(nearestSpecialDistance <= SPECIAL_ACTION_RADIUS ? nearestSpecial : null)

        // Ambient life shares the player's freeze: a chicken strolling past a
        // paused world would give away that the pause is only skin deep. The
        // train freezes the same way — it resumes exactly where it left off
        // once the dialogue that paused it closes.
        const frameDelta = Math.min(k.dt(), MAX_FRAME_DELTA)
        scenery.update(frameDelta, k.time())
        updateTrain(frameDelta)
        updateFeed(frameDelta)
        updateMail(frameDelta)
        updateGarden(frameDelta)
      }

      // --- camera ------------------------------------------------------
      // Exponential smoothing: same feel at 30fps and 144fps, and it never
      // overshoots, so there is no jitter when the player stops. Under
      // reduced motion the constant is high enough that the camera is
      // effectively locked to the player instead of easing after them.
      const t = 1 - Math.exp(-cameraFollow * k.dt())
      camera.x += (player.pos.x - camera.x) * t
      camera.y += (player.pos.y - camera.y) * t

      // Base zoom is resolved per frame from the live canvas width, which
      // makes rotating a phone or dragging a window edge Just Work.
      // `clientWidth` is read rather than `k.width()` because it is
      // unambiguously CSS pixels — the number the breakpoint is expressed
      // in — whereas the engine's own width can track the backing store
      // instead.
      const baseZoom = zoomForWidth(canvas.clientWidth)

      // Zoom in a little whenever the player is near a building, and ease
      // back out when they walk away. Distance (not the interaction
      // registry) drives this, so it also responds while a station's own
      // trigger radius hasn't been reached yet.
      let nearestBuildingDistance = Infinity
      for (const rect of buildingRects) {
        const distance = distanceToRect(player.pos.x, player.pos.y, rect)
        if (distance < nearestBuildingDistance) nearestBuildingDistance = distance
      }
      const targetZoom =
        nearestBuildingDistance <= NEAR_BUILDING_RADIUS ? baseZoom * NEAR_BUILDING_ZOOM : baseZoom
      const zoomT = 1 - Math.exp(-zoomFollow * k.dt())
      currentZoom += (targetZoom - currentZoom) * zoomT
      k.setCamScale(currentZoom)

      // Keep the view inside the map so the void never shows.
      const halfWidth = k.width() / (2 * currentZoom)
      const halfHeight = k.height() / (2 * currentZoom)
      k.setCamPos(
        clamp(camera.x, halfWidth, WORLD_WIDTH - halfWidth),
        clamp(camera.y, halfHeight, WORLD_HEIGHT - halfHeight),
      )
    })

    // Everything is decoded, placed and positioned, and the camera is seeded.
    // Announcing readiness here rather than at the top of `onLoad` means the
    // loading screen never lifts on a half-built frame.
    callbacks.onReady()
  })

  return {
    resume: () => {
      paused = false
    },
    setTouchMove: (x: number, y: number) => {
      touchMove.x = x
      touchMove.y = y
    },
    triggerInteract: () => {
      interactFn?.()
    },
    // See the doc comment on `GameHandle` above: each is a separately-named
    // action so a later phase's animation has an obvious place to live
    // without touching the button plumbing (React-side cooldown, disabled
    // state, hide-while-dialogue-open) Phase 8 already wires up around it.
    // All four are real as of Phases 9 through 12.
    triggerIncomingTrain: () => {
      triggerTrainFn?.()
    },
    triggerPlantMore: () => {
      triggerPlantMoreFn?.()
    },
    triggerDropFeed: () => {
      triggerDropFeedFn?.()
    },
    triggerSendMail: () => {
      triggerSendMailFn?.()
    },
    destroy: () => {
      // Envelopes and smoke puffs are the interactions whose objects can
      // outlive a single frame with no world state anchoring them, so drop
      // any still in flight before the context goes.
      clearMailFn?.()
      clearTrainSmokeFn?.()
      k.quit()
      // `quit()` stops the loop but leaves Kaplay's module-level pointer to the
      // "current" context in place. Without clearing it, the next boot (e.g.
      // switching to classic view and back) logs "KAPLAY already initialized,
      // ... it may lead bugs!" and force-quits an already-dead context.
      // `_k` is part of Kaplay's public surface, but its `k` field is typed as
      // always-present, hence the cast.
      ;(k._k as unknown as { k: KAPLAYCtx | null }).k = null
    },
  }
}

/** Re-exported so the React layer can size things without importing the map. */
export { FRAME_SIZE, TILE_SIZE }
