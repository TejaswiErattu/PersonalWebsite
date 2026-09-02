# Build prompt — port the old portfolio into the pixel village

Paste this whole file into Claude Code from the repo root.

---

## Context

This repo (`pixel-portfolio`) is a React + Vite + Kaplay portfolio with two views of the
same content:

- **Classic mode** — plain HTML at `/`, `/about`, `/projects`, `/experience`, `/education`,
  `/security`, `/achievements`, `/contact`, `/credits`. Prerendered to static HTML at build
  time by `scripts/prerender.mjs`.
- **Village mode** — `/play`. A Kaplay canvas. Eight buildings drawn from an ASCII map.
  Walk up to a door or a station, press <kbd>E</kbd>, a DOM dialogue box opens.

Everything rendered by both views comes from one file: `src/content/content.ts`.

**My old portfolio is still live at `https://tejaswierattuwebsite.vercel.app`** and has five
long-form project pages the new site does not have:

| Old URL | Media |
| --- | --- |
| `/projects/findar` | `/videos/findar-demo.mp4` (1.4 MB) |
| `/projects/bump` | `/videos/bump-demo.mp4` (2.2 MB) |
| `/projects/terralend` | `/videos/terralend-demo.mp4` (4.2 MB) |
| `/projects/unearthed` | `/videos/unearthed-demo.mp4` (3.0 MB) |
| `/projects/kaw` | `/kaw-recognition.jpg` (48 KB) — no video |

**The goal:** every one of those pages exists on the new site, in the new pixel UI, and is
readable *inside the village* by pressing <kbd>E</kbd> at the right house. Plus banners and
labels so a visitor can tell the buildings apart without walking into each one.

Work through the parts in order. Do not skip Part 1.

---

## Part 1 — Fix the bugs first

These were found by auditing the running site. Fix all of them before adding features.

### 1.1 (Critical) The homepage's primary button has invisible text

`src/App.css:595` declares `.classic a { color: var(--accent) }`. That selector has
specificity 0-1-1 and is defined *after* `.btn-primary` (0-1-0) at `src/App.css:552`. Both
landing buttons in `src/components/ClassicMode.tsx:41,44` are `<a>` elements inside
`.classic`, so the cascade overrides them:

- `.btn-primary` ("Start exploring") renders `#6fbf5e` text on a `#6fbf5e` background.
  Contrast ratio 1:1 — **the label is completely invisible.** Verified in the browser:
  computed `color` and `background-color` are both `rgb(111, 191, 94)`.
- `.btn-secondary` renders accent-green instead of `var(--ink)`.

Fix the cascade, do not just bump specificity blindly. Scope the link colour so it cannot
reach buttons — e.g. `.classic :where(a):not(.btn)`, or give `.btn` variants their own
`:where()`-free rule that wins. Then re-check every `<a>` in classic mode still reads as a
link.

**Add a regression guard:** a check that no element on any prerendered route has a computed
text colour equal to its own background colour. A tiny script over `dist/` or a Playwright
assertion is fine. This class of bug is invisible in code review and obvious in a browser.

### 1.2 (High) Canonical URL, sitemap and robots.txt all point at a dead domain

`src/seo/site.ts:11` sets `SITE_ORIGIN = 'https://tejaswierattutaj.vercel.app'`.
**That host returns 404.** Verified:

```
https://tejaswierattutaj.vercel.app/        -> 404
https://tejaswierattutajwebsite.vercel.app/ -> 404
https://tejaswierattuwebsite.vercel.app/    -> 200  (the OLD site)
```

`SITE_ORIGIN` feeds every canonical tag, every Open Graph `og:url`, the JSON-LD, all 10
`<loc>` entries in `sitemap.xml`, and the `Sitemap:` line in `robots.txt`. Right now every
one of them advertises a host that does not exist.

Ask me for the real production domain before changing this — do not guess. Once I give it,
change the single constant and rebuild.

### 1.3 (High) `WEBSITE` in content.ts disagrees with `SITE_ORIGIN`

`src/content/content.ts:114` sets `WEBSITE = 'https://tejaswierattuwebsite.vercel.app/'`
— the *old* site — while `SITE_ORIGIN` is a different host entirely. Two different answers
to "what is my website" in one repo. Resolve to one value derived from `SITE_ORIGIN`.

### 1.4 (High) Five "In-Depth Page" links point off-site to the old portfolio

In `src/content/content.ts`, the `findar`, `unearthed`, `terralend`, `kaw` and `bump`
projects each carry a link like:

```ts
{ label: 'In-Depth Page', href: 'https://tejaswierattuwebsite.vercel.app/projects/findar' }
```

The new site's own project pages currently link *away* to the site they replace. Part 2
builds those pages here; when it does, rewrite every one of these to an internal path
(`/projects/findar`, etc.). After Part 2, `grep -r "tejaswierattuwebsite" src/` must return
nothing.

### 1.5 (Medium) Station triggers are packed tighter than a player can aim

`buildBuildings()` in `src/game/createGame.ts` spaces stations evenly along a building's
bottom edge: `x = left + ((index + 1) * width) / (count + 1)`. `STATION_INTERACT_RADIUS` is
20 world px. Current spacing:

| Building | Width | Stations | Spacing | Verdict |
| --- | --- | --- | --- | --- |
| Library (`L`) | 7 tiles / 112 px | 7 | **14.0 px** | under one tile |
| Trophy Garden (`G`) | 8 tiles / 128 px | 8 | **14.2 px** | under one tile |
| Town Hall (`M`) | 8 tiles / 128 px | 7 | **16.0 px** | exactly one tile |
| Security Center (`S`) | 9 tiles / 144 px | 6 | 20.6 px | tight |
| Tech Lab (`B`) | 10 tiles / 160 px | 6 | 22.9 px | ok |

The player sprite is 16 px wide and walks at 78 px/s. At 14 px spacing you cannot reliably
stop in front of a *specific* shelf or trophy — `registry.nearest()` resolves the overlap
correctly, but the player has no way to aim. **Part 2 makes this much worse** by adding
sections per project.

Fix by enforcing a minimum spacing (roughly one tile, 16 px, plus the sprite width) and
widening the building's map footprint when the station count demands it. Add an assertion at
boot, next to `assertMapIsRectangular()`, that throws if any building's derived station
spacing falls below the minimum. That turns a silent feel problem into a build error.

### 1.6 (Medium) Mobile nav hides four links with no affordance

At 375 px the `.topbar-links` `<ul>` is `overflow-x: auto` with `scrollWidth` 717 vs
`clientWidth` 351. Achievements, Contact, Software resume and Security resume all sit off
screen with no fade, arrow, or scrollbar hinting that more exists. The page itself does not
overflow (good) — only the nav strip does, invisibly. Add a scroll affordance, or collapse
to a menu below a breakpoint. This gets worse when Part 2 adds project routes.

### 1.7 (Low) `.claude/launch.json` was added during the audit

I created it so the dev server could be driven from the browser tool. Keep it or delete it —
your call, just decide deliberately rather than leaving it as an unexplained file.

### Things that are NOT bugs — do not "fix" them

- **The village stalls at "Decoding sprites 0%" in a hidden/background tab.** This is
  intentional Kaplay behaviour: its main loop early-returns while
  `document.visibilityState !== 'visible'`, so the asset loader never advances and the canvas
  backing store stays 0×0. It resumes correctly the moment the tab is focused. I confirmed
  the village renders fine when visible. Leave it alone.
- `tsc -b` is clean, `oxlint` reports only three `only-export-components` fast-refresh
  warnings, and `npm run build` prerenders all 11 routes successfully. Keep it that way.

### What I could not verify

The browser pane was hidden for the whole session, which (per the point above) freezes the
Kaplay loop. I verified the village **renders** — buildings, player, scenery, camera clamp,
controls hint — by patching `document.visibilityState`, but I could **not** drive the player
with synthetic key events, so **the E-key interaction, the dialogue box, the typewriter, the
card phase, the cross-links and the touch D-pad were reviewed by reading the code only, not
by playing.** Manually play-test all of them before you trust them, and again after Part 2.

---

## Part 2 — Project detail pages

### 2.1 Data model

`content.ts` is the single source of truth and must stay that way. Its current `Project`
interface holds a blurb, tech list, four "built" bullets, impact and learned. The old pages
carry far more: a problem statement, a limitations list, a how-it-works walkthrough, feature
cards, an architecture breakdown, an ASCII pipeline diagram, a full tech stack, lessons and
next steps.

Extend `Project` with an optional `detail` field. Keep it optional — two projects have no
old page and should stay summary-only.

```ts
/** A block of long-form detail. Rendered by the project page and, one block
 *  per station, by the building's stations in the village. */
export type DetailBlock =
  | { kind: 'video'; src: string; caption: string; poster?: string }
  | { kind: 'image'; src: string; alt: string; caption?: string; width: number; height: number }
  | { kind: 'prose'; heading: string; paragraphs: string[] }
  | { kind: 'list'; heading: string; items: string[]; tone?: 'plain' | 'negative' }
  | { kind: 'steps'; heading: string; blurb?: string;
      steps: { title: string; body: string }[] }
  | { kind: 'cards'; heading: string; blurb?: string;
      cards: { title: string; body: string }[] }
  | { kind: 'columns'; heading: string; blurb?: string;
      columns: { title: string; items: string[] }[] }
  | { kind: 'stats'; heading?: string; stats: { value: string; label: string }[] }
  | { kind: 'code'; heading: string; blurb?: string; language: string; source: string }
  | { kind: 'table'; heading: string; columns: string[]; rows: string[][] }
  | { kind: 'chips'; heading: string; items: string[] }

export interface ProjectDetail {
  /** Small label above the title, e.g. "Native iOS App". */
  eyebrow?: string
  /** Hero paragraph — longer than `blurb`. */
  intro: string
  /** Badges next to the hero, e.g. "Built in 24 hours". */
  badges?: string[]
  blocks: DetailBlock[]
}
```

Add `detail?: ProjectDetail` to `Project`.

**Rules:** no prose in components; every word lives in `content.ts`. No block type invented
that the old pages do not use. If a block type is only needed once, still model it — do not
inline raw HTML.

### 2.2 Routes

Add one route per project that has a `detail`, at `/projects/<id>`:

`/projects/findar`, `/projects/bump`, `/projects/terralend`, `/projects/kaw`,
`/projects/unearthed`.

These paths deliberately match the old site's, so existing inbound links and anything I have
shared keep working.

- Add them to `src/seo/routes.ts` — that table already drives the router, the `<head>`
  manager, the prerenderer and the sitemap, so one entry per project gets all four.
  `RouteId` will need to accept project routes; a `project?: string` field alongside the
  existing `section?: SectionId` is the natural shape.
- Each needs a hand-written `title` (≤60 chars) and `description` (≤155 chars). Write them;
  do not template them off the project title.
- `matchRoute()` must resolve them, and `/projects/<unknown>` must fall through to the 404.
- `scripts/prerender.mjs` must emit static HTML for each.
- Verify after building: `dist/projects/findar/index.html` etc. exist and `sitemap.xml`
  lists all five.

Render them with a new `ProjectPage` component alongside `SectionPage`. Follow
`SectionPage`'s conventions exactly: the project title is the page's only `<h1>`, internal
headings start at `<h2>`, and the page carries the full section nav plus prev/next links
(previous/next project, wrapping out to `/projects` at the ends).

### 2.3 Media

Download the five assets from the old site into `public/` — do not hotlink:

```
public/videos/findar-demo.mp4       (1.4 MB)
public/videos/bump-demo.mp4         (2.2 MB)
public/videos/terralend-demo.mp4    (4.2 MB)
public/videos/unearthed-demo.mp4    (3.0 MB)
public/kaw-recognition.jpg          (48 KB)
```

Source URLs are `https://tejaswierattuwebsite.vercel.app` + the path above.

Video requirements:

- `<video controls muted playsinline preload="metadata">` — matches the old site and stops
  10 MB of video downloading on page load.
- Generate a poster frame for each (first frame is fine) so the player is not a black box
  before play. Add it as `poster`.
- Give each a visible `<figcaption>` — the caption text is on the old page.
- Add cache headers for `mp4` in `vercel.json`. The existing image rule
  (`/(.*)\.(png|jpg|jpeg|svg|webp|ico|woff2)`) does not cover video; add `mp4` to it or add a
  sibling rule.
- Total added weight is ~10.8 MB. It is all behind `/projects/*` routes and lazy by
  `preload="metadata"`, so it must not touch the homepage or `/play` budget. Confirm that.

### 2.4 Content to port — per project

**The old site is live. Transcribe the prose verbatim from it — do not paraphrase and do not
invent.** Fetch each page and work through it top to bottom. The outlines below are the
checklist: every bullet must land in `content.ts` as a `DetailBlock`.

#### `/projects/findar` — Findar
Eyebrow: none. Badge: "Built in 24 hours".
1. Hero intro paragraph + "View Source on GitHub"
2. **Demo** — video + caption
3. **The Problem** — 2 paragraphs
4. **Current Limitations** — 4 negative items
5. **How Findar Works** — blurb + 4 numbered steps (Voice Command / Object Detection
   (YOLOv8) / LiDAR Depth Mapping / Voice + Haptic Navigation)
6. **Key Features** — 6 cards
7. **Architecture** — blurb + 3 columns (Perception / Intelligence / Interaction), 4 items each
8. **The Real-Time Pipeline** — blurb + the ASCII `ARFrame →` diagram, as a `code` block
9. **Tech Stack** — 13 chips (note: `project.tech` currently lists only 8 — keep both, the
   short list feeds the summary card, the full list feeds the page)
10. **Smart Object Matching** — blurb + 4 steps (Voice Parsing / Exact Match / Synonym
    Lookup / Fuzzy Match)
11. **What I Learned** — 4 cards
12. **Future Vision** — blurb + 3 cards (Temporal Memory / Multi-Camera / Alexa Integration)
13. Closing CTA

#### `/projects/bump` — Bump
Eyebrow: "Native iOS App".
1. Hero intro + "View Source on GitHub"
2. **App Demo** — video + caption
3. **The Problem** — 2 paragraphs
4. **The Social Friction** — 4 negative items
5. **How Bump Works** — blurb + 6 cards
6. **App Experience** — blurb + 5 cards (Home / Map / Agent / Profile / Settings)
7. **Architecture** — blurb + 2 columns (Frontend 5 items / Backend 5 items)
8. **Tech Stack** — 12 chips
9. **Privacy-First Design** — blurb + 4 cards
10. Closing CTA

> **Discrepancy to resolve — ask me, do not silently pick one.** The old page's App
> Experience tabs are *Home, Map, **Agent**, Profile, Settings*, but
> `content.ts` (the `bump` project's fourth `built` bullet) says *Home, Map, **Friends**,
> Profile, Settings*. One of them is stale.

#### `/projects/terralend` — TerraLend
Eyebrow: "Climate-Aware FinTech".
1. Hero intro + "Live Demo" + "View Source"
2. **Demo Walkthrough** — video + caption
3. **The Problem** — 2 paragraphs
4. **Old System Limitations** — 4 negative items
5. **The TerraLend Solution** — blurb + 6 cards (Temperature Anomaly / Drought Index /
   Rainfall Anomaly / NDVI Vegetation Index / Interactive Map / Simulation Lab)
6. **Climate Archetypes** — blurb + 3 cards (Dust Bowl / The Deluge / Late Frost)
7. **Multi-Role Perspectives** — blurb + 3 cards (Loan Officer / Farmer / Simulation Lab)
8. **Satellite Data Layers** — blurb + 4 cards (NDVI / Soil Moisture / Temperature / Rainfall)
9. **Tech Stack** — 10 chips
10. **Old System vs. TerraLend** — a `table` block, 3 columns × 5 rows
11. Closing CTA → "Launch TerraLend"

#### `/projects/kaw` — Kerala Association of Washington
No eyebrow. Badges: "2,800+ records migrated", "Running in production", "Zero data loss".
**No video** — this one has an image instead.
1. Hero intro
2. **Recognition** — `/kaw-recognition.jpg` + caption. Needs real alt text describing what
   the photo shows, not the caption repeated.
3. **The Problem** — 2 paragraphs
4. **Data Challenges** — 5 negative items
5. **What I Built** — intro paragraph
6. **Plugin 1: CSV Migration Engine** — blurb + 6 numbered steps
7. **Plugin 2: Backup & Restore System** — blurb + 4 cards
8. **Architecture & Data Flow** — blurb + the ASCII `CSV Upload` pipeline as a `code` block
9. **Tech Stack** — 8 chips, each with a one-line descriptor
10. **By the Numbers** — 4 stats (2,800+ / 9 / 0 / 2)
11. **Code Highlights** — 3 PHP snippets, each with heading + explanatory blurb:
    Flexible CSV Column Matcher, Smart Update Logic, Password Expiration System.
    These must be real `<pre><code>` blocks — escaped, horizontally scrollable inside their
    own container, never causing the page body to scroll sideways.
12. **What I Learned** — 4 cards
13. **Next Steps** — 3 numbered items
14. Closing CTA

#### `/projects/unearthed` — Unearthed Dinos
Eyebrow: "FIRST LEGO League".
1. Hero intro + "Try the Live Site" + "View Source on GitHub"
2. **Site Walkthrough** — video + caption
3. **The Problem** — 2 paragraphs
4. **Challenges** — 4 negative items
5. **What I Built** — blurb + 6 cards
6. **The AI Chatbot** — blurb + 3 numbered layers (Local Site Search / Built-in FLL Knowledge
   Base / Web Search with consent)
7. **The Team** — blurb + 5 members, each with name, role and favourite dinosaur.
   These are real minors' first names, already public on the old site. Port them exactly as
   they appear — first names and roles only, no additions.
8. **Architecture** — blurb + 2 columns (Frontend 5 / Backend 5)
9. **Tech Stack** — 12 chips
10. **Team Awards** — blurb + 3 awards with the competition season
11. **Community Outreach** — 3 stats (120+ / 300+ / 3) with descriptions
12. **What I Learned** — 4 cards
13. Closing CTA

#### The two projects with no old page

`github-extension` and `cyber-minds-chatbot` have no in-depth page on the old site. Leave
them summary-only — `detail` stays undefined, no `/projects/<id>` route, no dead link. Do
not fabricate detail content for them. If I want pages for them later I will write the copy
myself.

### 2.5 The village side — E opens the real content

This is the part I care most about: **walking into a house should show the same information
as the old project page.**

Right now the Tech Lab has six stations and each one opens a `Dialogue` — a list of
`lines` typed out one at a time, then a single `card` with tech chips and links. **That
container cannot carry a project page.** A typewriter that reveals one sentence at a time
cannot show a video, a comparison table, a PHP snippet or a three-column architecture
breakdown. Do not try to flatten the detail blocks into `lines`.

Do this instead:

1. **Give each project its own room inside the Tech Lab.** One project = one door. Widen the
   Tech Lab's footprint in the `MAP` in `src/game/village.ts` so the doors respect the
   minimum spacing from §1.5. Each door's prompt reads the project name, so the on-screen
   hint becomes "Press E to enter the Findar Lab".

2. **Section each room by `DetailBlock`.** Inside a room, one station per block — or per
   logical group of blocks — so pressing E at the "Demo" terminal plays the video, E at the
   "Architecture" terminal shows the three columns, and so on. That is what makes it feel
   like the old page rather than a summary of it. Respect the §1.5 spacing rule; add tiles
   before you add stations.

3. **Extend the dialogue system to render blocks, not just text.** Add a second phase to
   `DialogueBox` (or a sibling `DetailPanel`) that renders a `DetailBlock` with the same
   pixel styling. Reuse the `card` phase's pattern: lines first, then rich content, then
   close.

   Non-negotiables, because the current box already gets these right and a rewrite will
   quietly lose them:
   - `useFocusTrap` keeps Tab inside the panel and restores focus to whatever opened it.
   - Esc closes; Space/Enter/E advance.
   - The world stays paused (`paused = true`) the whole time the panel is open.
   - The typewriter stays skippable — one press completes the line rather than forcing a wait.
   - The typed partial text stays `aria-hidden` with the complete line exposed alongside it,
     so screen readers announce whole sentences.
   - Keep the component keyed by `dialogue.id` so swapping content restarts at line one.
   - A video inside the panel must pause and reset when the panel closes. A muted video
     still playing behind a closed overlay is a bug.

4. **Every room links out to its full page.** The last screen of each room offers
   "Read the full write-up →" pointing at `/projects/<id>`. The village is the fun path; the
   page is the complete one. Nobody should have to walk the village to read everything.

5. **Keep the two views in sync by construction.** The village room and the project page must
   both be generated from the same `detail.blocks` array. If adding a block to `content.ts`
   does not automatically show up in both, the wiring is wrong — that is the property this
   codebase already has for `content.ts` and it must not regress.

---

## Part 3 — Banners and labels

Right now all eight buildings are near-identical houses. Only the Security Center has a
distinct facade. The Chicken Pen, the Mailbox and the Trophy Garden are all just houses. A
visitor cannot tell what anything is without walking into it, and the signposts render as
small brown squares that do not read as signposts. This is the single biggest usability
problem in the village.

1. **A hanging sign over every building's door**, showing the building name — Library, Cozy
   House, Tech Lab, Security Center, Trophy Garden, Chicken Pen, Town Hall, Mailbox. Drawn in
   the same generated-sprite style as everything else in `src/game/worldSprites.ts` (canvas,
   no PNGs) so it stays editable in code. Must be legible at both zoom levels —
   `CAMERA_ZOOM_DESKTOP = 2` and `CAMERA_ZOOM_COMPACT = 1.5`.

2. **A sub-label per station**, so inside the Tech Lab you can see which door is Findar and
   which is Bump without walking up to each. Small text over each door.

3. **Make the signposts look like signposts.** Give symbols `+` and `1`–`6` a real sprite —
   post plus board — instead of the flat brown tile they currently draw as. Note that `1`–`6`
   must stay non-solid; `village.ts` explains why, and that reasoning still holds.

4. **Distinguish the buildings visually.** Give the Chicken Pen a fence rather than a house
   facade, the Mailbox an actual mailbox, and the Trophy Garden something garden-shaped.
   `LocationDef.variant` already exists for exactly this (`variant: 'security'` is the
   precedent) — extend that union rather than adding a new mechanism.

5. **A banner on the project pages too**, not just in the village: each project page gets the
   `eyebrow` label above the title and the `badges` beside it, matching the old site.

6. **Update the village directory signpost.** The `+` sign currently reads
   "Library · Cozy House · Tech Lab · Security Center →" and does not mention the bottom row
   at all. Make it list everything.

Accessibility: the canvas is `role="application"` with an `aria-label`. Sign text painted
into the canvas is invisible to screen readers, so the labels must **not** become the only
way to know what a building is. Classic mode remains the accessible path — verify the
`aria-label` still describes the village accurately after this part.

---

## Part 4 — Acceptance criteria

Do not report done until all of these pass.

**Build and static checks**
- [ ] `npx tsc -b` clean.
- [ ] `npx oxlint` introduces no new warnings beyond the three existing
      `only-export-components` ones.
- [ ] `npm run build` succeeds and prerenders 16 routes (11 existing + 5 project pages).
- [ ] `grep -r "tejaswierattuwebsite" src/` returns nothing.
- [ ] `sitemap.xml` lists all five project pages and every `<loc>` uses the real production
      origin.
- [ ] Every `<video>` has `poster`, `preload="metadata"`, `playsinline`, `muted`, `controls`.

**Bugs from Part 1**
- [ ] "Start exploring" is readable — dark text on green.
- [ ] Automated check confirms no element has text colour equal to its background.
- [ ] The minimum-station-spacing assertion exists and passes for every building.
- [ ] Mobile nav shows an affordance that more links exist.

**Content fidelity — check each project against the live old page side by side**
- [ ] Every section listed in §2.4 exists on the new page, in the same order.
- [ ] Prose is verbatim, not paraphrased.
- [ ] All four videos play; the KAW recognition image loads with real alt text.
- [ ] The three PHP snippets on `/projects/kaw` are escaped correctly and scroll inside their
      own container — the page body never scrolls sideways at 375 px.
- [ ] TerraLend's comparison table renders as a real `<table>` and scrolls in its own
      container on mobile.

**The village — play it, do not just read the code**
- [ ] Every building's sign is legible at both zoom levels.
- [ ] Walking into the Tech Lab, each project room is reachable and each door's prompt names
      the project.
- [ ] Inside a room, each block-station opens the right content, and adjacent stations are
      individually selectable — you can stand in front of one and get that one.
- [ ] Video plays inside the panel and stops when the panel closes.
- [ ] Esc closes, Space/Enter/E advance, the typewriter is skippable.
- [ ] Tab is trapped in the panel and focus returns to the canvas on close.
- [ ] The world stays frozen while a panel is open — no chicken drifts past.
- [ ] Every room's last screen links to `/projects/<id>` and the link works.
- [ ] Touch D-pad and on-screen E still work at 375 px.

**Ask me, do not guess**
- [ ] The real production domain for `SITE_ORIGIN` (§1.2).
- [ ] Bump's fifth tab — "Agent" or "Friends" (§2.4).
