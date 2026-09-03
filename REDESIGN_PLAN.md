# Redesign Plan — Phase 1 (Inspect & Plan Only)

No product code was changed in this phase. This document is the map for Phase 2+.

## 1. Current architecture summary

**Stack:** React 19 + TypeScript + Vite 8, Kaplay 3001 for the game canvas, a
hand-rolled ~100-line client router (no react-router), a build-time
prerenderer (`scripts/prerender.mjs` + `src/prerender-entry.tsx`) that emits
one static HTML file per route into `dist/`, plus a sitemap/robots/llms.txt
generator. Lint is `oxlint`; no test suite exists.

**Data flow (single source of truth):** `src/content/content.ts` holds every
word of portfolio prose as a typed `PortfolioContent` object. Two consumers
render it:
- **Game view** (`/play`): `src/game/locations.ts` maps each village
  building's map symbol to a `LocationDef` (single `dialogue` or multiple
  `stations`), built from `content.ts` fields only — never hand-typed prose.
  `DialogueBox.tsx` renders whatever `Dialogue` object a station returns.
- **Classic view** (`/`, `/about`, `/projects`, etc.): `src/components/sections.tsx`
  renders the same `content.ts` fields as semantic HTML, one component per
  section, shared between the full `/` page (`ClassicMode.tsx`) and each
  section's own route (`SectionPage.tsx`).
- Project long-form write-ups (`content.projects[].detail.blocks`) are
  rendered by **one shared component**, `DetailBlockView.tsx`, called both by
  `ProjectPage.tsx` (`/projects/<id>`) and by `DialogueBox.tsx` mid-dialogue —
  this is the mechanism the spec's "reuse DetailBlockView" instruction is
  asking to keep and lean on harder.

**Game internals:**
- `village.ts` — the 48×23 ASCII map (`MAP`), tile legend (`TILES`), world
  size derived from the map, `findTileRect()` (bounding box of a symbol —
  this is how a building's sprite size, door position, and collision
  automatically follow the ASCII art), `assertMapIsRectangular()`.
- `locations.ts` — `LOCATIONS[]` (one entry per building symbol) and
  `SIGNPOSTS[]` (one entry per signpost symbol), plus
  `assertStationSpacing()`, which throws at boot if a building's width can't
  fit its station count at ≥16px spacing (`MIN_STATION_SPACING` in
  `village.ts`).
- `worldSprites.ts` — procedural canvas-drawn building facades
  (`createBuildingSprite`, plus a `createSecurityCenterSprite` variant),
  scenery sprites (flowers, chickens, motes), and the "E" interaction cue.
  Everything is `fillRect`-only, no images downloaded.
- `sprites.ts` — the procedural 16×16, 4-direction × 4-frame player sheet.
- `scenery.ts` — seeded-RNG chicken/flower/mote placement and the chicken
  wander AI (`buildScenery` returns `{ update }`, driven from `createGame`'s
  frame loop).
- `collision.ts` — grid-exact AABB collision against the ASCII map
  (`canStandAt`), used by both the player and the chickens.
- `interactions.ts` — `InteractionRegistry`, a flat list of `{x, y, radius,
  onInteract}` with `.nearest()` resolving overlap so one keypress only ever
  fires one thing.
- `createGame.ts` — boots Kaplay onto a caller-owned canvas; owns the camera
  (exponential-smoothing follow + width-based zoom breakpoint), movement,
  the pause/resume contract with React, and wires `LOCATIONS`/`SIGNPOSTS`
  into the registry via `buildBuildings`/`buildSignposts`.

**React/game boundary:** `GameCanvas.tsx` creates the canvas, calls
`createGame()`, and owns two pieces of state driven by game callbacks:
`prompt` (nearest interactable's label) and `dialogue` (the open `Dialogue`
object, or null — this is what freezes the world). `DialogueBox.tsx` is the
**paged** overlay the spec replaces: three phases (`lines` → `blocks` →
`card`), typewriter text, one Space/E/Enter press per step.

**Navigation today:** `TopBar.tsx` renders one global nav from
`sectionRoutes` (About, Projects, Experience, Education, Security,
Achievements, Contact — 7 tabs) plus both resume links as separate tabs.
`ClassicMode.tsx` *also* renders its own `<nav className="classic-nav">`
with the same links, and `SectionPage.tsx`/`ProjectPage.tsx` render a third
copy of that nav plus a prev/next pager. That's the "two navigation bars"
problem the spec calls out — TopBar is global-only today, but every classic
page duplicates a second nav directly under it.

**SEO/prerendering:** `seo/routes.ts` is the one route table, read by the
client router, `useDocumentHead.ts` (per-navigation `<title>`/meta), the
prerenderer, and the sitemap/robots/llms.txt generators. `SITE_ORIGIN`
(`seo/site.ts`) is `https://tejaswierattutaj.vercel.app` — **the live
production site's domain**, currently used to derive `content.person.website`
and every absolute URL in OG/canonical/sitemap tags.

**Current build/lint status (this repo, this commit):**
- `npm run build` — **passes** (tsc -b, vite build, SSR build, prerender all
  succeed; 16 routes rendered).
- `npm run lint` — **passes**, 3 pre-existing warnings (`react/only-export-components`
  in `router.tsx` ×2 and `sections.tsx` ×1 — non-component exports living
  alongside components; harmless, pre-existing, not introduced by this task).

## 2. External project inspection results

Both folders were accessible; both were inspected read-only (no files
copied, no `.git`/`node_modules`/build output touched).

**`summer life website/`** — vanilla HTML/CSS/JS SPA (no framework, no
build step), Firebase for sync (`firebase-config.js`, `firebase-sync.js`).
**Its real displayed name is not "Summer Life."** `index.html` title is
`Cyber Study Tracker // Command Center` and its on-page `<h1>` reads
`SEC_OPS // STUDY_PLAN_2026`. The README calls it "Cybersecurity Summer
Study Plan Command Center." It's a personal cybersecurity-study scheduling
dashboard covering a June 13 – Sept 1, 2025 study plan (Security+, AWS,
PortSwigger, LeetCode Blind 75, a Palana project toggle), with a rollover
scheduling engine, Excel/CSV export (ExcelJS + FileSaver, CDN-lazy-loaded),
and a cyberpunk/hacker visual theme. **This is a spec-vs-reality conflict:**
the spec's conditional instruction ("if its real displayed name is `Summer
Life`... use `Summer Schedule` as a descriptive subtitle") doesn't apply as
written, since the code says otherwise. Per the spec's own "do not guess"
rule, Phase 2 should use the name the code actually shows (e.g. "Cyber
Study Tracker") rather than force "Summer Life" — **flagging this for your
confirmation before Phase 2 writes any copy.**

**`WINFO/winfoWebsite/WINFOwebsiteVersion1/`** — React 19 + Vite +
React Router DOM (client-side routing, unlike this repo's hand-rolled
router). Seven routes: Home, Hackathon, Events, Podcast, Officers,
Membership, Support. Content lives in `src/data/*.js`, kept separate from
JSX. Design tokens in `src/styles/variables.css`: soft violet `#9E80BD`,
blush pink `#FEB0BA`, lavender `#B7A3DF`; fonts Poppins/Inter/Caveat/Space
Mono. This matches the spec's live-link claim and gives Phase 2 factual
material (real stack, real page list, real design language) for the
WINFO Website window without inventing anything.

## 3. Files to edit, by spec area

**Content model (do first — everything downstream reads from it):**
- `src/content/content.ts` — extend, don't replace. Needs: (a) a way to mark
  which `experience` entries are "current" vs "past" (Palana today lives only
  in `content.security`, not `experience` — the new Train Station needs
  Palana + AHF + a *new* Women in Informatics entry, none of which coexist in
  one array today); (b) a new `Project` entry for the Cyber Study Tracker
  (Developer Tools window) and for the WINFO Website (Greenhouse window),
  both with **optional** `detail`/media fields per the spec's "must work
  before and after a video is added" requirement; (c) a `growth` content
  block (Hackathons / Home Lab / GitHub Extension growth plans) that doesn't
  exist yet; (d) signpost description text per location (heading + one-liner
  + window legend) as data, not hardcoded in `locations.ts`.
- `src/game/locations.ts` — rebuilt around 9 `LocationDef`s + 9
  `SignpostDef`s, all still deriving dialogue text from `content.ts` fields
  (matches the existing pattern exactly — no prose typed here).

**Navigation & classic pages:**
- `src/components/TopBar.tsx` — collapse to 5 links (About, Experience,
  Projects, Growth, Contact); move resume links into the Contact route
  instead of the top bar.
- `src/components/ClassicMode.tsx`, `src/components/SectionPage.tsx`,
  `src/components/ProjectPage.tsx` — remove the duplicate `<nav
  className="classic-nav">` from at least two of these three (TopBar stays
  the single nav; a lighter in-page jump list or prev/next pager can stay if
  it doesn't visually read as a second navbar).
- `src/components/sections.tsx` — likely needs a `GrowthSection` and updated
  grouping (`About` = intro + education; `Experience` = current + past
  roles); old routes (`/education`, `/security`, `/achievements`) should
  fold into the five sections while keeping their compatibility routes
  alive (see §5).
- `src/seo/routes.ts` — route table update: keep old paths working (redirect
  or keep-alive per spec), no route deletions that orphan inbound links.

**Map, sprites, world:**
- `src/game/village.ts` — full ASCII map rewrite (3×3, 9 locations, wider
  buildings, `MIN_STATION_SPACING` raised to 24px), new `TILES` legend
  entries, new world dimensions (derived automatically once `MAP` changes).
- `src/game/worldSprites.ts` — new building-facade variants (cottage variant
  already close to default; train station, workshop, schoolhouse/dojo,
  observatory, cyber workshop, greenhouse, post office, farm structures),
  plus sprites for the train, envelopes, feed pile, and extra flower
  placement tiles.
- `src/game/sprites.ts` — recolor the player (pink palette), same 4×4 sheet
  geometry, same frame indices, no architecture change.
- `src/game/scenery.ts` — extend (not duplicate) with `feedChickens()`: a
  new chicken state (feed-seeking → gathering → pecking → wandering) driven
  by the existing per-frame `update()`, plus grid-safe waypoints so chickens
  can't get stuck behind buildings.
- `src/game/collision.ts` — likely unchanged (grid-exact logic is
  map-agnostic); revisit only if new tile symbols need new solidity rules.
- `src/game/interactions.ts` — likely unchanged; the registry API already
  supports arbitrary triggers (signposts, stations, and the new plots/farm
  interactions all register the same way).
- `src/game/createGame.ts` — the biggest game-layer diff: camera zoom-in on
  building approach ("smoothly zoom... when the character approaches the
  front of a house"), the 4 contextual interactions (train, plant, feed,
  mail) with their cooldowns/object cleanup, and wiring the new
  `GameHandle` methods (`feedChickens()` passthrough, contextual action
  triggers) up to React.

**Dialogue → overlay system:**
- `src/components/DialogueBox.tsx` — effectively rewritten: drop typewriter,
  phases, and the paged advance loop; render `lines` + `blocks` (via
  `DetailBlockView`, already shared) + `card` all at once inside one
  scrollable panel. Keep `useFocusTrap`, `Escape`-to-close, and the
  `onCrossLink` mechanism (still needed for KAW/Cyber Minds cross-links).
- `src/components/DetailBlockView.tsx` — likely unchanged; it's already the
  reusable block renderer the spec wants leaned on.
- `src/App.css` (1,611 lines today) — new overlay layout rules (90–94% ×
  86–92% viewport, sticky header, scroll lock), new signpost/window plaque
  styling, contextual action button + cooldown states, dialogue-box rule
  removal (typewriter caret, phase counter, "Space next" hint).

**Video behavior:**
- `src/content/content.ts` `DetailBlock` video kind and its usages already
  match the required `<video>` attribute set closely (`DetailBlockView.tsx`
  video case currently omits `autoplay`/`loop`); needs the autoplay-on-open,
  pause-and-reset-on-close behavior added at the overlay level (likely a
  `useRef` + effect in the new overlay component, not in `DetailBlockView`
  itself, since that component is also used in `ProjectPage` where
  autoplay-on-mount is not desired the same way).

**Player/touch/contextual controls:**
- `src/components/TouchControls.tsx` — extend with the contextual action
  button slot ("above the movement controls without covering E").
- `src/components/GameCanvas.tsx` — wire the new contextual-action prop
  through to `TouchControls` and a desktop-only equivalent button.

**Unaffected (verified, not expected to change):**
`src/audio/*`, `src/hooks/useFocusTrap.ts`, `src/hooks/useIsTouchDevice.ts`,
`src/components/LoadingScreen.tsx`, `src/components/ControlsHint.tsx`,
`src/components/Credits.tsx` + `src/content/credits.ts`,
`src/components/NotFound.tsx`, `src/seo/structuredData.ts`,
`src/seo/useDocumentHead.ts`, `src/prerender-entry.tsx` (route-table-driven,
should keep working unmodified once `routes.ts` is updated),
`scripts/prerender.mjs`, `vite.config.ts`, `.oxlintrc.json`.

## 4. Safest implementation order

Mirrors the spec's §"Required implementation sequence" but sequenced to keep
`npm run build`/`npm run lint` green at every step rather than only at the
end:

1. **Content model first.** Extend `content.ts` with the new/changed fields
   (current-vs-past experience marking, WINFO Finance Director entry, Cyber
   Study Tracker + WINFO Website projects, growth plans, signpost text) —
   purely additive, doesn't touch the map or game yet. Classic pages don't
   need to render the new fields yet; this step just makes them exist and
   typecheck.
2. **Navigation consolidation** (`TopBar`, remove duplicate classic navs,
   `sections.tsx` regroup, `routes.ts` compatibility routes). This is
   React/DOM-only, testable in classic view without touching Kaplay at all,
   and de-risks the highest-visible "only one nav bar" acceptance item early.
3. **ASCII map redesign** (`village.ts`) with the new legend, spacing
   constant bump, and `findTileRect`-driven building footprints — done
   *before* sprites/locations, since `assertMapIsRectangular()` and
   `assertStationSpacing()` will immediately catch shape mistakes at boot.
4. **Building + farm sprite variants** (`worldSprites.ts`), wired to the
   still-old `locations.ts` symbols just enough to render and visually
   verify each facade before wiring real content.
5. **`locations.ts` rebuild**: 9 `LocationDef`s + 9 `SignpostDef`s, stations
   with plaques/colors, all pulling from the Step 1 content model.
6. **Overlay system** (`DialogueBox.tsx` rewrite + CSS): swap the paged
   renderer for the scrollable one, using the now-real dialogue content from
   Step 5 to validate against actual long-form blocks (Findar/Bump/KAW
   write-ups) rather than placeholder text.
7. **Video behavior** on top of the new overlay (autoplay/loop/reset/cleanup).
8. **Contextual interactions**: train, plant-more, drop-feed (extends
   `scenery.ts`), send-mail — each is additive to `createGame.ts` and
   independently testable/toggleable, so do them one at a time with a manual
   check (cooldown, object cleanup, reduced-motion fallback) between each.
9. **Player sprite recolor** — isolated, no dependency on anything else;
   safe to do any time, placed here so it doesn't block earlier visual
   verification of buildings against the *old* player sprite.
10. **Camera zoom-on-approach** — touches the per-frame camera math in
    `createGame.ts`; do this after the map/buildings are final so "front of
    a house" positions are stable.
11. **SEO/metadata pass**: confirm `routes.ts`, `sitemap`, structured data,
    and `SITE_ORIGIN` handling per §5 below.
12. **Full validation pass**: keyboard, touch, `prefers-reduced-motion`,
    mobile viewport, screen-reader labels — per the spec's own step 12.
13. **`npm run build` + `npm run lint`**, fix to zero errors.

## 5. Risky parts

- **`assertStationSpacing()` / `assertMapIsRectangular()` are boot-time
  throws, not lint warnings.** A map or station-count mistake won't show up
  as a diff nit — it'll crash the game at runtime. Treat every `village.ts`
  edit as needing an immediate `npm run dev` smoke test, not just a build.
- **Camera zoom-on-approach is new physics on top of exponential camera
  smoothing that currently has no concept of "target".** Getting the
  zoom-in/zoom-out transition to feel smooth (not fighting the existing
  `CAMERA_FOLLOW` easing, not causing jitter at radius boundaries, not
  breaking the `k.setCamScale` viewport-clamping math) is the single most
  finicky piece of new game code in this spec.
- **Chicken feeding pathfinding.** The spec explicitly forbids a second
  chicken system and asks for "lightweight grid-based pathfinding or safe
  walkable waypoints." The existing chicken AI has no pathfinding at all
  (it's wander-and-bounce-off-collision) — this is new logic, not an
  extension of an existing pattern, and is the likeliest place to introduce
  a chicken that gets stuck against a building.
- **Object lifecycle cleanup for 4 new animated systems** (train, envelopes,
  flowers, feed pile) inside a Kaplay scene that is destroyed/recreated on
  every classic↔village toggle (`GameHandle.destroy()`). Any interval/timeout
  not cleared in `destroy()` is a leak that compounds every time a visitor
  toggles views. Needs explicit tracking (arrays of spawned `GameObj`s,
  cleared on both natural animation-end and on unmount).
- **Splitting "Town Hall" experience entries across 3 new locations**
  (current-roles station, engineering-workshop past roles, schoolhouse past
  roles) while `experienceDialogue()` and Tech Lab's cross-links currently
  assume one flat `content.experience` list rendered from one building.
  Cross-link wiring (KAW, Cyber Minds) needs to keep pointing at the correct
  new building, not the old Town Hall.
- **Content-vs-spec conflicts requiring a human call**, flagged now rather
  than guessed at in Phase 2:
  - Summer Life naming (§2 above).
  - Women in Informatics has no `experience` entry today, only an
    `achievements` entry (`win-finance`) with different phrasing than the
    spec's window bullets — Phase 2 needs to decide whether it becomes a new
    `experience` entry, a new content shape, or both.
  - Palana currently exists only as `content.security`, not
    `content.experience` — Current Roles needs it as a first-class role
    alongside AHF and WINFO.
- **Overlay CSS at 1,611 existing lines in `App.css`.** The dialogue/overlay
  rules are deeply woven into that file (`.dialogue-*` classes used by the
  card/blocks/lines phases). Rewriting `DialogueBox.tsx`'s structure means a
  matching CSS rewrite, not just additions — risk of orphaned/dead selectors
  or conflicting z-index/layout rules if done piecemeal.
- **`prefers-reduced-motion` branches multiply.** Today it's one boolean
  read once at boot (`prefersReducedMotion()` in `createGame.ts`) gating
  camera follow speed and mote spawning. The spec adds *four more*
  reduced-motion branches (train, flowers — implicitly fine since they don't
  move, envelopes, feed). Each needs its own manual verification; there's no
  automated test coverage for any of this today.

## 6. Preservation strategy

- **Existing routes / classic pages:** `seo/routes.ts` stays the single
  route table. New sections (`Growth`) are additive entries; sections being
  folded (`/education`, `/security`, `/achievements`) keep their route
  entries and content (rendered inside the new grouped sections, or as
  standalone pages still reachable by direct URL/prev-next pager) rather
  than being deleted — satisfies "preserve their useful content... avoid
  broken inbound links." `SectionPage.tsx`/`ProjectPage.tsx` continue
  reading from the same route table and `sectionComponents` map, so as long
  as every old `SectionId` still resolves to a component, old URLs 200 as
  they do today.
- **Accessibility:** `useFocusTrap` (focus trap + restore-on-close) is kept
  verbatim in the rewritten `DialogueBox`; the canvas's `aria-label` and the
  `sr-only` classic-view link stay; new contextual action buttons get real
  `aria-label`s and keyboard access (not `tabIndex={-1}` like the decorative
  D-pad — these are functional, not a duplicate of an already-reachable
  action); signpost overlays reuse the same overlay component so they
  inherit the same a11y behavior automatically rather than needing a second
  implementation.
- **Movement & collision:** `village.ts`'s `TILES`/`MAP` contract and
  `collision.ts`'s grid-exact `canStandAt` are kept as-is; the redesign only
  changes *which* symbols occupy *which* cells, never the collision
  algorithm. `assertMapIsRectangular`/`assertStationSpacing` stay as the
  correctness guardrails they are today.
- **Videos:** the `<video>` element and its `DetailBlock` data shape are
  preserved; `ProjectPage.tsx`'s existing (non-autoplay) video rendering is
  left alone, and autoplay/loop/reset behavior is added only in the overlay
  path, scoped so it doesn't change how `/projects/<id>` pages behave
  outside the game.
- **SEO:** `SITE_ORIGIN` (`seo/site.ts`) — currently the **live production
  domain** — is explicitly **not modified**. Per the spec's own instruction,
  Phase 2 should introduce a separate local/dev-origin constant (e.g. reading
  `import.meta.env.DEV` to fall back to `http://localhost:5173`) rather than
  repointing `SITE_ORIGIN` itself, so `content.person.website`, canonical
  tags, OG tags, JSON-LD, and `sitemap.xml` keep resolving to the real
  portfolio's domain unless and until a new Vercel project exists.
  `structuredData.ts`, `useDocumentHead.ts`, and `prerender-entry.tsx` all
  derive from `routes.ts` + `site.ts`, so no direct edits to them should be
  needed — only their upstream data changes.

## 7. Checklist mapped to REDESIGN_SPEC.md

Every checkbox below is unimplemented as of this phase (inspection/planning
only) — listed so Phase 2 has a literal acceptance list to close out against.

- [ ] Village has exactly 8 themed buildings + 1 farm (currently 7 buildings
      + chicken pen, no farm) — **village.ts + locations.ts**
- [ ] Every location has a readable themed sign — **worldSprites.ts,
      locations.ts**
- [ ] Every signpost lists its windows/plots — **locations.ts SIGNPOSTS +
      new overlay renderer**
- [ ] Every window is visually distinct & individually targetable at ≥24px
      spacing — **village.ts (MIN_STATION_SPACING), worldSprites.ts**
- [ ] About house has no technical skills list — **content.ts About block**
- [ ] Current roles in the train station — **content.ts + locations.ts**
      (needs Palana + WINFO added to a "current roles" shape, per §5 risk)
- [ ] Past roles split between workshop & schoolhouse — **content.ts +
      locations.ts**
- [ ] Findar & Bump in the observatory — **locations.ts** (content already
      exists, relocation only)
- [ ] GitHub Extension & Summer Schedule in developer workshop —
      **content.ts (new project entry, real name TBD — see §2), locations.ts**
- [ ] TerraLend, Unearthed Dinos, WINFO Website in greenhouse —
      **content.ts (new WINFO project entry), locations.ts**
- [ ] KAW & Cyber Minds retain project-content access — **locations.ts
      cross-link wiring, preserved from current Tech Lab pattern**
- [ ] All overlays show content on one scrollable screen — **DialogueBox.tsx
      rewrite**
- [ ] No repeated Space presses required — **DialogueBox.tsx rewrite**
- [ ] Existing videos autoplay muted + loop — **overlay video handling**
- [ ] Closing an overlay pauses & resets its video — **overlay video
      handling**
- [ ] Player character is feminine and pink — **sprites.ts**
- [ ] Train arrives on button use — **createGame.ts, worldSprites.ts**
- [ ] Chickens run to feed on Drop Feed — **scenery.ts (feedChickens()),
      createGame.ts**
- [ ] Flowers appear with cooldown + session cap (≤12) — **createGame.ts,
      scenery.ts or a new planting module**
- [ ] Envelopes fly from post office chimney — **createGame.ts,
      worldSprites.ts**
- [ ] Growth suggestion opens a prefilled email — **new Growth
      section/component, content.ts**
- [ ] Only one navigation bar visible — **TopBar.tsx, ClassicMode.tsx,
      SectionPage.tsx, ProjectPage.tsx**
- [ ] Top nav = About, Experience, Projects, Growth, Contact — **TopBar.tsx,
      routes.ts, sections.tsx**
- [ ] Desktop/mobile/touch/keyboard/reduced-motion all verified — **manual
      pass, step 12**
- [ ] No animation creates unlimited objects — **createGame.ts cleanup
      discipline, §5 risk**
- [ ] Existing project routes & classic pages remain accessible —
      **routes.ts, §5 preservation**
- [x] `npm run build` succeeds — **already true on current main; must stay
      true after every phase**
- [x] `npm run lint` succeeds (3 pre-existing warnings, none new) —
      **already true on current main; must stay true after every phase**

## 8. What Phase 1 deliberately did not do

No files under `src/`, `public/`, `scripts/`, or config were modified. No
redesign, no Kaplay replacement, no deployment, no change to the live
`tejaswierattutaj.vercel.app` site or its `SITE_ORIGIN` constant. This
document and the git-tracked `REDESIGN_SPEC.md` are the only additions.
