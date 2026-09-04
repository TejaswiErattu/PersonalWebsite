/**
 * WHERE YOU ADD NEW LOCATIONS.
 *
 * Every building on the map has one entry below. An entry ties together three
 * things: the map symbol it is drawn from, how it looks, and the dialogue it
 * opens.
 *
 * Two shapes of building exist:
 *   - Single-door (`dialogue`): one trigger centred on the bottom edge.
 *   - Multi-station (`stations`): several triggers spaced along the bottom
 *     edge, one per topic, each opening its own dialogue. `registry.nearest()`
 *     still guarantees only the closest station ever responds, so packing
 *     several into one wall is safe.
 *
 * A location has exactly one of `dialogue` or `stations` populated; the other
 * stays `null` / `undefined`. Every location in the current 3x3 village is a
 * multi-station building — even the farm, whose "stations" are planting
 * plots rather than windows.
 *
 * Rules of thumb for writing dialogue:
 *   - Pull the words from `content.ts`. Never type prose in here, or the
 *     game and classic view will drift apart.
 *   - Station labels are pulled from `content.villageLocations` (the
 *     `windows` list authored in Phase 2), via `windowLabel()` below, so the
 *     in-world prompt ("Press E to enter <label>") always matches the name
 *     the signpost legend already promised.
 *   - If a station's content already lives on a project entry (e.g. an
 *     experience entry whose write-up is really a project's `detail`),
 *     merge the two rather than retyping either — see the Kerala Association
 *     and Cyber Minds stations below.
 */

import {
  content,
  contextualActions,
  experienceForLocation,
  getVillageLocation,
  projectsForLocation,
  type ContentLink,
  type DetailBlock,
} from '../content/content'
import { MIN_STATION_SPACING, TILE_SIZE, findTileRect } from './village'
import {
  makePalette,
  type BuildingPalette,
  type BuildingVariant,
  type IconId,
} from './worldSprites'

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

/** One boxed callout at the end of a dialogue's highlights — "What I Learned", "Next Step". */
export interface DialogueNote {
  label: string
  text: string
}

/** One entry in a signpost's window/plot legend: a name, a description, and a matching colour/icon marker. */
export interface LegendEntry {
  id: string
  label: string
  description: string
  accent: string
  icon: IconId
}

/** One contact panel: an icon, a short description, and a clear action button. */
export interface ContactPanel {
  icon: IconId
  label: string
  description: string
  actionLabel: string
  href: string
}

/** One screen of content, rendered all at once in the village overlay. */
export interface Dialogue {
  /** Matches the section id in content.ts, so both stay in step. */
  id: string
  title: string
  /**
   * A short line shown under the title — role/company/period for an
   * experience station, a project's blurb, or a signpost's one-line
   * description. Omitted where the title alone already says enough.
   */
  subtitle?: string
  lines: string[]
  /**
   * A small eyebrow label painted above `lines`, e.g. "Highlights". Left
   * unset for flowing introductory text (About's welcome message, a short
   * achievement line), where a label would read as a non-sequitur.
   */
  linesLabel?: string
  /** A single boxed callout after the highlights — "What I Learned", "Next Step". */
  note?: DialogueNote
  /** A signpost's window/plot legend. Only signposts set this. */
  legend?: LegendEntry[]
  /** One or more contact panels (icon, description, action button). Only the Post Office sets this. */
  contact?: ContactPanel[]
  /**
   * A project's long-form write-up — the same `DetailBlock[]` the project's
   * own `/projects/<id>` page renders, via the same `DetailBlockView`.
   */
  blocks?: DetailBlock[]
  /** Tech chips, links, and/or a cross-link, shown after `lines`/`blocks`. */
  card?: DialogueCard
  /**
   * Renders the Growth Farm's `SuggestionForm` (the `mailto:` box) after
   * `lines`, in place of `blocks`/`card`. The only interactive content any
   * dialogue carries — everything else here is static text pulled from
   * `content.ts`.
   */
  suggestionForm?: boolean
  /** Which village location this dialogue belongs to — drives the overlay's subtle per-location theme. */
  locationId?: string
  /** Popup accent colour for this dialogue's theme. Set via `withTheme()`/`LOCATION_THEME`, not by hand. */
  accent?: string
  /** Popup header icon for this dialogue's theme. Set via `withTheme()`/`LOCATION_THEME`, not by hand. */
  icon?: IconId
}

/** One trigger inside a multi-station building (a window, a plot). */
export interface StationDef {
  /** Stable id, combined with the building symbol to register uniquely. */
  id: string
  /** Shown in the "Press E to enter…" prompt. */
  label: string
  dialogue: () => Dialogue
  /** Frame/awning colour for this window's world sprite. */
  accent: string
  /** Small pixel icon drawn on the window/plot marker. */
  icon: IconId
  /** Short plaque text painted under the window/plot in-world. */
  plaque: string
}

/** One of the four special locations with a contextual side-button action. */
export type ContextualActionId = keyof typeof contextualActions

export interface LocationDef {
  /** The character used for this building in the map in `village.ts`. */
  symbol: string
  /** Human-readable name, shown in dialogue titles and used for debugging. */
  name: string
  palette: BuildingPalette
  /** Which procedural facade to draw. `null` for the farm, which uses its own shape. */
  variant: BuildingVariant | null
  /** Facade sign text painted above the roofline, e.g. "ABOUT ME". */
  signText: string
  /**
   * Builds the dialogue when the player interacts with a single-door
   * building. `null` means the building uses `stations` instead.
   */
  dialogue: (() => Dialogue) | null
  /** Populated instead of `dialogue` for buildings with more than one topic. */
  stations?: StationDef[]
  /**
   * Set only on the four locations with a contextual action button (train
   * station, greenhouse, farm, post office). `createGame.ts` shows that
   * location's button whenever the player is nearby, and dispatches a press
   * to the matching `GameHandle.trigger*()` stub.
   */
  contextualAction?: ContextualActionId
}

/**
 * Popup accent colour + header icon per village location — tuned for
 * legibility against the dark overlay panel, deliberately separate from each
 * building's own (often much darker, sprite-matched) wall colour. Applied to
 * every dialogue via `withTheme()` below, so the overlay system stays one
 * coherent design with only a subtle per-location colour shift — nothing
 * here touches a sprite, the map, or the in-world signpost board colour.
 */
const LOCATION_THEME: Record<string, { accent: string; icon: IconId }> = {
  'about-cottage': { accent: '#e88ec0', icon: 'heart' },
  'current-roles-station': { accent: '#6fa8e8', icon: 'flag' },
  'engineering-workshop': { accent: '#e0a45b', icon: 'gear' },
  'ai-teaching-schoolhouse': { accent: '#a78bfa', icon: 'cap' },
  'mobile-innovation-observatory': { accent: '#7c93e8', icon: 'pin' },
  'developer-tools-workshop': { accent: '#e0729e', icon: 'terminal' },
  'community-impact-greenhouse': { accent: '#7cc47a', icon: 'leaf' },
  'growth-farm': { accent: '#c9d66b', icon: 'sprout' },
  'contact-post-office': { accent: '#5cc8c8', icon: 'mail' },
}

/**
 * Stamps every station's dialogue with its location's popup theme (and the
 * location id itself, so the overlay can key off it later). Wraps the
 * dialogue factory rather than the station, so each station's own
 * `accent`/`icon` — its window's world-sprite colour — is untouched.
 */
function withTheme(locationId: string, stations: StationDef[]): StationDef[] {
  const theme = LOCATION_THEME[locationId]
  return stations.map((station) => ({
    ...station,
    dialogue: (): Dialogue => ({
      ...station.dialogue(),
      locationId,
      accent: theme.accent,
      icon: theme.icon,
    }),
  }))
}

/**
 * The label for one window/station/plot, pulled from the `windows` list
 * authored on `content.villageLocations` in Phase 2 — so the in-world prompt
 * and the signpost legend can never name the same thing two different ways.
 */
function windowLabel(locationId: string, windowId: string): string {
  const window = getVillageLocation(locationId).windows.find((entry) => entry.id === windowId)
  if (!window) {
    throw new Error(`Village location "${locationId}" has no window "${windowId}".`)
  }
  return window.label
}

/** Looks up a project by id, throwing loudly if `content.ts` drifts. */
function findProject(id: string) {
  const project = content.projects.find((item) => item.id === id)
  if (!project) throw new Error(`No project with id "${id}" in content.ts.`)
  return project
}

/**
 * Builds a Dialogue straight from one `content.experience` entry, by id.
 *
 * This is the cross-link target for the classic view, and the plain-station
 * builder for any village desk that has no accompanying project write-up.
 */
export function experienceDialogue(id: string): Dialogue | null {
  const entry = content.experience.find((item) => item.id === id)
  if (!entry) return null

  return {
    id: `experience-${entry.id}`,
    title: `${entry.role} — ${entry.company}`,
    subtitle: `${entry.company} · ${entry.location} · ${entry.period}`,
    lines: entry.bullets,
    linesLabel: 'Highlights',
  }
}

export const LOCATIONS: LocationDef[] = [
  {
    symbol: 'A',
    name: getVillageLocation('about-cottage').name,
    palette: makePalette('#c9834a', '#8a4a2b'),
    variant: 'cottage',
    signText: 'ABOUT ME',
    // ---------------------------------------------------------------
    // About Me Flower Cottage. Two windows: who I am and my education.
    // Deliberately no technical skills list, and no "looking for" window —
    // that content lives on the Contact Post Office's Email window instead.
    // ---------------------------------------------------------------
    dialogue: null,
    stations: withTheme('about-cottage', [
      {
        id: 'introduction',
        label: windowLabel('about-cottage', 'introduction'),
        accent: '#e88ec0',
        icon: 'heart',
        plaque: 'INTRO',
        dialogue: (): Dialogue => ({
          id: 'about-introduction',
          title: windowLabel('about-cottage', 'introduction'),
          lines: content.about.introduction,
        }),
      },
      {
        id: 'uw-education',
        label: windowLabel('about-cottage', 'uw-education'),
        accent: '#f2d65c',
        icon: 'cap',
        plaque: 'UW & EDU',
        dialogue: (): Dialogue => ({
          id: 'about-education',
          title: windowLabel('about-cottage', 'uw-education'),
          subtitle: content.education.school,
          lines: [
            content.education.degree,
            `${content.education.focusArea} · Expected ${content.education.expectedGraduation} · GPA ${content.education.gpa}`,
          ],
        }),
      },
    ]),
  },
  {
    symbol: 'R',
    name: getVillageLocation('current-roles-station').name,
    palette: makePalette('#5b6b7a', '#33424f'),
    variant: 'trainStation',
    signText: 'CURRENT ROLES',
    contextualAction: 'incomingTrain',
    // ---------------------------------------------------------------
    // Current Roles Train Station. One platform window per role I hold
    // today — Palana, Accountability & Hopeful Fridays, and Women in
    // Informatics — built straight from `content.experience`. Colours
    // match the spec's own worked example: blue shield / gold planning /
    // purple finance.
    // ---------------------------------------------------------------
    dialogue: null,
    stations: withTheme(
      'current-roles-station',
      experienceForLocation('current-roles-station').map((entry) => {
        const visual: Record<string, { accent: string; icon: IconId; plaque: string }> = {
          palana: { accent: '#4a7ac4', icon: 'shield', plaque: 'PALANA' },
          ahf: { accent: '#e0a45b', icon: 'flag', plaque: 'AHF' },
          winfo: { accent: '#9a6bcf', icon: 'coin', plaque: 'WINFO' },
        }
        const v = visual[entry.id] ?? { accent: '#4a7ac4', icon: 'shield' as IconId, plaque: entry.company }
        return {
          id: entry.id,
          label: windowLabel('current-roles-station', entry.id),
          ...v,
          dialogue: (): Dialogue => {
            const dialogue = experienceDialogue(entry.id)
            if (!dialogue) throw new Error(`Current Roles station "${entry.id}" has no matching entry.`)
            return dialogue
          },
        }
      }),
    ),
  },
  {
    symbol: 'E',
    name: getVillageLocation('engineering-workshop').name,
    palette: makePalette('#5d6b80', '#37414f'),
    variant: 'workshop',
    signText: 'ENGINEERING EXPERIENCE',
    // ---------------------------------------------------------------
    // Engineering Workshop. Past engineering roles: Kerala Association
    // of Washington, iLink Digital, GoEzz. The Kerala station also
    // carries the full membership-platform write-up and recognition
    // photo, since that project came directly out of this role.
    // ---------------------------------------------------------------
    dialogue: null,
    stations: withTheme(
      'engineering-workshop',
      experienceForLocation('engineering-workshop').map((entry) => {
        const visual: Record<string, { accent: string; icon: IconId; plaque: string }> = {
          kaw: { accent: '#e0a45b', icon: 'gear', plaque: 'KAW' },
          ilink: { accent: '#5bb0a0', icon: 'wrench', plaque: 'ILINK' },
          goezz: { accent: '#d9483b', icon: 'bolt', plaque: 'GOEZZ' },
        }
        const v = visual[entry.id] ?? { accent: '#e0a45b', icon: 'gear' as IconId, plaque: entry.company }
        if (entry.id === 'kaw') {
          const project = findProject('kaw')
          return {
            id: entry.id,
            label: windowLabel('engineering-workshop', entry.id),
            ...v,
            dialogue: (): Dialogue => ({
              id: 'engineering-kaw',
              title: `${entry.role} — ${entry.company}`,
              subtitle: `${entry.company} · ${entry.location} · ${entry.period}`,
              lines: entry.bullets,
              linesLabel: 'Highlights',
              blocks: project.detail?.blocks,
              card: { tech: project.tech, links: project.links },
            }),
          }
        }
        return {
          id: entry.id,
          label: windowLabel('engineering-workshop', entry.id),
          ...v,
          dialogue: (): Dialogue => {
            const dialogue = experienceDialogue(entry.id)
            if (!dialogue) throw new Error(`Engineering Workshop station "${entry.id}" has no matching entry.`)
            return dialogue
          },
        }
      }),
    ),
  },
  {
    symbol: 'S',
    name: getVillageLocation('ai-teaching-schoolhouse').name,
    palette: makePalette('#9a6b40', '#5d3a22'),
    variant: 'schoolhouse',
    signText: 'AI & TEACHING',
    // ---------------------------------------------------------------
    // AI & Teaching Schoolhouse. Apollo AI, Cyber Minds, iCode, and the
    // Martial Arts leadership achievement. The Cyber Minds station also
    // carries the chatbot project's tech and links.
    // ---------------------------------------------------------------
    dialogue: null,
    stations: withTheme(
      'ai-teaching-schoolhouse',
      (() => {
        const visual: Record<string, { accent: string; icon: IconId; plaque: string }> = {
          'apollo-ai': { accent: '#8a6bcf', icon: 'robot', plaque: 'AAI' },
          'cyber-minds': { accent: '#5bb0a0', icon: 'chat', plaque: 'CYBER MINDS' },
          icode: { accent: '#e0a45b', icon: 'book', plaque: 'ICODE' },
        }
        const roleStations = experienceForLocation('ai-teaching-schoolhouse').map((entry) => {
          const v = visual[entry.id] ?? { accent: '#8a6bcf', icon: 'robot' as IconId, plaque: entry.company }
          if (entry.id === 'cyber-minds') {
            const project = findProject('cyber-minds-chatbot')
            return {
              id: entry.id,
              label: windowLabel('ai-teaching-schoolhouse', entry.id),
              ...v,
              dialogue: (): Dialogue => ({
                id: 'schoolhouse-cyber-minds',
                title: `${entry.role} — ${entry.company}`,
                subtitle: `${entry.company} · ${entry.location} · ${entry.period}`,
                lines: entry.bullets,
                linesLabel: 'Highlights',
                card: { tech: project.tech, links: project.links },
              }),
            }
          }
          return {
            id: entry.id,
            label: windowLabel('ai-teaching-schoolhouse', entry.id),
            ...v,
            dialogue: (): Dialogue => {
              const dialogue = experienceDialogue(entry.id)
              if (!dialogue) throw new Error(`Schoolhouse station "${entry.id}" has no matching entry.`)
              return dialogue
            },
          }
        })

        const martialArts = content.achievements.find((item) => item.id === 'martial-arts')
        if (!martialArts) throw new Error('Schoolhouse "martial-arts" station has no matching achievement.')
        const martialArtsStation: StationDef = {
          id: martialArts.id,
          label: windowLabel('ai-teaching-schoolhouse', 'martial-arts'),
          accent: '#d9483b',
          icon: 'belt',
          plaque: 'DOJO',
          dialogue: (): Dialogue => ({
            id: 'schoolhouse-martial-arts',
            title: martialArts.title,
            subtitle: martialArts.period || undefined,
            lines: [martialArts.detail],
          }),
        }

        return [...roleStations, martialArtsStation]
      })(),
    ),
  },
  {
    symbol: 'O',
    name: getVillageLocation('mobile-innovation-observatory').name,
    palette: makePalette('#4a4a7a', '#2c2c52'),
    variant: 'observatory',
    signText: 'MOBILE INNOVATION',
    // ---------------------------------------------------------------
    // Mobile Innovation Observatory. Findar and Bump, each opening its
    // complete long-form write-up in one scroll.
    // ---------------------------------------------------------------
    dialogue: null,
    stations: withTheme(
      'mobile-innovation-observatory',
      projectsForLocation('mobile-innovation-observatory').map((project, i) => {
        const visual = [
          { accent: '#6b8ecf', icon: 'pin' as IconId, plaque: 'FINDAR' },
          { accent: '#9a6bcf', icon: 'phone' as IconId, plaque: 'BUMP' },
        ]
        const v = visual[i] ?? { accent: '#6b8ecf', icon: 'pin' as IconId, plaque: project.title }
        return {
          id: project.id,
          label: windowLabel('mobile-innovation-observatory', project.id),
          ...v,
          dialogue: (): Dialogue => ({
            id: project.id,
            title: project.title,
            subtitle: project.blurb,
            lines: project.built,
            linesLabel: 'Highlights',
            note: { label: 'What I Learned', text: project.learned },
            blocks: project.detail?.blocks,
            card: { tech: project.tech, links: project.links },
          }),
        }
      }),
    ),
  },
  {
    symbol: 'D',
    name: getVillageLocation('developer-tools-workshop').name,
    palette: makePalette('#3a2f4a', '#241c30'),
    variant: 'cyberWorkshop',
    signText: 'DEVELOPER TOOLS',
    // ---------------------------------------------------------------
    // Developer Tools Cyber Workshop. The GitHub Extension and the
    // Cyber Study Tracker — the latter's real name and content pulled
    // directly from its own source, per Phase 1's inspection.
    // ---------------------------------------------------------------
    dialogue: null,
    stations: withTheme(
      'developer-tools-workshop',
      projectsForLocation('developer-tools-workshop').map((project) => {
        const visual: Record<string, { accent: string; icon: IconId; plaque: string }> = {
          'github-extension': { accent: '#e88ec0', icon: 'branch', plaque: 'GITHUB EXT' },
          'cyber-study-tracker': { accent: '#8a6bcf', icon: 'terminal', plaque: 'TRACKER' },
        }
        const v = visual[project.id] ?? { accent: '#e88ec0', icon: 'branch' as IconId, plaque: project.title }
        return {
          id: project.id,
          label: windowLabel('developer-tools-workshop', project.id),
          ...v,
          dialogue: (): Dialogue => ({
            id: project.id,
            title: project.title,
            subtitle: project.blurb,
            lines: [...project.built, ...(project.contentTodo ? [project.contentTodo] : [])],
            linesLabel: 'Highlights',
            note: { label: 'What I Learned', text: project.learned },
            blocks: project.detail?.blocks,
            card: { tech: project.tech, links: project.links },
          }),
        }
      }),
    ),
  },
  {
    symbol: 'G',
    name: getVillageLocation('community-impact-greenhouse').name,
    palette: makePalette('#7ea8c4', '#4a7a94'),
    variant: 'greenhouse',
    signText: 'COMMUNITY IMPACT',
    contextualAction: 'plantMore',
    // ---------------------------------------------------------------
    // Community Impact Greenhouse. TerraLend, Unearthed Dinos, and the
    // WINFO Website (real name and content from Phase 1's inspection).
    // Kept small and light-blue with trees around it in village.ts.
    // ---------------------------------------------------------------
    dialogue: null,
    stations: withTheme(
      'community-impact-greenhouse',
      projectsForLocation('community-impact-greenhouse').map((project) => {
        const visual: Record<string, { accent: string; icon: IconId; plaque: string }> = {
          terralend: { accent: '#6f9a45', icon: 'leaf', plaque: 'TERRALEND' },
          unearthed: { accent: '#a67c52', icon: 'fossil', plaque: 'DINOS' },
          'winfo-website': { accent: '#6b8ecf', icon: 'globe', plaque: 'WINFO SITE' },
        }
        const v = visual[project.id] ?? { accent: '#6f9a45', icon: 'leaf' as IconId, plaque: project.title }
        return {
          id: project.id,
          label: windowLabel('community-impact-greenhouse', project.id),
          ...v,
          dialogue: (): Dialogue => ({
            id: project.id,
            title: project.title,
            subtitle: project.blurb,
            lines: [...project.built, ...(project.contentTodo ? [project.contentTodo] : [])],
            linesLabel: 'Highlights',
            note: { label: 'What I Learned', text: project.learned },
            blocks: project.detail?.blocks,
            card: { tech: project.tech, links: project.links },
          }),
        }
      }),
    ),
  },
  {
    symbol: 'F',
    name: getVillageLocation('growth-farm').name,
    palette: makePalette('#8a9a5a', '#5a6b3a'),
    // Farm area, not a house — `createGame.ts` draws it with
    // `createFarmSprite()` instead of the shared house-shell facade.
    variant: null,
    signText: "WHAT I'M GROWING NEXT",
    contextualAction: 'dropFeed',
    // ---------------------------------------------------------------
    // Growth Farm. Not a house — three planting plots, one per
    // `content.growth.plans` entry, plus a fourth "Suggest Something"
    // plot opening the mailto suggestion box in-world.
    // ---------------------------------------------------------------
    dialogue: null,
    stations: withTheme('growth-farm', [
      ...content.growth.plans.map((plan, i) => {
        const visual = [
          { accent: '#e0a45b', icon: 'bolt' as IconId, plaque: 'HACK' },
          { accent: '#5bb0a0', icon: 'server' as IconId, plaque: 'HOME LAB' },
          { accent: '#e88ec0', icon: 'branch' as IconId, plaque: 'GH EXT' },
        ]
        const v = visual[i] ?? { accent: '#e0a45b', icon: 'sprout' as IconId, plaque: plan.title }
        return {
          id: plan.id,
          label: windowLabel('growth-farm', plan.id),
          ...v,
          dialogue: (): Dialogue => ({
            id: `growth-${plan.id}`,
            title: plan.title,
            subtitle: plan.paragraphs[0],
            lines: [],
            note: plan.paragraphs[1] ? { label: 'Next Step', text: plan.paragraphs[1] } : undefined,
          }),
        }
      }),
      {
        id: 'suggestion',
        label: 'Suggest Something',
        accent: '#9a6bcf',
        icon: 'mail',
        plaque: 'IDEA',
        dialogue: (): Dialogue => ({
          id: 'growth-suggestion',
          title: 'Suggest Something',
          subtitle: content.growth.intro,
          lines: [],
          suggestionForm: true,
        }),
      },
    ]),
  },
  {
    symbol: 'X',
    name: getVillageLocation('contact-post-office').name,
    palette: makePalette('#54748f', '#324759'),
    variant: 'postOffice',
    signText: 'CONTACT',
    contextualAction: 'sendMail',
    // ---------------------------------------------------------------
    // Contact Post Office. Email, LinkedIn, GitHub — each its own
    // window, rendered as an attractive contact panel (icon, short
    // description, clear action button) rather than a crowded mailbox.
    // ---------------------------------------------------------------
    dialogue: null,
    stations: withTheme('contact-post-office', [
      {
        id: 'email',
        label: windowLabel('contact-post-office', 'email'),
        accent: '#6b8ecf',
        icon: 'mail',
        plaque: 'EMAIL',
        dialogue: (): Dialogue => ({
          id: 'contact-email',
          title: windowLabel('contact-post-office', 'email'),
          subtitle: content.contact.location,
          lines: [],
          contact: [
            {
              icon: 'mail',
              label: content.contact.email,
              description: content.contact.blurb,
              actionLabel: 'Send an Email',
              href: `mailto:${content.contact.email}`,
            },
          ],
        }),
      },
      {
        id: 'linkedin',
        label: windowLabel('contact-post-office', 'linkedin'),
        accent: '#4a7ac4',
        icon: 'link',
        plaque: 'LINKED',
        dialogue: (): Dialogue => ({
          id: 'contact-linkedin',
          title: windowLabel('contact-post-office', 'linkedin'),
          lines: [],
          contact: [
            {
              icon: 'link',
              label: 'LinkedIn',
              description: getVillageLocation('contact-post-office').windows.find((w) => w.id === 'linkedin')!
                .description,
              actionLabel: 'Open LinkedIn',
              href: content.contact.linkedin,
            },
          ],
        }),
      },
      {
        id: 'github',
        label: windowLabel('contact-post-office', 'github'),
        accent: '#4a4a4a',
        icon: 'branch',
        plaque: 'GITHUB',
        dialogue: (): Dialogue => ({
          id: 'contact-github',
          title: windowLabel('contact-post-office', 'github'),
          lines: [],
          contact: [
            {
              icon: 'branch',
              label: 'GitHub',
              description: getVillageLocation('contact-post-office').windows.find((w) => w.id === 'github')!
                .description,
              actionLabel: 'Open GitHub',
              href: content.contact.github,
            },
          ],
        }),
      },
    ]),
  },
]

/** Map symbols that a building sprite is drawn for, so tiles skip drawing them. */
export const BUILDING_SYMBOLS: ReadonlySet<string> = new Set(
  LOCATIONS.map((location) => location.symbol),
)

/** Every `LocationDef`, keyed by its display name, so a signpost (which only knows a village location id) can find the matching building's stations and borrow their accent/icon for its legend markers. */
const LOCATIONS_BY_NAME = new Map(LOCATIONS.map((location) => [location.name, location]))

/** One waypost: a single solid map tile with a themed dialogue, no card. */
export interface SignpostDef {
  /** The character used for this signpost in the map in `village.ts`. */
  symbol: string
  /** The location's full name, shown as the overlay title. */
  title: string
  /** The village location this signpost describes — threaded through so its popup shares that location's theme. */
  locationId: string
  /** The location's one-line description, shown as the popup's subtitle. */
  subtitle: string
  /** The window/plot legend: name, description, and a matching colour/icon marker per entry. */
  legend: LegendEntry[]
  /**
   * Short heading painted on the signpost's world sprite — per spec, the
   * in-world sign shows only this, never the full description/legend above.
   */
  heading: string
  /** Board colour for the in-world sprite, matching the location's building wall colour. Unchanged by the popup redesign. */
  accent: string
  /** Small pixel icon for the in-world sprite. Unchanged by the popup redesign. */
  icon: IconId
  /** Popup accent colour — the same subtle theme this location's own building popups use. */
  themeAccent: string
  /** Popup header icon — the same subtle theme this location's own building popups use. */
  themeIcon: IconId
}

/**
 * Maps each signpost's map symbol to the village location it describes.
 *
 * `heading` is deliberately short — this is the only text painted on the
 * world sprite (per spec, the in-world sign shows the location heading
 * alone, never the full name/description). It matches each building's
 * facade `signText` in `LOCATIONS` above. `accent`/`icon` here are the
 * sprite's board colour and icon — kept exactly as before this phase, since
 * the popup instead reads `themeAccent`/`themeIcon` (see `LOCATION_THEME`).
 */
const SIGNPOST_LOCATIONS: {
  symbol: string
  locationId: string
  heading: string
  accent: string
  icon: IconId
}[] = [
  { symbol: '1', locationId: 'about-cottage', heading: 'About Me', accent: '#c9834a', icon: 'heart' },
  {
    symbol: '2',
    locationId: 'current-roles-station',
    heading: 'Current Roles',
    accent: '#5b6b7a',
    icon: 'flag',
  },
  {
    symbol: '3',
    locationId: 'engineering-workshop',
    heading: 'Engineering',
    accent: '#5d6b80',
    icon: 'gear',
  },
  {
    symbol: '4',
    locationId: 'ai-teaching-schoolhouse',
    heading: 'AI & Teaching',
    accent: '#9a6b40',
    icon: 'cap',
  },
  {
    symbol: '5',
    locationId: 'mobile-innovation-observatory',
    heading: 'Mobile Innovation',
    accent: '#4a4a7a',
    icon: 'pin',
  },
  {
    symbol: '6',
    locationId: 'developer-tools-workshop',
    heading: 'Developer Tools',
    accent: '#3a2f4a',
    icon: 'terminal',
  },
  {
    symbol: '7',
    locationId: 'community-impact-greenhouse',
    heading: 'Community Impact',
    accent: '#7ea8c4',
    icon: 'leaf',
  },
  { symbol: '8', locationId: 'growth-farm', heading: 'Growing Next', accent: '#8a9a5a', icon: 'sprout' },
  { symbol: '9', locationId: 'contact-post-office', heading: 'Contact', accent: '#54748f', icon: 'mail' },
]

/**
 * Every signpost on the map, one per location, built straight from
 * `content.villageLocations` — a short description and a legend of every
 * window/station/plot the visitor is about to walk into, each legend entry
 * borrowing its matching station's own accent/icon so the popup marker and
 * the window you'll actually find inside look like the same thing. The
 * `heading`/`accent`/`icon` fields alone are what get painted on the world
 * sprite; `subtitle`/`legend` are reserved for the overlay opened by
 * pressing `E`.
 */
export const SIGNPOSTS: SignpostDef[] = SIGNPOST_LOCATIONS.map(({ symbol, locationId, heading, accent, icon }) => {
  const village = getVillageLocation(locationId)
  const buildingDef = LOCATIONS_BY_NAME.get(village.name)
  const theme = LOCATION_THEME[locationId] ?? { accent, icon }
  return {
    symbol,
    title: village.name,
    locationId,
    subtitle: village.signDescription,
    legend: village.windows.map((window) => {
      const station = buildingDef?.stations?.find((s) => s.id === window.id)
      return {
        id: window.id,
        label: window.label,
        description: window.description,
        accent: station?.accent ?? theme.accent,
        icon: station?.icon ?? theme.icon,
      }
    }),
    heading,
    accent,
    icon,
    themeAccent: theme.accent,
    themeIcon: theme.icon,
  }
})

/** Map symbols that a signpost sprite is drawn for, so tiles skip drawing them. */
export const SIGNPOST_SYMBOLS: ReadonlySet<string> = new Set(SIGNPOSTS.map((s) => s.symbol))

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
