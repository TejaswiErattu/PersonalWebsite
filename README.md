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
npm run build    # type-check and produce a production build in dist/
npm run preview  # serve the production build
npm run lint     # oxlint
```

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
  components/          Canvas host, top bar, landing screen and classic view
```

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

## Status

Early work in progress. The village, movement, collision, camera, top bar and
classic view are in place. Building interiors, dialogue, mobile controls and
sound are not built yet, and buildings currently render as placeholder blocks.
