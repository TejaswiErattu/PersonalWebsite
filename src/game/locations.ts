/**
 * WHERE YOU ADD NEW LOCATIONS.
 *
 * Every building on the map has one entry below. An entry ties together three
 * things: the map symbol it is drawn from, how it looks, and — optionally —
 * the dialogue it opens.
 *
 * Two shapes of building exist:
 *   - Single-door (`dialogue`): one trigger centred on the bottom edge. This
 *     is the Cozy House pattern — copy it for a building with one topic.
 *   - Multi-station (`stations`): several triggers spaced along the bottom
 *     edge, one per topic, each opening its own dialogue. This is the
 *     Security Center / Tech Lab pattern — copy it for a building that holds
 *     more than one thing to read about. `registry.nearest()` still
 *     guarantees only the closest station ever responds, so packing several
 *     into one wall is safe.
 *
 * A location has exactly one of `dialogue` or `stations` populated; the other
 * stays `null` / `undefined`.
 *
 * Rules of thumb for writing dialogue:
 *   - Pull the words from `content.ts`. Never type prose in here, or the
 *     game and classic view will drift apart.
 *   - One line per speech bubble. Aim for two or three sentences each.
 *   - If a station's content already lives on another building (e.g. an
 *     experience entry that Town Hall will also show), don't retype it —
 *     add a `card.crossLink` and let `experienceDialogue()` build it once.
 */

import { content, type ContentLink, type DetailBlock } from '../content/content'
import { MIN_STATION_SPACING, TILE_SIZE, findTileRect } from './village'
import { makePalette, type BuildingPalette } from './worldSprites'

/**
 * The structured screen shown after a dialogue's lines finish: tech chips,
 * outbound links, and/or a hop to another building's content instead of
 * duplicating it.
 */
export interface DialogueCard {
  tech?: string[]
  links?: ContentLink[]
  crossLink?: { label: string; experienceId: string }
}

/** One screen of text. The dialogue box shows `lines` one at a time. */
export interface Dialogue {
  /** Matches the section id in content.ts, so both stay in step. */
  id: string
  title: string
  lines: string[]
  /**
   * A project's long-form write-up, paged through one block at a time after
   * `lines` finishes — the same `DetailBlock[]` the project's own
   * `/projects/<id>` page renders, via the same `DetailBlockView`. Shown
   * before `card`, if both are set.
   */
  blocks?: DetailBlock[]
  /** Shown after `blocks` (or after the last line, if there are none), in
   *  place of closing immediately. */
  card?: DialogueCard
}

/** One trigger inside a multi-station building (a terminal, a workstation). */
export interface StationDef {
  /** Stable id, combined with the building symbol to register uniquely. */
  id: string
  /** Shown in the "Press E to enter…" prompt. */
  label: string
  dialogue: () => Dialogue
}

export interface LocationDef {
  /** The character used for this building in the map in `village.ts`. */
  symbol: string
  /** Shown in the "Press E to enter…" prompt for single-door buildings. */
  name: string
  palette: BuildingPalette
  /** Selects a non-default facade. See `worldSprites.ts`. */
  variant?: 'security'
  /**
   * Builds the dialogue when the player interacts with a single-door
   * building. `null` means the building is drawn and solid, but nothing
   * happens when you walk up to it — no cue, no prompt, no trigger
   * registered (or that it uses `stations` instead).
   */
  dialogue: (() => Dialogue) | null
  /** Populated instead of `dialogue` for buildings with more than one topic. */
  stations?: StationDef[]
}

/** Shorthand for joining several existing content.ts strings into one beat. */
function join(items: string[]): string {
  return items.join(' · ')
}

export const LOCATIONS: LocationDef[] = [
  {
    symbol: 'H',
    name: 'Cozy House',
    palette: makePalette('#c8763a', '#8c3f2a'),
    // ---------------------------------------------------------------
    // REFERENCE IMPLEMENTATION. Copy this shape for single-door buildings.
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

  {
    symbol: 'L',
    name: 'Library',
    palette: makePalette('#9a6b40', '#5d3a22'),
    // ---------------------------------------------------------------
    // MULTI-STATION. One bookshelf per skill category, plus a degree
    // shelf and a competencies index.
    // ---------------------------------------------------------------
    dialogue: null,
    stations: (() => {
      const education = content.education

      const degreeShelf: StationDef = {
        id: 'degree',
        label: 'Degree Shelf',
        dialogue: () => ({
          id: 'education-degree',
          title: `${education.school}`,
          lines: [
            education.degree,
            `${education.focusArea} · Expected ${education.expectedGraduation} · GPA ${education.gpa}`,
          ],
        }),
      }

      // One shelf per `content.education.skills` category — same shape, so
      // no need to hand-write five near-identical station objects.
      const categoryShelves: StationDef[] = education.skills.map((group) => ({
        id: group.category.toLowerCase().replace(/[^a-z]+/g, '-'),
        label: `${group.category} Shelf`,
        dialogue: () => ({
          id: `education-${group.category}`,
          title: `${group.category} Shelf`,
          lines: [`${group.category} — ${group.items.length} skills.`, join(group.items)],
          card: { tech: group.items },
        }),
      }))

      const competenciesShelf: StationDef = {
        id: 'competencies',
        label: 'Core Competencies Shelf',
        dialogue: () => ({
          id: 'education-competencies',
          title: 'Core Competencies Shelf',
          lines: [
            'Every shelf in this room, indexed.',
            join(education.skills.map((group) => group.category)),
          ],
        }),
      }

      return [degreeShelf, ...categoryShelves, competenciesShelf]
    })(),
  },
  {
    symbol: 'B',
    name: 'Tech Lab',
    palette: makePalette('#5d6b80', '#37414f'),
    // ---------------------------------------------------------------
    // MULTI-STATION REFERENCE. Two wings, one station per project.
    // ---------------------------------------------------------------
    dialogue: null,
    stations: (() => {
      const findProject = (id: string) => {
        const project = content.projects.find((item) => item.id === id)
        if (!project) throw new Error(`Tech Lab station "${id}" has no matching project.`)
        return project
      }

      // Wing A: stand-alone builds — the full three-beat pattern, no cross-link.
      const wingA = [
        { id: 'findar', label: 'Findar Station' },
        { id: 'bump', label: 'Bump Station' },
        { id: 'unearthed', label: 'Unearthed Station' },
        { id: 'terralend', label: 'TerraLend Station' },
      ].map(({ id, label }) => {
        const project = findProject(id)
        return {
          id: project.id,
          label,
          dialogue: (): Dialogue => ({
            id: project.id,
            title: project.title,
            lines: [project.blurb, join(project.built), project.learned],
            blocks: project.detail?.blocks,
            card: { tech: project.tech, links: project.links },
          }),
        }
      })

      // Wing B: work that Town Hall also covers — cross-link instead of
      // repeating the same accomplishments in two buildings.
      const wingB = [
        {
          id: 'kaw',
          label: 'Kerala Platform Station',
          experienceId: 'kaw',
          crossLinkLabel: 'See my role at Kerala Association of Washington',
        },
        {
          id: 'cyber-minds-chatbot',
          label: 'Cyber Minds Station',
          experienceId: 'cyber-minds',
          crossLinkLabel: 'See my role at Cyber Minds Non-Profit',
        },
      ].map(({ id, label, experienceId, crossLinkLabel }) => {
        const project = findProject(id)
        return {
          id: project.id,
          label,
          dialogue: (): Dialogue => ({
            id: project.id,
            title: project.title,
            lines: [project.blurb, project.impact, project.learned],
            blocks: project.detail?.blocks,
            card: {
              tech: project.tech,
              links: project.links,
              crossLink: { label: crossLinkLabel, experienceId },
            },
          }),
        }
      })

      return [...wingA, ...wingB]
    })(),
  },
  {
    symbol: 'S',
    name: 'Security Center',
    palette: makePalette('#3a2f4a', '#241c30'),
    variant: 'security',
    // ---------------------------------------------------------------
    // MULTI-STATION REFERENCE. Six terminals sharing one Palana role.
    // ---------------------------------------------------------------
    dialogue: null,
    stations: (() => {
      const security = content.security
      const byline = `${security.role} · ${security.organization} · ${security.period}`
      const githubExtension = content.projects.find((item) => item.id === 'github-extension')
      if (!githubExtension) throw new Error('Security Center exhibit has no matching project.')

      return [
        {
          id: 'threat-model',
          label: 'Threat Model Terminal',
          dialogue: (): Dialogue => ({
            id: 'security-threat-model',
            title: 'Threat Model Terminal',
            lines: [
              security.bullets[0],
              byline,
              join(['Threat Modeling (STRIDE)', 'Zero Trust Architecture', 'IAM / Access Control']),
            ],
            card: { tech: ['Threat Modeling (STRIDE)', 'Zero Trust Architecture', 'IAM / Access Control'] },
          }),
        },
        {
          id: 'vulnerability',
          label: 'Vulnerability Terminal',
          dialogue: (): Dialogue => ({
            id: 'security-vulnerability',
            title: 'Vulnerability Terminal',
            lines: [
              security.bullets[1],
              byline,
              join(['Vulnerability Assessment', 'Incident Response', 'IAM / Access Control']),
            ],
            card: { tech: ['Vulnerability Assessment', 'Incident Response', 'IAM / Access Control'] },
          }),
        },
        {
          id: 'tooling',
          label: 'Tooling Terminal',
          dialogue: (): Dialogue => ({
            id: 'security-tooling',
            title: 'Tooling Terminal',
            lines: [security.bullets[3], security.bullets[4], byline],
            card: { tech: ['Semgrep', 'npm audit', 'Burp Suite'] },
          }),
        },
        {
          id: 'documentation',
          label: 'Documentation Terminal',
          dialogue: (): Dialogue => ({
            id: 'security-documentation',
            title: 'Documentation Terminal',
            lines: [
              security.bullets[2],
              byline,
              join([
                'Responsible AI / AI Risk Management',
                'Cryptography Fundamentals',
                'Network Security Fundamentals',
              ]),
            ],
            card: {
              tech: [
                'Responsible AI / AI Risk Management',
                'Cryptography Fundamentals',
                'Network Security Fundamentals',
              ],
            },
          }),
        },
        {
          id: 'github-extension',
          label: 'GitHub Extension Exhibit',
          dialogue: (): Dialogue => ({
            id: 'github-extension',
            title: githubExtension.title,
            lines: [githubExtension.blurb, join(githubExtension.built), githubExtension.learned],
            card: { tech: githubExtension.tech, links: githubExtension.links },
          }),
        },
        {
          id: 'skills-wall',
          label: 'Security Skills Wall',
          dialogue: (): Dialogue => ({
            id: 'security-skills',
            title: 'Security Skills Wall',
            lines: [byline, join(security.skills), join(security.certifications)],
            card: { tech: security.skills },
          }),
        },
      ]
    })(),
  },
  {
    symbol: 'G',
    name: 'Trophy Garden',
    palette: makePalette('#a8863f', '#6b5327'),
    // ---------------------------------------------------------------
    // MULTI-STATION. One trophy per `content.achievements` entry, plus
    // one plaque summarising `content.about.highlights`.
    // ---------------------------------------------------------------
    dialogue: null,
    stations: (() => {
      const trophies: StationDef[] = content.achievements.map((achievement) => ({
        id: achievement.id,
        label: `${achievement.title} Trophy`,
        dialogue: () => ({
          id: `achievement-${achievement.id}`,
          title: achievement.title,
          lines: [
            achievement.period
              ? `${achievement.detail} (${achievement.period})`
              : achievement.detail,
          ],
        }),
      }))

      const plaques: StationDef = {
        id: 'impact-plaques',
        label: 'Impact Plaques',
        dialogue: () => ({
          id: 'achievements-impact',
          title: 'Impact Plaques',
          lines: ['Impact, in numbers.', join(content.about.highlights)],
        }),
      }

      return [...trophies, plaques]
    })(),
  },
  {
    symbol: 'M',
    name: 'Town Hall',
    palette: makePalette('#8a6535', '#513a1f'),
    // ---------------------------------------------------------------
    // MULTI-STATION. One desk per `content.experience` entry, ordered
    // chronologically left to right so walking forward walks forward in
    // time. Every desk calls `experienceDialogue()` directly rather than
    // rebuilding the bullets, so it always shows the exact words Tech
    // Lab's cross-links point at.
    // ---------------------------------------------------------------
    dialogue: null,
    stations: (() => {
      // Chronological order, oldest first — content.experience itself is
      // newest first, so this list is the one place that order is fixed.
      const chronological = ['goezz', 'cyber-minds', 'ilink', 'apollo', 'icode', 'kaw', 'ahf']

      return chronological.map((id) => {
        const entry = content.experience.find((item) => item.id === id)
        if (!entry) throw new Error(`Town Hall desk "${id}" has no matching experience entry.`)
        return {
          id: entry.id,
          label: `${entry.company} Desk`,
          dialogue: (): Dialogue => {
            const dialogue = experienceDialogue(entry.id)
            if (!dialogue) throw new Error(`experienceDialogue() has no entry for "${entry.id}".`)
            return dialogue
          },
        }
      })
    })(),
  },
  {
    symbol: 'X',
    name: 'Mailbox',
    palette: makePalette('#54748f', '#324759'),
    // ---------------------------------------------------------------
    // SINGLE-DOOR. content.contact, packed entirely into the card so the
    // two lines read like a note and the links read like an address book.
    // ---------------------------------------------------------------
    dialogue: () => {
      const contact = content.contact
      return {
        id: 'contact',
        title: 'Mailbox',
        lines: [contact.blurb, contact.availability],
        card: {
          tech: contact.rolesSeeking,
          links: [
            { label: contact.email, href: `mailto:${contact.email}` },
            { label: contact.phone, href: `tel:${contact.phone.replace(/[^\d+]/g, '')}` },
            { label: 'LinkedIn', href: contact.linkedin },
            { label: 'GitHub', href: contact.github },
            ...contact.resumes,
          ],
        },
      }
    },
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

/** One waypost: a single solid map tile with a one-line dialogue, no card. */
export interface SignpostDef {
  /** The character used for this signpost in the map in `village.ts`. */
  symbol: string
  text: string
}

/**
 * Every signpost on the map, keyed by its own map symbol (`findTileRect`
 * resolves one symbol to one bounding box, so each signpost needs a symbol
 * of its own rather than sharing one). Placed at the gaps between building
 * footprints — the actual forks in the walkable space — plus the original
 * directory sign in the top yard.
 */
export const SIGNPOSTS: SignpostDef[] = [
  { symbol: '+', text: 'Village Directory: Library · Cozy House · Tech Lab · Security Center →' },
  { symbol: '1', text: '← Library            Cozy House →' },
  { symbol: '6', text: '← Cozy House            Tech Lab →' },
  { symbol: '2', text: '← Tech Lab            Security Center →' },
  { symbol: '3', text: '← Trophy Garden            Chicken Pen →' },
  { symbol: '4', text: '← Chicken Pen            Town Hall →' },
  { symbol: '5', text: '← Town Hall            Mailbox →' },
]

/**
 * Builds a Dialogue straight from one `content.experience` entry, by id.
 *
 * This is the cross-link target: Tech Lab's Kerala and Cyber Minds stations
 * call this instead of retyping those roles' bullets, and Town Hall's own
 * NPCs call it too, so both buildings always show the exact same words.
 */
export function experienceDialogue(id: string): Dialogue | null {
  const entry = content.experience.find((item) => item.id === id)
  if (!entry) return null

  return {
    id: `experience-${entry.id}`,
    title: `${entry.role} — ${entry.company}`,
    lines: [`${entry.company} · ${entry.location} · ${entry.period}`, ...entry.bullets],
  }
}

/**
 * Guards against station triggers packed tighter than the player can aim.
 *
 * `createGame.ts` spaces a multi-station building's triggers evenly along
 * its bottom edge: `spacing = width / (stations.length + 1)` — the same
 * formula duplicated here. If a building's footprint in `village.ts` isn't
 * wide enough for its station count, this throws at boot instead of
 * shipping stations a player can never stand distinctly in front of. Fix it
 * by widening the building's block in the ASCII map, or by giving it fewer
 * stations. Called once at game start, next to `assertMapIsRectangular()`.
 */
export function assertStationSpacing(): void {
  for (const location of LOCATIONS) {
    if (!location.stations) continue
    const rect = findTileRect(location.symbol)
    if (!rect) continue

    const width = rect.cols * TILE_SIZE
    const spacing = width / (location.stations.length + 1)
    if (spacing < MIN_STATION_SPACING) {
      throw new Error(
        `"${location.name}" packs ${location.stations.length} stations into ${rect.cols} ` +
          `tiles (${spacing.toFixed(1)}px apart, need ${MIN_STATION_SPACING}px). Widen its ` +
          `block in src/game/village.ts or reduce its station count.`,
      )
    }
  }
}

