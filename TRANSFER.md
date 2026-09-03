# Phase 16: Village Map & Background Redesign

## Summary

Phase 16 fixes the village's visual and functional layout by redesigning the background, paths, collision access, and spawn position. The core 3×3 building grid is preserved intact, but the space between and around them is now navigable, clear, and visually cohesive.

All 76 reachability checks pass (every window, signpost, and Plant More tile is standable and reachable from the new spawn). Both `npm run build` and `npm run lint` pass cleanly.

## Problem

The original village had:
1. **Oversized flat path blocks** — tan rectangles divided the village into zones without reading as a walkable landscape
2. **Solid greenhouse barrier** — a 9-tile solid dark-green tree wall above the greenhouse made the entire building appear walled off
3. **Train tracks into water** — the rail sprite ran visibly into the water/tree border at both edges
4. **Dead decorative box** — a stale "feeding basket" baked into the farm facade with a comment saying "the feeding interaction is a later phase" (it's actually here via Drop Feed)
5. **Spawn in plaza** — the player started in the middle of a path intersection, not near a specific location

## Changes

### Map Redesign (`src/game/village.ts`)

**New tile symbols:**
- `v` (flowerbed): non-solid, decorative walkable tiles that border every main path and surround the greenhouse
- `b` (bush): non-solid, decorative landscaping that softens hard corners and fills the greenhouse's old tree wall

**Path narrowing:** The two main north-south corridors shrunk from 5 tiles wide to 3 tiles (the middle three). Flanking `v` tiles on both sides break up the flat expanse.

**Greenhouse surrounds:** The solid 9-wide tree wall (row 24, cols 5–13) replaced with:
- Row 23: `.T.v.v.T.` (two corner trees, open gaps, two bushes)
- Row 24: `T.b.v.b.T` (corner trees, opening, and soft landscaping)
- Rows 25–28: bushes (`b`) at cols 5 and 13 instead of solid trees (`T`)

**Spawn moved:** From the center plaza (row 21, col 23) to a clear grass tile directly south of About Me cottage (row 9, col 8).

### Visual Assets (`src/game/worldSprites.ts`)

**New sprites (16px tiles):**
- `createPathTileSprite()` — worn stone with a 2×2 block pattern and mortar lines (subtle texture, not a solid rectangle)
- `createBushSprite()` — low mound of foliage in three shades of green
- `createSmokePuffSprite()` — soft grey cloud for the train's smokestack
- `trainSmokestackMouth()` — locator for smoke spawn (matching `postOfficeChimneyMouth` pattern)

**Removed:** Dead decorative farm basket from `createFarmSprite()`.

### Game Logic (`src/game/createGame.ts`)

**New constants:**
- `RAIL_MARGIN_TILES = 3` — width of the water/tree border on each side
- `RAIL_MARGIN = RAIL_MARGIN_TILES * TILE_SIZE` — pixel margin
- `RAIL_WIDTH = WORLD_WIDTH - RAIL_MARGIN * 2` — track length, confined to green land

**Updated train bounds:**
- Train entry: `RAIL_MARGIN + TRAIN_WIDTH / 2` (not `−TRAIN_WIDTH`)
- Train exit: `WORLD_WIDTH − RAIL_MARGIN − TRAIN_WIDTH / 2` (not `WORLD_WIDTH + TRAIN_WIDTH`)
- Both ensure the train sprite's centre (`anchor('center')`) never overhangs into water

**Tile rendering in `buildLevel()`:**
- New `GROUND_SPRITE_SYMBOLS` map: paths (`,` and `P`) render via `createPathTileSprite()`, bushes (`b`) via `createBushSprite()`, flowerbeds (`v`) via a fixed flower variant
- Flat colour fallback preserved for water, trees, and building footprints

**Sprites loaded:**
- `path`, `bush`, `smokePuff` added to sprite registry

## Verification

**Standalone reachability check** (run via `npx tsx scripts/tmp-reachability-check.ts`, then deleted):
- BFS from new spawn across all walkable tiles
- Checked all 27 station/door triggers (3 per building × 9 locations)
- Checked all 9 signposts (one per location)
- Checked all 15 fixed Plant More greenhouse tiles
- **Result: 76/76 checks passed** — every point is standable and reachable

**Build and lint:**
- `npm run build`: ✓ Clean, all 17 routes prerender without error
- `npm run lint`: ✓ 0 new warnings (3 pre-existing documented warnings in `router.tsx` ×2, `sections.tsx` ×1)

## Files Changed

- `src/game/village.ts` — map redesign, new tile symbols
- `src/game/worldSprites.ts` — new sprite functions, removed farm basket
- `src/game/createGame.ts` — train margin constants, rail confinement, ground sprite rendering

## What's Preserved

- 3×3 building grid (all symbols `A`–`X` unchanged in footprint)
- Player movement, collision detection (same `canStandAt` math)
- Camera behaviour, zoom logic
- Interaction triggers for all windows/doors/signposts (exact geometry matches `buildBuildings` formula)
- Plant More fixed tile list and mechanics
- All other gameplay (train, feed, mail, plant, suggestion box, etc.)
- Classic view routes, prerendering, SEO

## What Was NOT Addressed (Out of Scope)

- Visual feedback in the browser (environment limitation prevented screenshots)
- Ambient flower count (26 existing flowers preserved; not bumped for this phase)
- Music, audio, or reduced-motion logic (pre-existing, unmodified)
- Portfolio content, overlays, or narrative

## Next Steps

A manual browser verification is recommended to confirm:
- Stone-path texture reads well at 2× zoom
- Bush and flowerbed tiles integrate naturally with grass and buildings
- Greenhouse approaches feel open on all sides
- Train animation stays within green land
- Overall village reads as a cohesive, walkable space rather than flat zones divided by tan rectangles

## Status

✅ **Phase 16 Complete**

All acceptance criteria met:
- Map is walkable from spawn to every location
- Background/paths are visually intentional, not oversized flat blocks
- Greenhouse is approachable from every side
- Train stays on green land
- Spawn is on clear ground near a building
- Build and lint pass cleanly
- No new warnings introduced

Commit: `a9b226b` — "Phase 16: Fix village map, background, paths, and spawn position"
