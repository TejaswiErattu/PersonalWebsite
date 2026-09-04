# Phases 18-20: Content Simplification, Overlay Redesign, Train & Audio

## Summary

Three phases, done back to back in one session:

- **Phase 18** — simplified and reorganized portfolio content (village + classic view).
- **Phase 19** — redesigned every popup/signpost overlay's visual design and usability.
- **Phase 20** — improved the train interaction and village audio.

**Status**: ✅ Complete. `tsc -b`, `npm run lint`, and `npm run build` all pass clean after every phase.

---

## Phase 18: Content Simplification

Scope: `src/content/content.ts` only (single source of truth) plus one small wiring change in `src/game/locations.ts`. No map, sprite, audio, or animation changes.

- Replaced the Introduction popup with a short, exploration-focused welcome message (`content.about.introduction`, a new field — decoupled from the classic About section's fuller bio, which was left untouched).
- Confirmed the "What I'm Looking For" window was already removed (Phase 17); no remnants found in the content model, signpost legend, or classic rendering.
- Simplified Current Roles content: Palana, Accountability & Hopeful Fridays, and Women in Informatics now read as short, general summaries instead of detailed bullet lists. Added a dedicated `PALANA_ROLE_SUMMARY`/`AHF_ROLE_SUMMARY`, keeping the original detailed `PALANA_BULLETS` intact for the separate classic Security section (out of scope).
- Simplified Kerala Association of Washington: rewrote the project's `detail` blocks, removing all 3 PHP code blocks and the exhaustive plugin breakdown down to an intro, the recognition photo, and 3 highlight cards.
- Simplified AI & Teaching content (Apollo AI, Cyber Minds, iCode); removed all "Roblox" references from iCode.
- Simplified Findar, Bump, TerraLend, Unearthed Dinos, WINFO Website, GitHub Extension, Cyber Study Tracker — each now reads as a short intro + 2-3 highlight cards + tech chips + real links/media, with the old architecture/pseudocode/exhaustive step blocks removed.
- Added tasteful "Media coming soon" placeholder blocks for projects without real media (GitHub Extension, Cyber Study Tracker, WINFO Website) — confirmed the renderer never shows a broken player for a missing block; this just makes the gap visible instead of silent.
- Removed "looking for" wording from the Contact blurb (post office and classic Contact section share the same field).
- No facts were invented; a "Summer Life" project named in the phase brief does not exist anywhere in the codebase, so nothing was created for it.

## Phase 19: Popup / Overlay Visual Redesign

Scope: `src/components/DialogueBox.tsx`, `src/App.css`, `src/game/locations.ts` (Dialogue data shape), `src/game/createGame.ts` (signpost dialogue wiring), plus one new file. No map, sprite, train animation, or content rewrites.

- **New file**: [`src/components/PixelIcon.tsx`](src/components/PixelIcon.tsx) — a small SVG component mirroring the same pixel glyphs `worldSprites.ts` draws on the canvas, so a popup's header icon and a signpost legend's markers read as the same visual language as the building, without touching sprite code.
- Extended the `Dialogue` type (`locations.ts`) with `subtitle`, `linesLabel`, `note`, `legend`, `contact`, `locationId`, `accent`, `icon`. Added a `LOCATION_THEME` map + `withTheme()` wrapper giving every location's popups a subtle, distinct accent colour + icon (About=pink/heart, Current Roles=blue/flag, Engineering=amber/gear, AI & Teaching=purple/cap, Mobile=indigo/pin, Dev Tools=rose/terminal, Greenhouse=green/leaf, Farm=olive/sprout, Contact=teal/mail) — deliberately separate from each building's own (often much darker) wall/sprite colour, so no sprite changed.
- Signposts now carry a `legend` (each entry borrowing its matching window's own accent/icon) instead of a flat description string.
- Panel now sizes to its own content (`height: auto` up to a cap) instead of a fixed 92%×89% box, plus a `.dialogue-compact` variant for one-line entries — no more one sentence in a huge empty screen.
- Grouped highlight lines get an accent-bar treatment; an eyebrow label ("Highlights") and a boxed `note` callout ("What I Learned" / "Next Step") give short entries real structure.
- Signpost legends: matching colour/icon marker + name + description per entry.
- Contact stations (Email/LinkedIn/GitHub) render as icon + description + action-button panels instead of a bare inline link.
- Verified via a temporary standalone preview harness (removed before finishing, per the existing project convention for testing when the game canvas can't boot in a backgrounded tab): initial focus, Tab-wrap, `role="dialog"`/`aria-modal`/`aria-label`, Escape, backdrop-click-to-close, body scroll lock, video autoplay/cleanup, and both desktop and 375px mobile viewports — no clipping/overflow on the largest or smallest dialogues.

## Phase 20: Train Interaction & Village Audio

Scope: `src/game/createGame.ts` (train state machine only) and `src/audio/engine.ts`. No map, sprite, or content changes.

- **New**: light trailing smoke puffs while the train is actually travelling (`'entering'`/`'leaving'` phases) — previously smoke only puffed on arrival. Reuses the existing `smokePuffs` tracking array and `updateSmoke`/`clearSmoke` cleanup, so nothing new can leak; naturally skipped under reduced motion since that path never enters `'entering'`/`'leaving'`.
- **New**: a sparse "sparkle" layer in the background audio bed — random notes from an A-major pentatonic (in tune with the pad's existing chord), played every ~3.5-7.5s as a soft chime, quieter than a UI blip. Fully procedural Web Audio (oscillator + gain envelope, `setTimeout`-scheduled); no audio files, no external service. Cancelled cleanly on `stopBed()`/`dispose()` — verified with rapid mute/unmute cycling in the browser, zero errors, no duplicate scheduling chains.
- Audited and confirmed (no changes needed): corrected train tracks stay on land, the Incoming Train button's 10s cooldown + the game-layer `if (train) return` re-entry guard, the one-shot mute-respecting arrival horn (`playTrainHorn()`, gated by `train.hornPlayed` and `prefs.muted`), the reduced-motion "appear stationary, sit briefly" path, and that no sound autoplays before a user gesture (`AudioContext` is only ever constructed from `AudioControl`'s click handler; default prefs are muted).
- Traced the train-track-vs-platform geometry precisely: the moving train is already horizontally centred exactly on the station and only 3px of clearance above the roofline — about as tight as it can safely get. The decorative "platform" art sits on the building's south (player-approach) face while the track runs in the quiet grass margin to the north, by original design, to keep the train from crossing the shared walkway in front of every station window. Confirmed this as already-aligned rather than relocating the track, since moving it south would introduce a new visual bug (the train driving over the player/interaction cues) to fix a cosmetic one.
- Confirmed the background music bed is an intentionally persistent, site-wide control (`AudioControl` lives in the always-mounted `TopBar`, not scoped to the game), so `GameHandle.destroy()` correctly leaves it running — and that train-specific sounds are self-contained, self-disconnecting oscillator graphs that can't leak regardless of when the game unmounts.

## Files Changed This Session

- `src/content/content.ts` — Phase 18 content simplification (see above)
- `src/game/locations.ts` — Phase 18 (`about.introduction` wiring) + Phase 19 (`Dialogue` type, `withTheme`, signpost `legend`)
- `src/components/DialogueBox.tsx` — Phase 19 overlay redesign
- `src/components/PixelIcon.tsx` — new, Phase 19
- `src/App.css` — Phase 19 overlay CSS
- `src/game/createGame.ts` — Phase 19 (signpost dialogue wiring) + Phase 20 (train trailing smoke)
- `src/audio/engine.ts` — Phase 20 (sparkle layer)

## What Was Not Touched (per each phase's scope)

- Map layout, collisions, paths, spawn position, building sprites, train animation timing/tracks, and music/audio architecture beyond the additions above
- Classic-mode component structure (`sections.tsx`, `ProjectPage.tsx`) — content flows through unchanged rendering
- `DetailBlockView.tsx` (shared write-up renderer) — untouched, still shared identically by the village overlay and `/projects/<id>` pages

## Status

✅ **Complete** — All three phases' requirements implemented and verified. Stopped after each phase as instructed.
