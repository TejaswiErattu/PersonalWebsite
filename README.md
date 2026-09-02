# Pixel Portfolio

An explorable pixel-art village that doubles as my portfolio. Walk a character
around a small town and visit buildings that map to sections of my resume, or
skip the game entirely and read the same content as plain HTML.

Built with React, TypeScript, Vite and [Kaplay](https://kaplayjs.com/).

## Running locally

```bash
npm install
npm run dev
```

Vite prints the local URL when it starts (usually `http://localhost:5173`, or the
next free port).

Other scripts:

```bash
npm run build    # type-check, bundle, then prerender every route to static HTML
npm run preview  # serve the production build
npm run lint     # oxlint
```

> `npm run preview` uses Vite's SPA fallback, so it answers **every** path with
> `dist/index.html` and returns `200` for URLs that do not exist. That hides
> whether the per-route prerendered files are correct and makes the 404 page
> look like it returns the wrong status. To check routing the way production
> actually behaves, serve `dist/` with a static server that resolves
> `/about` to `dist/about/index.html` and returns a real `404`.

## Build pipeline

`npm run build` runs four steps in order:

1. `tsc -b` — type-check.
2. `vite build` — bundle the client into `dist/`.
3. `vite build --ssr src/prerender-entry.tsx` — build a Node-runnable copy of
   the app into `dist-ssr/`.
4. `node scripts/prerender.mjs` — import that copy, render every route to
   static HTML, and write the generated files.

Step 4 is what makes the site readable without JavaScript. It writes:

```
dist/index.html            the full classic-mode portfolio, not an empty div
dist/<section>/index.html  one prerendered document per route
dist/404.html              the not-found page, marked noindex
dist/sitemap.xml           every indexable route
dist/robots.txt            with a Sitemap: line
dist/llms.txt              a plain-text summary for AI tools
CREDITS.md                 generated from src/content/credits.ts
```

The React app hydrates over the prerendered markup, so the HTML a crawler reads
and the DOM a visitor sees are the same content.

## Controls

`W` `A` `S` `D` or the arrow keys to move.

Use **Classic view** in the top bar for a text-only version of the same content.
Every section is real HTML, so the portfolio stays readable without the canvas.

## Project layout

```
src/
  content/content.ts   Single source of truth for every section of the portfolio
  game/village.ts      ASCII map of the town, tile legend and world dimensions
  game/collision.ts    Grid collision lookups against the ASCII map
  game/sprites.ts      Player spritesheet, drawn procedurally at runtime
  game/createGame.ts   Kaplay bootstrap: level, player, movement, camera
  components/          Canvas host, top bar, section pages, credits, 404
  content/credits.ts   Every font, library and tool, with author and licence
  router.tsx           Small History API router (no routing dependency)
  seo/site.ts          Canonical origin and Open Graph constants
  seo/routes.ts        The route table: path, title, description, heading
  seo/structuredData.ts  Person JSON-LD
  prerender-entry.tsx  Server-rendered entry used by the prerender script
scripts/prerender.mjs  Writes the static HTML, sitemap, robots and llms.txt
```

### Routes

`src/seo/routes.ts` is the single source of truth for the route table. The
client router, the `<head>` manager, the prerenderer and the sitemap generator
all read from it, so adding a section means editing one file.

### Content

`src/content/content.ts` is the only place copy lives. Both the game and the
classic view read from it, so a section only ever has to be written once.

### The map

The village is an array of equal-length strings in `src/game/village.ts`, one
character per tile. `TILES` maps each character to a colour and whether it
blocks movement, so editing the town is a matter of editing text.

### Collision

Movement does not use a physics engine. Each frame the player's step is split
into sub-steps no larger than a quarter tile, and the X and Y axes are resolved
independently against the ASCII grid. Splitting the axes is what lets the player
slide along a wall instead of sticking to it, and sub-stepping means fast
movement cannot tunnel through a tile. The frame delta is clamped so a
backgrounded tab does not teleport the player on return.

## Deploying

Hosted on Vercel. `vercel.json` sets the build command, clean URLs and cache
headers, and is picked up automatically.

First time only:

```bash
npm i -g vercel
vercel login
vercel link
```

Deploy:

```bash
npm run build     # verify the build passes locally first
vercel --prod
```

Once the GitHub repo is connected in the Vercel dashboard, `git push` to the
default branch deploys on its own and the CLI is only needed for one-off builds.

If the site moves to a custom domain, update `SITE_ORIGIN` in `src/seo/site.ts`
and rebuild — canonical tags, the sitemap, `llms.txt` and the Open Graph URLs
are all derived from it.

## Credits and licensing

Site code is MIT (see `LICENSE`). Art and audio are generated at runtime by the
code rather than shipped as asset files. Third-party fonts and libraries keep
their own licences — see `CREDITS.md`, which is generated at build time, or the
Credits link in the top bar.

## Status

Playable and deployable. The village, movement, collision, camera, top bar and
classic view are in place, every building and signpost carries real dialogue,
and the world is drawn with generated pixel sprites. Touch controls, ambient
audio, a focus-trapped dialogue box and a reduced-motion pass are wired up.
Every route is prerendered to static HTML with its own title, description,
canonical and Person JSON-LD, and the whole site passes an automated WCAG 2.1
A/AA audit with zero violations.
