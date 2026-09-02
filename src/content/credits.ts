/**
 * Everything this site is built on that someone else made.
 *
 * This is the single source of truth: the in-app credits overlay, the
 * `/credits` page, and the generated CREDITS.md at the repo root all read from
 * here, so an entry can never be listed in one place and missing from another.
 *
 * A note on what is *not* here. There are no third-party sprite or audio
 * assets to credit, because there are none in the project — every sprite is
 * drawn with fillRect calls at runtime (`src/game/worldSprites.ts`,
 * `src/game/sprites.ts`) and every sound is synthesised through WebAudio
 * oscillators (`src/audio/engine.ts`). Listing an art pack the site does not
 * actually ship would be a false attribution, which is a worse failure than
 * omitting one: it credits work that was never used and misrepresents the
 * provenance of work that was.
 */

export interface CreditEntry {
  /** What it is, as a reader would recognise it. */
  name: string
  /** Who made it. */
  author: string
  /** Canonical home page or repository. */
  source: string
  /** SPDX identifier where one exists, else the licence's common name. */
  license: string
  /** Link to the licence text itself, so the terms are one click away. */
  licenseUrl: string
  /** What it is used for here. */
  usage: string
}

export interface CreditGroup {
  title: string
  entries: CreditEntry[]
}

export const creditGroups: CreditGroup[] = [
  {
    title: 'Typeface',
    entries: [
      {
        name: 'Press Start 2P',
        author: 'CodeMan38 (Cody Boisclair)',
        source: 'https://fonts.google.com/specimen/Press+Start+2P',
        license: 'SIL Open Font License 1.1',
        licenseUrl: 'https://openfontlicense.org/',
        usage:
          'Headings, the top bar, dialogue text and the loading screen. Served from Google Fonts with display=swap; body copy stays on the system UI stack.',
      },
    ],
  },
  {
    title: 'Runtime libraries',
    entries: [
      {
        name: 'KAPLAY',
        author: 'The KAPLAY team, originally Replit (Kaboom.js)',
        source: 'https://kaplayjs.com/',
        license: 'MIT',
        licenseUrl: 'https://github.com/kaplayjs/kaplay/blob/master/LICENSE',
        usage:
          'The game engine behind the explorable village — rendering, the game loop, input and sprite atlasing. Loaded only when you choose to play.',
      },
      {
        name: 'React and React DOM',
        author: 'Meta Platforms, Inc. and affiliates',
        source: 'https://react.dev/',
        license: 'MIT',
        licenseUrl: 'https://github.com/facebook/react/blob/main/LICENSE',
        usage: 'The interface shell, routing, classic mode and every overlay.',
      },
    ],
  },
  {
    title: 'Build tooling',
    entries: [
      {
        name: 'Vite',
        author: 'Evan You and Vite contributors',
        source: 'https://vite.dev/',
        license: 'MIT',
        licenseUrl: 'https://github.com/vitejs/vite/blob/main/LICENSE',
        usage: 'Development server, production bundling, code splitting and the SSR prerender pass.',
      },
      {
        name: 'TypeScript',
        author: 'Microsoft Corporation',
        source: 'https://www.typescriptlang.org/',
        license: 'Apache-2.0',
        licenseUrl: 'https://github.com/microsoft/TypeScript/blob/main/LICENSE.txt',
        usage: 'Every source file in this project.',
      },
      {
        name: 'oxlint',
        author: 'The Oxc project',
        source: 'https://oxc.rs/docs/guide/usage/linter.html',
        license: 'MIT',
        licenseUrl: 'https://github.com/oxc-project/oxc/blob/main/LICENSE',
        usage: 'Linting.',
      },
    ],
  },
]

/**
 * Work that is original to this project. Called out explicitly so a reader can
 * tell at a glance which parts are borrowed and which are not — the question
 * a credits page exists to answer.
 */
export const originalWork: { title: string; detail: string }[] = [
  {
    title: 'Pixel art',
    detail:
      'All sprites — the player, buildings, tiles, chickens, flowers and particles — are generated in code at runtime rather than loaded from an asset pack. No third-party art is used.',
  },
  {
    title: 'Sound',
    detail:
      'Every sound effect is synthesised in the browser with WebAudio oscillators and gain envelopes. There are no audio files in this project.',
  },
  {
    title: 'Photography',
    detail: 'The portrait photograph is my own.',
  },
  {
    title: 'Site code',
    detail:
      'Written for this project and released under the MIT licence. See LICENSE at the repository root.',
  },
]
