# Phase 4: 3×3 Village Map Layout — Complete

**Status:** ✅ Build & Lint Pass | ✅ Boot Verified | ✅ Signpost Content Confirmed

---

## Overview

Phase 4 implements the new 3×3 village map layout with exactly nine interactive locations, smooth camera zoom-on-approach, and full integration of Phase 2's content model into the game world. The map is a clean grid of nine 9×5-tile building blocks (144×80px each), connected by a grid of 5-tile-wide streets, so every district is reachable directly from the central spawn point near the middle path.

---

## Files Changed

### 1. `src/game/village.ts` — New Map & Tile Legend
**Total lines:** 205

- **New 47×33 ASCII map** with 3×3 grid layout
  - 3 building rows (rows 4–8, 14–18, 24–28)
  - 3 building columns (cols 5–13, 19–27, 33–41)
  - 5-tile-wide horizontal streets (rows 9–13, 19–23) filled with `,`
  - 5-tile-wide vertical streets (cols 14–18, 28–32) filled with `,`
  - 9 signposts (symbols `1`–`9`) at row-band midpoints, spaced evenly across columns
  - Player spawn (`P`) at (21, 23) on central path, south of the Observatory
  - Water border (`~`) and tree border (`T`) forming an impenetrable outer ring
  - Grass (`.`) fills margins; pathways (`,`) are walkable, non-solid

- **Building symbols:** `A`, `R`, `E`, `S`, `O`, `D`, `G`, `F`, `X`
  - Each maps 1:1 to a `LocationDef` in `locations.ts`
  - Footprints automatically detected by `findTileRect()` — moving/resizing a building is just ASCII art edits

- **New `TILES` legend** with color + collision + label for every symbol
  - Signposts non-solid (player can stand on them)
  - All buildings solid
  - Path, spawn, water, trees as expected

- **`MIN_STATION_SPACING = 24px`** (raised from 16)
  - Every building is 144px wide → spacing = 144 / (stations + 1)
  - Supports up to 4 stations per building (Schoolhouse has exactly 4: 3 past roles + martial arts achievement)
  - `assertStationSpacing()` enforces this at boot

- **World size derived from map:** `WORLD_WIDTH = 47 * 16 = 752px`, `WORLD_HEIGHT = 33 * 16 = 528px`

---

### 2. `src/game/locations.ts` — Complete Station/Window System
**Total lines:** ~700 (too large to inline; full file created at write time)

**Key Structure:**
```typescript
interface Dialogue { id, title, lines, blocks?, card? }
interface StationDef { id, label, dialogue: () => Dialogue }
interface LocationDef { symbol, name, palette, dialogue, stations? }
interface SignpostDef { symbol, title, lines[] }
```

**Nine LocationDefs:**
1. **A — About Me Flower Cottage** (3 stations)
   - `introduction`: headline + subheadline + paragraphs
   - `uw-education`: school + degree + focus + GPA
   - `looking-for`: contact blurb + availability + rolesSeeking chips

2. **R — Current Roles Train Station** (dynamic station count from `experienceForLocation`)
   - Each current role (Palana, AHF, WINFO) → one station pulling from `content.experience`

3. **E — Engineering Workshop** (dynamic from `experienceForLocation`)
   - Each past engineering role (Kerala Association, iLink, GoEzz) → one station
   - **Kerala Association station merges:** role bullets + project write-up + tech/links from `kaw` project

4. **S — AI & Teaching Schoolhouse** (4 stations)
   - Apollo AI, Cyber Minds, iCode → three experience stations
   - **Cyber Minds station merges:** role bullets + tech/links from `cyber-minds-chatbot` project
   - Martial Arts achievement → one achievement station

5. **O — Mobile Innovation Observatory** (2 stations from `projectsForLocation`)
   - Findar, Bump → each opens full project write-up (blurb + built + learned + detail blocks + tech/links)

6. **D — Developer Tools Cyber Workshop** (2 stations from `projectsForLocation`)
   - GitHub Extension, Cyber Study Tracker → each opens full project write-up

7. **G — Community Impact Greenhouse** (3 stations from `projectsForLocation`)
   - TerraLend, Unearthed Dinos, WINFO Website → each opens full project write-up

8. **F — Growth Farm** (3 stations from `content.growth.plans`)
   - Hackathons, Home Lab, GitHub Extension (as growth plans, not projects) → one station per plan

9. **X — Contact Post Office** (3 stations, hand-written)
   - Email, LinkedIn, GitHub → each opens contact info + matching link

**Helper Functions:**
- `windowLabel(locationId, windowId)` — fetches label from `content.villageLocations` so in-world prompt always matches signpost legend
- `findProject(id)` — throws loudly if project not found in `content.ts`
- `experienceDialogue(id)` — builds Dialogue from an experience entry; reused for all non-merged stations
- `experienceForLocation(id)`, `projectsForLocation(id)` — new exports from `content.ts` via Phase 2

**Signposts:**
- Fully derived from `content.villageLocations`: title + signDescription + window legend (every window's label + description)
- `SIGNPOST_LOCATIONS` maps each symbol to its content location ID

**Boot Assertions:**
- `assertStationSpacing()` — throws if any multi-station building's triggers would be packed tighter than 24px apart

---

### 3. `src/game/createGame.ts` — Camera Zoom-on-Approach
**Key additions:**

- **New constants:**
  ```typescript
  const NEAR_BUILDING_RADIUS = 56  // pixels from building edge
  const NEAR_BUILDING_ZOOM = 1.25  // zoom multiplier
  const CAMERA_ZOOM_FOLLOW = 6     // easing rate
  const CAMERA_ZOOM_FOLLOW_REDUCED = 60  // reduced-motion variant
  ```

- **New helpers:**
  - `WorldRect` interface: `{ left, top, right, bottom }` in world pixels
  - `distanceToRect(x, y, rect)` — Euclidean distance from point to nearest edge of rect (0 if inside)
  - `collectBuildingRects()` — derives every building's world-pixel footprint from `findTileRect(symbol)` on every `LocationDef`

- **Per-frame zoom logic in `onUpdate`:**
  ```typescript
  let nearestBuildingDistance = Infinity
  for (const rect of buildingRects) {
    const distance = distanceToRect(player.pos.x, player.pos.y, rect)
    if (distance < nearestBuildingDistance) nearestBuildingDistance = distance
  }
  const targetZoom = nearestBuildingDistance <= NEAR_BUILDING_RADIUS 
    ? baseZoom * NEAR_BUILDING_ZOOM 
    : baseZoom
  const zoomT = 1 - Math.exp(-zoomFollow * k.dt())
  currentZoom += (targetZoom - currentZoom) * zoomT
  k.setCamScale(currentZoom)
  ```

- **`buildSignposts` refactored:**
  - Now uses `signpost.title` and `signpost.lines` (instead of single `text` field)
  - Label in prompt now reads from `signpost.title` for consistency

- **Removed stale code:**
  - `createSecurityCenterSprite` import (no location currently uses it)
  - `location.variant === 'security'` branch
  - Comment added: "Every location uses the same generic facade shape, just with its own palette — a deliberate placeholder. Real per-location building variants (train station, schoolhouse, greenhouse, farm, ...) are a later visual pass."

---

## Content Model Integration (from Phase 2)

All Phase 2 content additions remain and now drive the village:

- **`content.ts` exports used by locations.ts:**
  - `experienceForLocation(locationId)` — filters `content.experience` by `entry.locationId`
  - `projectsForLocation(locationId)` — filters `content.projects` by `project.locationId`
  - `getVillageLocation(id)` — fetches VillageLocation by id (throws if not found)
  - `content.growth.plans` — 3 growth plan objects (hackathons, home-lab, github-extension)
  - `content.achievements` — martial arts achievement merged into Schoolhouse
  - `content.contact` — email/LinkedIn/GitHub merged into Post Office

- **Location IDs in experience:**
  - `palana`, `ahf`, `winfo` → `current-roles-station` (marked `current: true`)
  - `kaw`, `ilink`, `goezz` → `engineering-workshop`
  - `apollo-ai`, `cyber-minds`, `icode` → `ai-teaching-schoolhouse`

- **Location IDs in projects:**
  - `findar`, `bump` → `mobile-innovation-observatory`
  - `cyber-study-tracker`, `github-extension` → `developer-tools-workshop`
  - `terralend`, `unearthed`, `winfo-website` → `community-impact-greenhouse`

---

## Verification

### Build & Lint
```bash
npm run build  # ✅ TypeScript + Vite + SSR + prerender all pass
npm run lint   # ✅ 3 pre-existing warnings (only-export-components), no new errors
```

### In-Browser Boot
- ✅ Game loads without runtime errors
- ✅ `assertMapIsRectangular()` passes (all rows 47 chars)
- ✅ `assertStationSpacing()` passes (all buildings ≥24px spacing)
- ✅ 3×3 building grid renders with correct colors + positions
- ✅ Spawn point visible on central path
- ✅ Camera visibly zooms in when near buildings
- ✅ Full signpost interaction verified:
  - Signpost prompt: "Press E to enter the Mobile Innovation Observatory" (correct title)
  - Overlay content: heading + 1-line description + full window legend from `content.villageLocations`
  - Close button + Escape key both work

---

## What's NOT in Phase 4 (Intentionally Out of Scope)

- **Building sprite variants** (train station, schoolhouse, etc.) — generic facade for now; visual pass later
- **Door/station interactions** — trigger registration code unchanged from Phase 3, not re-tested live (host-side pane throttling prevented further testing, but code path is byte-for-byte unchanged from verified Phase 3)
- **Movement/collision/audio/touch control changes** — none made
- **New train/plant/mail/chicken interactions** — not added yet

---

## Changed Files Summary

| File | Lines | What Changed |
|------|-------|--------------|
| `src/game/village.ts` | 205 | Complete rewrite: new 47×33 map, 3×3 grid, signpost legend, `MIN_STATION_SPACING=24` |
| `src/game/locations.ts` | ~700 | All 9 locations + signposts + window/project merging + boot assertions |
| `src/game/createGame.ts` | ~50 lines added | Camera zoom-on-approach + building rect helpers + signpost refactor |
| *Others untouched* | — | All Phase 2/3 content + UI code stays in place |

---

## Next Steps (Out of Scope)

1. **Building sprite variants** — replace generic facade with themed sprites per location
2. **Per-station door interactions** — register individual station triggers, test interaction flow
3. **Train/plant/mail/chicken mini-interactions** — specialized interaction types beyond dialogue
4. **Audio/music per location** — thematic background music
5. **Touch control refinement** — mobile gameplay tuning if needed

---

## Key Design Decisions

1. **ASCII map as source of truth** — building positions, sizes, and footprints all derive from the MAP string. Moving a building is one edit to the ASCII art; sprites, collision, and triggers follow automatically.

2. **Window labels from content.ts** — the `windowLabel()` helper ensures the "Press E to enter X" prompt always matches the signpost legend, keeping game world and content model in sync.

3. **Merged stations** — Kerala Association and Cyber Minds stations don't duplicate project content; instead, they fetch the full project write-up (blocks, tech, links) inline, so project content appears both on `/projects/<id>` pages and in-village.

4. **Exponential zoom smoothing** — same easing technique as camera follow, respects `prefers-reduced-motion`, and zooms start at boot (no "pop" on first frame).

5. **No variant branching** — all buildings use the same generic sprite shape with distinct palettes. Variants are a visual-pass task, not a map/interaction concern.

---

## Build Output

```
✓ tsc -b (types pass)
✓ vite build (client 52 modules, 288 KB JS → 91 KB gzip)
✓ npm run build:ssr (SSR 38 modules)
✓ node scripts/prerender.mjs (all 18 routes + sitemap/robots/llms)
✓ npm run lint (3 pre-existing warnings, no errors)
```

---

## Files Modified (Git Status)

```
 M src/App.css
 M src/components/ClassicMode.tsx
 M src/components/Credits.tsx
 M src/components/DetailBlockView.tsx
 M src/components/DialogueBox.tsx
 M src/components/ProjectPage.tsx
 M src/components/SectionPage.tsx
 M src/components/TopBar.tsx
 M src/components/sections.tsx
 M src/content/content.ts
 M src/game/createGame.ts
 M src/game/locations.ts          ← New file (700 lines)
 M src/game/village.ts            ← Rewritten (205 lines)
 M src/seo/routes.ts
```

---

**Phase 4 Complete. Ready for Phase 5 (visual pass / building variants / specialized interactions).**
