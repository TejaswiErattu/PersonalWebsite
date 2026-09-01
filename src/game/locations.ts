/**
 * WHERE YOU ADD NEW LOCATIONS.
 *
 * Every building on the map has one entry below. An entry ties together three
 * things: the map symbol it is drawn from, how it looks, and — optionally —
 * the dialogue it opens.
 *
 * To wire a building up, replace its `dialogue: null` with a function that
 * builds a `Dialogue` out of `content.ts`. That is the only change needed:
 * the sprite, the collision, the door trigger, the in-range cue and the
 * keyboard handling are all already generic and driven by this list.
 *
 * Rules of thumb for writing dialogue:
 *   - Pull the words from `content.ts`. Never type prose in here, or the
 *     game and classic view will drift apart.
 *   - One line per speech bubble. Aim for two or three sentences each.
 */

import { content } from '../content/content'
import { makePalette, type BuildingPalette } from './worldSprites'

/** One screen of text. The dialogue box shows `lines` one at a time. */
export interface Dialogue {
  /** Matches the section id in content.ts, so both stay in step. */
  id: string
  title: string
  lines: string[]
}

export interface LocationDef {
  /** The character used for this building in the map in `village.ts`. */
  symbol: string
  /** Shown in the "Press E to enter…" prompt. */
  name: string
  palette: BuildingPalette
  /**
   * Builds the dialogue when the player interacts.
   *
   * `null` means the building is drawn and solid, but nothing happens when
   * you walk up to it — no cue, no prompt, no trigger registered.
   */
  dialogue: (() => Dialogue) | null
}

export const LOCATIONS: LocationDef[] = [
  {
    symbol: 'H',
    name: 'Cozy House',
    palette: makePalette('#c8763a', '#8c3f2a'),
    // ---------------------------------------------------------------
    // REFERENCE IMPLEMENTATION. Copy this shape for the others.
    // ---------------------------------------------------------------
    dialogue: () => ({
      id: 'about',
      title: 'Cozy House',
      lines: [
        content.about.headline,
        content.about.subheadline,
        ...content.about.paragraphs,
      ],
    }),
  },

  // --- Not wired up yet. Give each one a `dialogue` to bring it to life. ---
  {
    symbol: 'L',
    name: 'Library',
    palette: makePalette('#9a6b40', '#5d3a22'),
    // Suggested: content.education
    dialogue: null,
  },
  {
    symbol: 'B',
    name: 'Tech Lab',
    palette: makePalette('#5d6b80', '#37414f'),
    // Suggested: content.projects
    dialogue: null,
  },
  {
    symbol: 'S',
    name: 'Security Center',
    palette: makePalette('#6f4a6f', '#402940'),
    // Suggested: content.security
    dialogue: null,
  },
  {
    symbol: 'G',
    name: 'Trophy Garden',
    palette: makePalette('#a8863f', '#6b5327'),
    // Suggested: content.achievements
    dialogue: null,
  },
  {
    symbol: 'M',
    name: 'Town Hall',
    palette: makePalette('#8a6535', '#513a1f'),
    // Suggested: content.experience
    dialogue: null,
  },
  {
    symbol: 'X',
    name: 'Mailbox',
    palette: makePalette('#54748f', '#324759'),
    // Suggested: content.contact
    dialogue: null,
  },
  {
    symbol: 'C',
    name: 'Chicken Pen',
    palette: makePalette('#bda069', '#7d6540'),
    // Pure ambience — there is no matching section in content.ts.
    dialogue: null,
  },
]

/** Map symbols that a building sprite is drawn for, so tiles skip drawing them. */
export const BUILDING_SYMBOLS: ReadonlySet<string> = new Set(
  LOCATIONS.map((location) => location.symbol),
)
