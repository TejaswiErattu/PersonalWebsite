/**
 * SINGLE SOURCE OF TRUTH
 *
 * Every word rendered by the game world AND by classic mode comes from this
 * file. Nothing here is invented: it is transcribed from the master/software/
 * security resumes and the current live portfolio site.
 *
 * If content is wrong, fix it HERE and both experiences update together.
 */

import { SITE_ORIGIN } from '../seo/site'

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

/** A labelled outbound link (project repo, live demo, resume, social). */
export interface ContentLink {
  label: string
  href: string
}

/** Top-level identity shown on the landing screen and in the Cozy House. */
export interface Person {
  name: string
  title: string
  tagline: string
  location: string
  email: string
  phone: string
  linkedin: string
  github: string
  website: string
  /** Role-specific resumes, offered separately rather than as one combined PDF. */
  resumes: ContentLink[]
  /** Spoken languages, with fluency, exactly as listed on the resume. */
  spokenLanguages: string[]
}

/** Narrative bio content for the Cozy House. */
export interface About {
  headline: string
  subheadline: string
  paragraphs: string[]
  quickFacts: { label: string; value: string }[]
  highlights: string[]
  /**
   * Short welcome message shown in the About Me Flower Cottage's
   * Introduction window (and its classic-view equivalent). Deliberately
   * separate from `paragraphs`: this is a village-exploration greeting, not
   * a roles/skills summary, so it stays short and does not repeat content
   * that already lives on the Current Roles station or the Education window.
   */
  introduction: string[]
}

/**
 * One block of long-form detail on a project's `/projects/<id>` page.
 *
 * Rendered by `DetailBlockView`, which both `ProjectPage` (the full page) and
 * `DialogueBox` (the in-village station, mid-dialogue) call against the same
 * `detail.blocks` array — so the two views can never drift apart the way two
 * hand-written copies of the same write-up would.
 */
export type DetailBlock =
  | { kind: 'video'; src: string; poster: string; caption: string }
  | { kind: 'image'; src: string; alt: string; caption?: string; width: number; height: number }
  | { kind: 'prose'; heading: string; paragraphs: string[] }
  | { kind: 'list'; heading: string; items: string[]; tone?: 'plain' | 'negative' }
  | { kind: 'steps'; heading: string; blurb?: string; steps: { title: string; body: string }[] }
  | { kind: 'cards'; heading: string; blurb?: string; cards: { title: string; body: string }[] }
  | {
      kind: 'columns'
      heading: string
      blurb?: string
      columns: { title: string; items: string[] }[]
    }
  | { kind: 'stats'; heading?: string; stats: { value: string; label: string }[] }
  | { kind: 'code'; heading: string; blurb?: string; language: string; source: string }
  | { kind: 'table'; heading: string; columns: string[]; rows: string[][] }
  | { kind: 'chips'; heading: string; items: string[] }

/** The long-form write-up behind a project's "Read the full write-up" link. */
export interface ProjectDetail {
  /** Small label above the title, e.g. "Native iOS App". */
  eyebrow?: string
  /** Hero paragraph — longer and more scene-setting than `blurb`. */
  intro: string
  /** Badges next to the hero, e.g. "Built in 24 hours". */
  badges?: string[]
  blocks: DetailBlock[]
}

/** One project write-up — a station window (see `locationId`) and/or a standalone `/projects/<id>` page. */
export interface Project {
  id: string
  title: string
  period: string
  blurb: string
  tech: string[]
  built: string[]
  impact: string
  learned: string
  links: ContentLink[]
  /** Long-form write-up, ported from the old portfolio. Only set for
   *  projects that had a dedicated in-depth page there. */
  detail?: ProjectDetail
  /**
   * Which `villageLocations` entry this project's window/station lives in.
   * Optional: a project reached only through another building's cross-link
   * (e.g. the Kerala Association and Cyber Minds project write-ups, surfaced
   * from their matching `experience` entry rather than getting a window of
   * their own) has no location of its own.
   */
  locationId?: string
  /**
   * A visible placeholder for prose the project owner hasn't supplied yet
   * (a final description, a demo video). Rendered alongside the rest of the
   * entry so the gap is obvious rather than silently missing.
   */
  contentTodo?: string
}

/** One role — a station window in the Current Roles Train Station, Engineering Workshop, or Schoolhouse (see `locationId`). */
export interface ExperienceEntry {
  id: string
  role: string
  company: string
  period: string
  location: string
  bullets: string[]
  /** True for a role held today. Drives the Experience section's current/past split. */
  current?: boolean
  /** Which `villageLocations` entry this role's window lives in. */
  locationId?: string
}

/** Schooling, shown in the About Me Flower Cottage's "UW and Education" window and the classic Education section. */
export interface Education {
  school: string
  degree: string
  focusArea: string
  expectedGraduation: string
  gpa: string
  skills: { category: string; items: string[] }[]
}

/** Content for the classic Security section (compatibility route, folded into Experience/Achievements elsewhere). */
export interface SecurityProfile {
  role: string
  organization: string
  period: string
  bullets: string[]
  skills: string[]
  certifications: string[]
}

/** One trophy in the Trophy Garden. */
export interface Achievement {
  id: string
  title: string
  detail: string
  period: string
  /** Which `villageLocations` entry this achievement's window lives in, if any. */
  locationId?: string
}

/** One growth plot in the Growth Farm — a plan for what's next, not a finished project. */
export interface GrowthPlan {
  id: string
  title: string
  paragraphs: string[]
}

/** The visitor suggestion box's mailto configuration. No server, no database. */
export interface GrowthSuggestion {
  toEmail: string
  subject: string
  maxLength: number
  buttonLabel: string
  placeholder: string
}

/** Growth Farm content. */
export interface Growth {
  headline: string
  intro: string
  plans: GrowthPlan[]
  suggestion: GrowthSuggestion
}

/** Mailbox content. */
export interface Contact {
  email: string
  phone: string
  linkedin: string
  github: string
  resumes: ContentLink[]
  location: string
  blurb: string
  rolesSeeking: string[]
  availability: string
}

/** The whole portfolio, as one typed object. */
export interface PortfolioContent {
  person: Person
  about: About
  projects: Project[]
  experience: ExperienceEntry[]
  education: Education
  security: SecurityProfile
  achievements: Achievement[]
  growth: Growth
  contact: Contact
}

/* ------------------------------------------------------------------ */
/* Shared constants (kept in one place so they can never drift)        */
/* ------------------------------------------------------------------ */

const EMAIL = 'tjerattu@gmail.com'
const PHONE = '(425) 800-4330'
const LINKEDIN = 'https://www.linkedin.com/in/tejaswi-erattu-3b9b04246/'
const GITHUB = 'https://github.com/TejaswiErattu'
// Derived from SITE_ORIGIN rather than hardcoded, so this can never drift
// from the canonical/OG/sitemap origin the way it previously did.
const WEBSITE = `${SITE_ORIGIN}/`
const LOCATION = 'Seattle, Washington'

/**
 * Two role-specific resumes rather than one combined document, so a reader can
 * pick the track they are hiring for. Both live in `public/`.
 */
const RESUMES: ContentLink[] = [
  { label: 'Software resume', href: '/resume-software.pdf' },
  { label: 'Security resume', href: '/resume-security.pdf' },
]

/**
 * The Palana Security Engineer bullets, defined once and reused by both
 * `content.security` (the Security Center / Security page) and the matching
 * `content.experience` entry (the Current Roles train station) — so the two
 * views can never drift apart the way two hand-typed copies would.
 */
const PALANA_BULLETS = [
  'Conducted threat modeling across 10+ product surfaces using STRIDE methodology, cataloguing distinct threats and mapping trust boundaries across the mobile, backend, and Firebase architecture',
  'Identified a confirmed privilege-escalation vulnerability in session/identity handling and drove remediation with the engineering team prior to deployment',
  'Built security documentation and risk-mitigation control mappings covering 7+ categories of sensitive data (location, PII, auth, admin access), aligned to STRIDE and CIA triad frameworks',
  'Evaluated and piloted 2 static analysis tools (Semgrep, npm audit) to replace CodeQL in the CI/CD pipeline after a private-repo migration broke existing scanning',
  'Ran manual penetration testing with Burp Suite against API and WebSocket endpoints to assess authorization and data-exposure risk',
]

/**
 * A short, general summary of the Palana role for the Current Roles Train
 * Station — deliberately separate from `PALANA_BULLETS` (kept intact for the
 * Security section, which is a detailed technical profile out of this
 * simplification's scope). No detailed duties, metrics, or confidential
 * specifics; just what Palana is and what Tejaswi does there.
 */
const PALANA_ROLE_SUMMARY = [
  'Palana is building UW Night Ride, a campus safety app for University of Washington students.',
  'Tejaswi works there as a Security Engineer, helping threat-model the app and test it for security issues before release.',
  'More detail about this role will be added here once the app is published on Google Play.',
]

/** A short, general summary of the AHF role for the Current Roles Train Station. */
const AHF_ROLE_SUMMARY = [
  'Accountability & Hopeful Fridays is an organization Tejaswi supports as Software Engineering Lead.',
  'She helps plan and organize its technical tools and infrastructure.',
]

/* ------------------------------------------------------------------ */
/* Content                                                             */
/* ------------------------------------------------------------------ */

export const content: PortfolioContent = {
  person: {
    name: 'Tejaswi Erattu Taj',
    title: 'Software Engineer + Security Engineer',
    tagline:
      'University of Washington Informatics student (BS, Software Engineering + Cybersecurity, expected 2028). Security Engineer at Palana. I build AR iOS apps, developer tools, and production data pipelines.',
    location: LOCATION,
    email: EMAIL,
    phone: PHONE,
    linkedin: LINKEDIN,
    github: GITHUB,
    website: WEBSITE,
    resumes: RESUMES,
    spokenLanguages: ['English (Fluent)', 'Malayalam (Native)', 'Spanish (Elementary)'],
  },

  about: {
    headline: 'Software engineering student building systems people depend on.',
    subheadline:
      'Informatics student at the University of Washington. I migrate databases, train machine learning models, threat-model production systems, and ship code that stays shipped.',
    paragraphs: [
      'I build data infrastructure and web applications that solve real problems.',
      'At Palana I work as a Security Engineer, threat modeling product surfaces with STRIDE, running manual penetration tests against API and WebSocket endpoints, and driving remediation with the engineering team before deployment.',
      'At Kerala Association of Washington, I migrated 2,800+ member records into a production WordPress system. I wrote custom PHP plugins for data imports, user management, and automated backups. The system runs live today.',
      'At Cyber Minds Nonprofit, I deployed a chatbot handling 100+ monthly user inquiries and led a 5-person team building a machine learning-powered cybersecurity course. At Apollo AI, I trained machine learning models for an educational platform supporting 50+ K-12 students.',
      "I've also spent two years teaching coding to 60+ elementary and middle school students. Teaching forces clarity. You learn what you truly understand when you explain binary search to a 10-year-old.",
      `I'm based in ${LOCATION}. This village is a playful version of my portfolio, with each location representing a different part of my journey — from the roles I hold today to what I'm building next.`,
    ],
    quickFacts: [
      { label: 'Location', value: LOCATION },
      { label: 'Education', value: 'University of Washington' },
      { label: 'Major', value: 'BS Informatics, expected 2028' },
      { label: 'Focus', value: 'Software Engineering + Cyber Security' },
      { label: 'GPA', value: '3.8 / 4.0' },
      { label: 'Languages', value: 'English, Malayalam, Spanish' },
      {
        label: 'Interests',
        value: 'Data infrastructure, machine learning, education technology',
      },
    ],
    highlights: [
      'Migrated 2,800+ member records to production',
      'Trained 5+ machine learning models supporting 50+ students',
      'Built custom WordPress plugins serving live users',
      'Taught coding to 60+ elementary students',
      'Led 5-person cross-functional engineering team',
    ],
    introduction: [
      'Welcome to my portfolio village!',
      'Take a look around and explore the different buildings — there are a few interactive features tucked throughout, so feel free to try them out.',
      'When you are ready to leave the village, switch to Classic View to explore the non-village version of the portfolio.',
    ],
  },

  projects: [
    {
      id: 'findar',
      title: 'Findar — AR Object Finder (iOS)',
      period: 'Feb 2026',
      blurb:
        'An augmented reality iOS app that helps you find lost objects around your home — just say what you\'re looking for, and it guides you to it using your camera and LiDAR sensor.',
      tech: ['Swift', 'ARKit', 'CoreML', 'YOLOv8', 'LiDAR', 'Vision', 'SwiftUI', 'Speech'],
      built: [
        'Detects everyday objects in real time using the camera and on-device object detection.',
        'Uses the LiDAR sensor to judge distance and guide you toward the object with spoken directions.',
        'Understands natural voice commands like "find my keys" and gives spoken and haptic feedback as you get close.',
      ],
      impact:
        'A working prototype demonstrating real-time object detection, LiDAR-based guidance, and voice interaction — built in 24 hours.',
      learned:
        'Building an app that combines computer vision, depth sensing, and voice recognition taught me how to design real-time systems that stay responsive without blocking the interface.',
      links: [
        { label: 'View Code', href: 'https://github.com/TejaswiErattu/findar' },
        { label: 'Read the full write-up', href: '/projects/findar' },
      ],
      locationId: 'mobile-innovation-observatory',
      detail: {
        badges: ['Built in 24 hours'],
        intro:
          `An augmented reality iOS app that helps you find lost objects without tags, trackers, ` +
          `or setup. Just say "find my keys" and Findar guides you to them using your camera, ` +
          `LiDAR depth sensing, and voice.`,
        blocks: [
          {
            kind: 'video',
            src: '/videos/findar-demo.mp4',
            poster: '/videos/findar-poster.jpg',
            caption: 'Findar in action — voice command, real-time object detection, and guided navigation.',
          },
          {
            kind: 'prose',
            heading: 'Why I Built It',
            paragraphs: [
              `Existing solutions like AirTags and Tile require you to pre-tag every object, so they ` +
                `can only find things you already planned to lose. There's no solution for the ` +
                `spontaneous "where did I put my glasses?" moment.`,
              `I wanted something that works passively, with zero setup, using hardware people ` +
                `already own.`,
            ],
          },
          {
            kind: 'cards',
            heading: 'Highlights',
            cards: [
              {
                title: 'Natural Voice Search',
                body: 'Understands everyday phrasing like "find my phone" or "where are my keys."',
              },
              {
                title: 'Real-Time Detection',
                body: 'Spots common objects on the fly using on-device object detection.',
              },
              {
                title: 'Guided Navigation',
                body: 'Speaks directions and gives haptic feedback as you get closer to the object.',
              },
            ],
          },
          {
            kind: 'chips',
            heading: 'Tech Stack',
            items: ['Swift', 'SwiftUI', 'ARKit', 'CoreML', 'YOLOv8n', 'Vision', 'LiDAR', 'Speech Framework'],
          },
        ],
      },
    },
    {
      id: 'github-extension',
      title: 'GitHub Extension (VS Code)',
      period: 'Jan 2026 – Jun 2026',
      blurb:
        'A VS Code extension that adds a safety layer in front of Git — scanning for exposed secrets and adding a preview-and-confirm step before risky Git commands run.',
      tech: ['TypeScript', 'VS Code Extension API', 'Node.js', 'Git CLI'],
      built: [
        'Scans staged changes for exposed secrets before they reach version control.',
        'Flags risky Git actions and shows a preview before they run, instead of executing them blind.',
        'Helps small student teams spot overlapping changes across branches before merging.',
      ],
      impact: 'A safety net for student teams using Git, catching risky or destructive commands before they run.',
      learned:
        'Guardrails only work if they are faster than the unsafe path — I focused on previewing intent rather than just blocking actions outright.',
      links: [{ label: 'View Code', href: GITHUB }],
      locationId: 'developer-tools-workshop',
      detail: {
        intro:
          'A VS Code extension that adds a safety layer in front of Git — scanning for exposed secrets and adding a preview-and-confirm step before risky Git commands run.',
        blocks: [
          { kind: 'prose', heading: 'Media', paragraphs: ['Media coming soon.'] },
          {
            kind: 'cards',
            heading: 'Highlights',
            cards: [
              { title: 'Secret Scanning', body: 'Catches exposed credentials before they reach version control.' },
              { title: 'Risk Preview', body: 'Shows a confirmation step before risky Git actions run.' },
              { title: 'Team-Friendly', body: 'Built with small student teams working on shared branches in mind.' },
            ],
          },
        ],
      },
    },
    {
      id: 'cyber-study-tracker',
      title: 'Cyber Study Tracker',
      period: 'Jun 2025 – Sept 2025',
      blurb:
        'A personal dashboard for tracking a self-directed cybersecurity study plan — a visual calendar and progress tracker that reschedules missed tasks automatically.',
      tech: ['HTML', 'CSS', 'JavaScript', 'Firebase'],
      built: [
        'A visual calendar and progress dashboard for a self-directed study plan.',
        'Automatically reschedules missed tasks so the plan stays realistic.',
        'Exports the schedule and progress to a spreadsheet for easy reference.',
      ],
      impact: 'A personal tool for tracking and adapting a self-directed study plan across certifications and coursework.',
      learned:
        'Built to track and reschedule a personal cybersecurity study plan without needing a full backend.',
      links: [],
      locationId: 'developer-tools-workshop',
      contentTodo:
        'TODO: replace with the final project description and demo video once provided.',
      detail: {
        intro:
          'A personal dashboard for tracking a self-directed cybersecurity study plan — a visual calendar and progress tracker that reschedules missed tasks automatically.',
        blocks: [
          { kind: 'prose', heading: 'Media', paragraphs: ['Media coming soon.'] },
          {
            kind: 'cards',
            heading: 'Highlights',
            cards: [
              { title: 'Visual Calendar', body: 'Tracks study tasks across certifications and coursework at a glance.' },
              { title: 'Auto Rescheduling', body: 'Moves missed tasks forward instead of letting the plan fall apart.' },
              { title: 'Exportable', body: 'Progress and schedule can be exported for easy reference.' },
            ],
          },
        ],
      },
    },
    {
      id: 'unearthed',
      title: 'Unearthed Dinos FIRST LEGO League Website',
      period: '',
      blurb:
        'A team website for a FIRST LEGO League robotics team, built to give judges, sponsors, and families one place to see the team\'s work — with an AI chatbot to answer questions.',
      tech: ['React', 'Vite', 'Tailwind CSS', 'Express.js', 'OpenAI API'],
      built: [
        'A single site covering team profiles, robot design, and community outreach.',
        'An AI chatbot that answers questions about the team and about FIRST LEGO League itself.',
        'A timeline and awards gallery showcasing the team\'s season.',
      ],
      impact:
        'A live team website used by team members, parents, and judges to learn about the Unearthed Dinos.',
      learned:
        'Building for a team of kids meant the interface needed to be instantly understandable. The chatbot taught me how to layer search — try local content first, then offer web search only with consent.',
      links: [
        { label: 'View Code', href: 'https://github.com/TejaswiErattu/UnearthedFLLWebsite' },
        { label: 'Live Demo', href: 'https://unearthedfllwebsite27820.vercel.app' },
        { label: 'Read the full write-up', href: '/projects/unearthed' },
      ],
      locationId: 'community-impact-greenhouse',
      detail: {
        eyebrow: 'FIRST LEGO League',
        intro:
          `A team website for the "Unearthed Dinos" FIRST LEGO League robotics team, built to give ` +
          `judges, sponsors, and families one place to see the team's work — with an AI chatbot to ` +
          `answer questions.`,
        blocks: [
          {
            kind: 'video',
            src: '/videos/unearthed-demo.mp4',
            poster: '/videos/unearthed-poster.jpg',
            caption:
              'Full walkthrough of the Unearthed Dinos website — team profiles, AI chatbot, robot design, outreach, and awards.',
          },
          {
            kind: 'prose',
            heading: 'Why I Built It',
            paragraphs: [
              'FLL teams need to present their work to judges, sponsors, and community members, but most teams rely on scattered docs and social media posts that don\'t tell a cohesive story.',
              'The team also wanted an interactive way for visitors to learn about FIRST LEGO League itself, without having to manually answer every question.',
            ],
          },
          {
            kind: 'cards',
            heading: 'Highlights',
            cards: [
              {
                title: 'Team Profiles & Robot Design',
                body: 'Member profiles and a look at the team\'s robot, alongside a timeline of the season.',
              },
              {
                title: 'AI Chatbot',
                body: 'Answers questions about the team and about FIRST LEGO League, searching the site first before optionally searching the web.',
              },
              {
                title: 'Community Outreach & Awards',
                body: 'A showcase of the team\'s outreach events and competition awards.',
              },
            ],
          },
          {
            kind: 'stats',
            heading: 'Community Outreach',
            stats: [
              { value: '120+', label: 'Museum Maker Day — hands-on robotics demo station for kids' },
              { value: '300+', label: 'STEM Night — shared core values and ran mini-missions' },
              { value: '3', label: 'Library Talks — coding sessions for young minds' },
            ],
          },
        ],
      },
    },
    {
      id: 'terralend',
      title: 'TerraLend',
      period: '',
      blurb:
        'A concept for climate-aware agricultural lending — replacing static, one-size-fits-all interest rates with pricing that responds to a farm\'s real, local conditions.',
      tech: ['JavaScript', 'Leaflet.js', 'Satellite APIs', 'Climate APIs', 'Vercel'],
      built: [
        'An interactive map showing live climate and satellite data for a farm\'s location.',
        'A simulation lab for testing how extreme weather scenarios affect loan pricing.',
        'Separate views for loan officers and farmers, so both sides see the same reasoning.',
      ],
      impact:
        'An interactive demo showing how live climate data and satellite overlays could make agricultural lending more transparent.',
      learned:
        'Translating complex climate data into something intuitive for non-technical users like farmers and loan officers was the biggest design challenge.',
      links: [
        { label: 'View Code', href: GITHUB },
        { label: 'Live Demo', href: 'https://terralend-tejaswi.vercel.app/' },
        { label: 'Read the full write-up', href: '/projects/terralend' },
      ],
      locationId: 'community-impact-greenhouse',
      detail: {
        eyebrow: 'Climate-Aware FinTech',
        intro:
          'A concept for climate-aware agricultural lending, replacing static, regional-average interest rates with pricing that responds to a farm\'s real, local conditions using live satellite and weather data.',
        blocks: [
          {
            kind: 'video',
            src: '/videos/terralend-demo.mp4',
            poster: '/videos/terralend-poster.jpg',
            caption:
              'Full walkthrough of the TerraLend engine — map interaction, satellite layers, climate simulations, and multi-role views.',
          },
          {
            kind: 'prose',
            heading: 'Why I Built It',
            paragraphs: [
              'Traditional agricultural lending uses static, annually-updated interest rates based on broad regional averages. A farmer in a drought-stricken microclimate pays the same rate as one with ideal growing conditions.',
              'I wanted to explore what lending could look like with real-time climate visibility and full transparency for farmers into how their rate is set.',
            ],
          },
          {
            kind: 'cards',
            heading: 'Highlights',
            cards: [
              {
                title: 'Live Climate Map',
                body: 'An interactive map of satellite and weather data — vegetation health, soil moisture, temperature, and rainfall.',
              },
              {
                title: 'Simulation Lab',
                body: 'Test extreme climate scenarios, like drought or flooding, and see how pricing responds.',
              },
              {
                title: 'Multi-Role Views',
                body: 'Loan officers and farmers see the same underlying data through views tailored to each.',
              },
            ],
          },
          {
            kind: 'chips',
            heading: 'Tech Stack',
            items: ['JavaScript', 'Leaflet.js', 'Satellite APIs', 'Climate APIs', 'Vercel'],
          },
        ],
      },
    },
    {
      id: 'winfo-website',
      title: 'WINFO Website',
      period: '',
      blurb:
        'The official website for Women in Informatics (WINFO) at the University of Washington, built from scratch.',
      tech: ['React', 'Vite', 'React Router'],
      built: [
        'Built the site from scratch, covering pages for events, officers, membership, and support.',
        'Designed a consistent visual style and typography system across the whole site.',
      ],
      impact:
        'The live website for the University of Washington Women in Informatics organization.',
      learned:
        'Built and designed the WINFO website from page structure and routing down to the visual design system.',
      links: [
        {
          label: 'Live Site',
          href: 'https://winfo-website-version1-nukxw8nb9-tejaswi-erattus-projects.vercel.app/',
        },
      ],
      locationId: 'community-impact-greenhouse',
      contentTodo:
        'TODO: replace with the final project description and demo video once provided.',
      detail: {
        intro:
          'The official website for Women in Informatics (WINFO) at the University of Washington, built from scratch to cover events, officers, membership, and support.',
        blocks: [
          { kind: 'prose', heading: 'Media', paragraphs: ['Media coming soon.'] },
          {
            kind: 'cards',
            heading: 'Highlights',
            cards: [
              { title: 'Full Site', body: 'Covers events, officers, membership, and support in one place.' },
              { title: 'Consistent Design', body: 'A shared visual style and typography system across every page.' },
            ],
          },
        ],
      },
    },
    {
      id: 'kaw',
      title: 'Kerala Association Membership Platform',
      period: 'May 2025 – Dec 2025',
      blurb:
        'A production WordPress system for the Kerala Association of Washington, moving its 2,800+ member records online with automated imports and daily backups.',
      tech: ['PHP', 'MySQL', 'JavaScript', 'WordPress'],
      built: [
        'Moved 2,800+ member records from spreadsheets into a live WordPress membership system.',
        'Built tools for importing new members and managing their profiles.',
        'Set up automated daily backups to protect the live data.',
      ],
      impact: 'The system runs in production, serving the association\'s live member base.',
      learned:
        'Data cleaning always takes longer than expected. I built validation upfront and wrote documentation so others could maintain the system after I was gone.',
      links: [
        { label: 'View Code', href: GITHUB },
        { label: 'Read the full write-up', href: '/projects/kaw' },
      ],
      detail: {
        badges: ['2,800+ records migrated', 'Running in production'],
        intro:
          'A production WordPress system for the Kerala Association of Washington — moving its 2,800+ member records from spreadsheets into a live membership platform, with automated imports and daily backups.',
        blocks: [
          {
            kind: 'image',
            src: '/kaw-recognition.jpg',
            width: 1024,
            height: 576,
            alt: 'Tejaswi Erattu Taj on stage receiving a plaque from a Kerala Association of Washington community leader, with several other members applauding.',
            caption:
              'Recognized by the Kerala Association of Washington for building and delivering the membership migration platform.',
          },
          {
            kind: 'prose',
            heading: 'Why It Was Needed',
            paragraphs: [
              'Kerala Association of Washington (KAW) manages a community of 2,800+ members across the Seattle area. Their entire membership database lived in spreadsheets, with no way to search, filter, or manage members online.',
              'The goal was to move everything into their WordPress site without losing a single record.',
            ],
          },
          {
            kind: 'cards',
            heading: 'Highlights',
            cards: [
              {
                title: 'Member Migration',
                body: 'Moved 2,800+ member records from spreadsheets into WordPress with zero data loss.',
              },
              {
                title: 'Automated Imports',
                body: 'Built tools for importing new members and keeping profiles up to date.',
              },
              {
                title: 'Daily Backups',
                body: 'Automated backups protect the live membership data every day.',
              },
            ],
          },
        ],
      },
    },
    {
      id: 'cyber-minds-chatbot',
      title: 'Cyber Minds AI Chatbot',
      period: 'Jan 2024 – Jun 2024',
      blurb:
        'A conversational chatbot that answers common questions for a cybersecurity education nonprofit.',
      tech: ['Python', 'scikit-learn', 'Firebase'],
      built: [
        'A chatbot that answers common visitor questions about the nonprofit\'s courses.',
        'A model that personalizes course content for students working through the curriculum.',
      ],
      impact: 'Handles visitor questions on the nonprofit\'s website, reducing manual response time.',
      learned:
        'Leading volunteers differs from leading employees — people have competing priorities. I learned to set realistic timelines and flag blockers early.',
      links: [{ label: 'View Code', href: GITHUB }],
    },
    {
      id: 'bump',
      title: 'Bump',
      period: '',
      blurb:
        'A native iOS social app that helps friends meet up spontaneously by combining real-time location proximity with calendar availability.',
      tech: ['SwiftUI', 'Supabase', 'CoreLocation', 'EventKit', 'Swift'],
      built: [
        'Detects when friends are nearby and lets you send a casual, low-pressure invite to meet up.',
        'Shows mutual calendar availability so plans land on a time that actually works.',
        'Built with privacy controls that let users choose when to share their location and availability.',
      ],
      impact:
        'A functional prototype demonstrating real-time friend proximity detection and calendar-aware scheduling.',
      learned:
        'Privacy matters more than features — users worry about real-time location sharing, so I built granular opt-in controls with the ability to disable location, calendar, or notifications at any time.',
      links: [
        { label: 'View Code', href: 'https://github.com/TejaswiErattu/bump' },
        { label: 'Read the full write-up', href: '/projects/bump' },
      ],
      locationId: 'mobile-innovation-observatory',
      detail: {
        eyebrow: 'Native iOS App',
        intro:
          'A native iOS social app that helps friends meet up spontaneously by combining real-time location proximity with calendar availability — reducing the friction between wanting to hang out and actually doing it.',
        blocks: [
          {
            kind: 'video',
            src: '/videos/bump-demo.mp4',
            poster: '/videos/bump-poster.jpg',
            caption:
              'Walkthrough of the Bump app — sign in, friend discovery, proximity detection, and calendar integration.',
          },
          {
            kind: 'prose',
            heading: 'Why I Built It',
            paragraphs: [
              "Making plans with friends shouldn't feel like a chore. Even when you're nearby, you have no idea your friend is just around the corner, and scheduling usually means back-and-forth messaging.",
              'I wanted an app that makes spontaneous meetups effortless — without giving up control over your privacy.',
            ],
          },
          {
            kind: 'cards',
            heading: 'Highlights',
            cards: [
              {
                title: 'Proximity Detection',
                body: 'Detects friends nearby and lets you send a quick, casual invite to meet up.',
              },
              {
                title: 'Calendar-Aware Scheduling',
                body: 'Shows mutual availability so plans land on a time that actually works.',
              },
              {
                title: 'Privacy-First Design',
                body: 'Granular controls for location, calendar, and notifications — every sharing feature has an opt-out.',
              },
            ],
          },
          {
            kind: 'chips',
            heading: 'Tech Stack',
            items: ['Swift', 'SwiftUI', 'CoreLocation', 'EventKit', 'Supabase'],
          },
        ],
      },
    },
  ],

  experience: [
    {
      id: 'palana',
      role: 'Security Engineer',
      company: 'Palana',
      period: 'June 2026 – Present',
      location: 'Seattle, WA',
      bullets: PALANA_ROLE_SUMMARY,
      current: true,
      locationId: 'current-roles-station',
    },
    {
      id: 'ahf',
      role: 'Software Engineering Lead',
      company: 'Accountability & Hopeful Fridays',
      period: 'May 2026 – Present',
      location: 'Remote',
      bullets: AHF_ROLE_SUMMARY,
      current: true,
      locationId: 'current-roles-station',
    },
    {
      id: 'winfo',
      role: 'Finance Director',
      company: 'Women in Informatics (WINFO)',
      period: 'Current position',
      location: 'Seattle, WA',
      bullets: [
        'Serves as Finance Director for Women in Informatics at the University of Washington.',
        'Supports the organization through finance and coordination — budgets, reimbursements, and sponsorships.',
      ],
      current: true,
      locationId: 'current-roles-station',
    },
    {
      id: 'kaw',
      role: 'Developer Intern',
      company: 'Kerala Association of Washington',
      period: 'May 2025 – Dec 2025',
      location: 'Sammamish, WA',
      bullets: [
        'Helped Kerala Association of Washington move its member records onto a production WordPress system.',
        'Built the membership platform that the organization uses today — see the Kerala Association of Washington station for an overview.',
      ],
      locationId: 'engineering-workshop',
    },
    {
      id: 'icode',
      role: 'Instructor',
      company: 'iCode',
      period: 'Jan 2025 – Sept 2025',
      location: 'Sammamish, WA',
      bullets: [
        'Taught coding to 60+ elementary and middle school students using Minecraft Education and Python.',
        'Led robotics and Minecraft camps mentoring small student teams through hands-on STEM challenges.',
      ],
      locationId: 'ai-teaching-schoolhouse',
    },
    {
      id: 'apollo',
      role: 'AI Trainer and Tester',
      company: 'Apollo AI',
      period: 'May 2024 – May 2025',
      location: 'Sammamish, WA',
      bullets: [
        'Trained and evaluated machine learning models for an educational platform supporting K-12 students.',
      ],
      locationId: 'ai-teaching-schoolhouse',
    },
    {
      id: 'ilink',
      role: 'PM Intern',
      company: 'iLink Digital',
      period: 'June 2024 – Aug 2024',
      location: 'Bellevue, WA',
      bullets: [
        'Collaborated across 3 client teams to test 20+ AI automation tools (Zapier, UiPath) and build Power BI dashboards, informing delivery decisions for live projects',
        'Coordinated with engineers, PMs, and C-suite stakeholders through 20+ Agile ceremonies (Jira, Microsoft Teams), aligning cross-functional priorities across 3 client engagements',
      ],
      locationId: 'engineering-workshop',
    },
    {
      id: 'cyber-minds',
      role: 'Machine Learning Manager',
      company: 'Cyber Minds Non-Profit',
      period: 'Jan 2024 – June 2024',
      location: 'Sammamish, WA',
      bullets: [
        'Built and deployed a chatbot for a cybersecurity education nonprofit and led a small team building a machine learning-powered course.',
      ],
      locationId: 'ai-teaching-schoolhouse',
    },
    {
      id: 'goezz',
      role: 'Frontend Developer',
      company: 'GoEzz',
      period: 'July 2022 – Aug 2023',
      location: 'Remote',
      bullets: [
        'Built 5 responsive webpages (React, JavaScript, Webpack) improving site load time 30% and user engagement 25%',
      ],
      locationId: 'engineering-workshop',
    },
  ],

  education: {
    school: 'University of Washington',
    degree: 'BS in Informatics',
    focusArea: 'Software Engineering + Cyber Security',
    expectedGraduation: '2028',
    gpa: '3.8 / 4.0',
    skills: [
      {
        category: 'Languages',
        items: [
          'Python',
          'Java',
          'TypeScript',
          'JavaScript',
          'HTML/CSS',
          'SQL',
          'PHP',
          'Swift',
          'Lua',
        ],
      },
      {
        category: 'Frameworks & Tools',
        items: [
          'React',
          'Node.js',
          'Git',
          'WordPress',
          'MySQL',
          'VS Code Extension API',
          'ARKit',
          'Webpack',
          'Power BI',
          'Jira',
          'Confluence',
          'Agile/Scrum',
        ],
      },
      {
        category: 'ML / AI',
        items: [
          'Classification',
          'Regression',
          'Model Evaluation',
          'Hyperparameter Tuning (scikit-learn, GridSearchCV, Pandas, NumPy)',
          'Computer Vision (YOLOv8, CoreML, Vision)',
          'LLM API Integration (OpenAI API)',
        ],
      },
      {
        category: 'Cloud / Infra',
        items: ['AWS', 'Azure', 'GCP', 'Docker', 'CI/CD (GitHub Actions)'],
      },
      {
        category: 'Design',
        items: ['Adobe Creative Suite (Photoshop, Illustrator, Spark)'],
      },
    ],
  },

  security: {
    role: 'Security Engineer',
    organization: 'Palana',
    period: 'June 2026 – Present',
    bullets: PALANA_BULLETS,
    skills: [
      'Threat Modeling (STRIDE)',
      'Vulnerability Assessment',
      'Network Security Fundamentals',
      'Zero Trust Architecture',
      'IAM / Access Control',
      'Cryptography Fundamentals',
      'Incident Response',
      'Responsible AI / AI Risk Management',
      'Burp Suite',
      'Semgrep',
      'npm audit',
    ],
    certifications: ['AWS AI Practitioner', 'Security+', 'AWS Cloud Practitioner'],
  },

  achievements: [
    {
      id: 'aws-ai',
      title: 'AWS Certified AI Practitioner',
      detail: 'Amazon Web Services certification.',
      period: '',
    },
    {
      id: 'security-plus',
      title: 'CompTIA Security+',
      detail: 'Industry-standard cybersecurity certification.',
      period: '',
    },
    {
      id: 'aws-cloud',
      title: 'AWS Certified Cloud Practitioner',
      detail: 'Amazon Web Services certification.',
      period: '',
    },
    {
      id: 'win-finance',
      title: 'Finance Director, Women in Informatics',
      detail: 'Elected leadership role for the UW Women in Informatics organization.',
      period: '6 months – present',
    },
    {
      id: 'night-ride',
      title: 'Application Security Engineer, Palana UW Night Ride',
      detail: 'Application security work on the UW Night Ride product.',
      period: '3 months – present',
    },
    {
      id: 'martial-arts',
      title: 'Martial Arts Head Instructor',
      detail: 'Head instructor role held for three years.',
      period: '3 years – 2024',
      locationId: 'ai-teaching-schoolhouse',
    },
    {
      id: 'coding-instructor',
      title: 'Coding Instructor',
      detail: 'Taught programming to elementary and middle school students for three years.',
      period: '3 years – 2025',
    },
  ],

  growth: {
    headline: "What I'm Growing Next",
    intro:
      "A few things I'm working toward next — places to experiment, build, and keep improving what I've already shipped.",
    plans: [
      {
        id: 'hackathons',
        title: 'Hackathons',
        paragraphs: [
          'I enjoy attending hackathons and plan to attend more later in the year.',
          'They are a place to experiment, collaborate, and build quickly.',
        ],
      },
      {
        id: 'home-lab',
        title: 'Home Lab',
        paragraphs: [
          'I plan to build my own home lab later this year.',
          'It will be a way to practice networking, security, cloud infrastructure, and system administration.',
        ],
      },
      {
        id: 'github-extension',
        title: 'GitHub Extension',
        paragraphs: [
          'I plan to continue developing the GitHub Extension.',
          'Future work includes improving its safety checks, Git workflows, and usefulness for student teams.',
        ],
      },
    ],
    suggestion: {
      toEmail: EMAIL,
      subject: 'Portfolio Growth Idea',
      maxLength: 1000,
      buttonLabel: 'Send Suggestion',
      placeholder: 'Suggest a project, skill, or experiment I should try next…',
    },
  },

  contact: {
    email: EMAIL,
    phone: PHONE,
    linkedin: LINKEDIN,
    github: GITHUB,
    resumes: RESUMES,
    location: LOCATION,
    blurb: "I'd love to hear from you — feel free to reach out by email, LinkedIn, or GitHub.",
    rolesSeeking: [
      'Software engineering',
      'Security engineering',
      'Data engineering',
      'Full-stack development',
      'Machine learning',
    ],
    availability: 'Available for 2027 internships — onsite, hybrid, or remote',
  },
}

/* ------------------------------------------------------------------ */
/* Village location content                                           */
/* ------------------------------------------------------------------ */

/** One window, station, or plot shown in a location's signpost overlay. */
export interface VillageWindow {
  id: string
  label: string
  description: string
}

/**
 * One of the nine village locations: the facade sign text, the signpost's
 * heading + one-liner, and the list of windows/stations/plots it contains.
 * This is pure display metadata — the actual prose for each window still
 * lives in `content.experience`, `content.projects`, `content.achievements`,
 * `content.about`, `content.growth`, or `content.contact`. `locations.ts`
 * (the game layer) reads this to build signposts; it is not read there yet.
 */
export interface VillageLocation {
  id: string
  name: string
  signHeading: string
  signDescription: string
  windows: VillageWindow[]
}

export const villageLocations: VillageLocation[] = [
  {
    id: 'about-cottage',
    name: 'About Me Flower Cottage',
    signHeading: 'ABOUT ME',
    signDescription: 'A little about who I am and where I studied.',
    windows: [
      {
        id: 'introduction',
        label: 'Introduction',
        description: 'A short introduction to who I am.',
      },
      {
        id: 'uw-education',
        label: 'UW and Education',
        description: 'My degree, focus area, and university.',
      },
    ],
  },
  {
    id: 'current-roles-station',
    name: 'Current Roles Train Station',
    signHeading: 'CURRENT ROLES',
    signDescription: 'See the roles I hold today and the work I am currently helping lead.',
    windows: [
      {
        id: 'palana',
        label: 'Palana',
        description: 'Security Engineer — threat modeling and penetration testing.',
      },
      {
        id: 'ahf',
        label: 'Accountability & Hopeful Fridays',
        description: 'Software Engineering Lead — infrastructure and CI/CD planning.',
      },
      {
        id: 'winfo',
        label: 'Women in Informatics',
        description: 'Finance Director — budgets, reimbursements, and sponsorships.',
      },
    ],
  },
  {
    id: 'engineering-workshop',
    name: 'Engineering Workshop',
    signHeading: 'ENGINEERING EXPERIENCE',
    signDescription: 'Past engineering roles where I shipped production code.',
    windows: [
      {
        id: 'kaw',
        label: 'Kerala Association of Washington',
        description: 'Developer Intern — WordPress membership migration platform.',
      },
      {
        id: 'ilink',
        label: 'iLink Digital',
        description: 'PM Intern — AI automation tooling and dashboards.',
      },
      {
        id: 'goezz',
        label: 'GoEzz',
        description: 'Frontend Developer — responsive web pages.',
      },
    ],
  },
  {
    id: 'ai-teaching-schoolhouse',
    name: 'AI & Teaching Schoolhouse',
    signHeading: 'AI & TEACHING',
    signDescription: 'Roles training machine learning models and teaching others to code.',
    windows: [
      {
        id: 'apollo',
        label: 'Apollo AI',
        description: 'AI Trainer and Tester — model training and evaluation.',
      },
      {
        id: 'cyber-minds',
        label: 'Cyber Minds',
        description: 'Machine Learning Manager — chatbot and curriculum ML.',
      },
      {
        id: 'icode',
        label: 'iCode',
        description: 'Instructor — teaching coding to elementary and middle school students.',
      },
      {
        id: 'martial-arts',
        label: 'Martial Arts Leadership',
        description: 'Head instructor role held for three years.',
      },
    ],
  },
  {
    id: 'mobile-innovation-observatory',
    name: 'Mobile Innovation Observatory',
    signHeading: 'MOBILE INNOVATION',
    signDescription: 'Native iOS apps exploring location, sensing, and spontaneous connection.',
    windows: [
      { id: 'findar', label: 'Findar', description: 'AR object finder using LiDAR and YOLOv8.' },
      { id: 'bump', label: 'Bump', description: 'Proximity-based social meetup app.' },
    ],
  },
  {
    id: 'developer-tools-workshop',
    name: 'Developer Tools Cyber Workshop',
    signHeading: 'DEVELOPER TOOLS',
    signDescription: 'Tools that make development safer and more organized.',
    windows: [
      {
        id: 'github-extension',
        label: 'GitHub Extension',
        description: 'VS Code extension for safer Git workflows.',
      },
      {
        id: 'cyber-study-tracker',
        label: 'Cyber Study Tracker',
        description: 'Personal cybersecurity study plan dashboard.',
      },
    ],
  },
  {
    id: 'community-impact-greenhouse',
    name: 'Community Impact Greenhouse',
    signHeading: 'COMMUNITY IMPACT',
    signDescription: 'Projects built for teams, organizations, and communities.',
    windows: [
      {
        id: 'terralend',
        label: 'TerraLend',
        description: 'Climate-aware agricultural lending engine.',
      },
      {
        id: 'unearthed',
        label: 'Unearthed Dinos',
        description: 'FIRST LEGO League team website.',
      },
      {
        id: 'winfo-website',
        label: 'WINFO Website',
        description: 'Official Women in Informatics website.',
      },
    ],
  },
  {
    id: 'contact-post-office',
    name: 'Contact Post Office',
    signHeading: 'CONTACT',
    signDescription: 'Ways to reach me.',
    windows: [
      { id: 'email', label: 'Email', description: 'Send me an email directly.' },
      { id: 'linkedin', label: 'LinkedIn', description: 'Connect with me on LinkedIn.' },
      { id: 'github', label: 'GitHub', description: 'See my code on GitHub.' },
    ],
  },
  {
    id: 'growth-farm',
    name: 'Growth Farm',
    signHeading: "WHAT I'M GROWING NEXT",
    signDescription: "What I'm working toward next.",
    windows: [
      { id: 'hackathons', label: 'Hackathons', description: 'Plans to attend more hackathons.' },
      {
        id: 'home-lab',
        label: 'Home Lab',
        description: 'Plans to build a home lab for networking and security practice.',
      },
      {
        id: 'github-extension',
        label: 'GitHub Extension',
        description: 'Plans to keep developing the GitHub Extension.',
      },
      {
        id: 'suggestion',
        label: 'Suggest Something',
        description: 'Send a project, skill, or experiment idea by email.',
      },
    ],
  },
]

/** Looks up one village location by id. Throws so a typo fails loudly rather than rendering nothing. */
export function getVillageLocation(id: string): VillageLocation {
  const location = villageLocations.find((entry) => entry.id === id)
  if (!location) throw new Error(`Unknown village location id: ${id}`)
  return location
}

/** Every `content.experience` entry assigned to a given village location, in source order. */
export function experienceForLocation(locationId: string): ExperienceEntry[] {
  return content.experience.filter((entry) => entry.locationId === locationId)
}

/** Every `content.projects` entry assigned to a given village location, in source order. */
export function projectsForLocation(locationId: string): Project[] {
  return content.projects.filter((entry) => entry.locationId === locationId)
}

/**
 * Labels for the small contextual action button shown near a special
 * location (train station, greenhouse, farm, post office). Plain data only —
 * no interaction is wired up to these yet.
 */
export const contextualActions = {
  incomingTrain: 'Incoming Train',
  plantMore: 'Plant More',
  dropFeed: 'Drop Feed',
  sendMail: 'Send Mail',
} as const

/**
 * Navigation sections shared by the top bar, the classic-mode page, and
 * (later) the building interactions. One list, one set of anchor ids.
 */
export const sections = [
  { id: 'about', label: 'About' },
  { id: 'experience', label: 'Experience' },
  { id: 'projects', label: 'Projects' },
  { id: 'education', label: 'Education' },
  { id: 'security', label: 'Security' },
  { id: 'achievements', label: 'Achievements' },
  { id: 'growth', label: 'Growth' },
  { id: 'contact', label: 'Contact' },
] as const

export type SectionId = (typeof sections)[number]['id']
