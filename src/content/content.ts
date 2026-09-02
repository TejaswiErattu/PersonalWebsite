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

/** One workstation inside the Tech Lab. */
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
}

/** One desk NPC inside the Town Hall. */
export interface ExperienceEntry {
  id: string
  role: string
  company: string
  period: string
  location: string
  bullets: string[]
}

/** Library content. */
export interface Education {
  school: string
  degree: string
  focusArea: string
  expectedGraduation: string
  gpa: string
  skills: { category: string; items: string[] }[]
}

/** Security Center content. */
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
  },

  projects: [
    {
      id: 'findar',
      title: 'Findar — AR Object Finder (iOS)',
      period: 'Feb 2026',
      blurb:
        'Augmented reality-powered iOS app that passively remembers where objects were last seen using LiDAR depth sensing, YOLOv8 object detection, and voice commands.',
      tech: ['Swift', 'ARKit', 'CoreML', 'YOLOv8', 'LiDAR', 'Vision', 'SwiftUI', 'Speech'],
      built: [
        'Built native iOS augmented reality app using ARKit with LiDAR depth sensing for real-time 3D spatial awareness, detecting 80+ object categories in real time',
        'Processed raw LiDAR depth buffers (CVPixelBuffer) to compute object distance and guide users to lost items via 5-zone directional voice navigation',
        'Engineered a concurrent on-device detection pipeline (Vision, background queues, frame-skipping) sustaining 60fps while running YOLOv8 inference every 8th frame',
        'Built safety and voice systems: sub-30cm obstacle detection with haptic alerts, and natural-language command parsing (SFSpeechRecognizer) for hands-free searches like "find my keys"',
      ],
      impact:
        'Real-time object detection with LiDAR depth, voice-guided navigation, and spatial awareness — built in 24 hours',
      learned:
        'Augmented reality apps demand extreme attention to frame timing and threading. Running YOLO inference, depth mapping, and speech recognition concurrently on-device taught me how to architect real-time pipelines without blocking the main thread.',
      links: [
        { label: 'View Code', href: 'https://github.com/TejaswiErattu/findar' },
        { label: 'Read the full write-up', href: '/projects/findar' },
      ],
      detail: {
        badges: ['Built in 24 hours'],
        intro:
          `An augmented reality-powered iOS app that helps you find lost objects without tags, ` +
          `trackers, or setup. Just say "find my keys" and Findar guides you to them using LiDAR ` +
          `depth sensing, YOLOv8 object detection, and voice navigation.`,
        blocks: [
          {
            kind: 'video',
            src: '/videos/findar-demo.mp4',
            poster: '/videos/findar-poster.jpg',
            caption:
              'Findar in action — voice command, real-time object detection with YOLOv8, and LiDAR-guided navigation.',
          },
          {
            kind: 'prose',
            heading: 'The Problem',
            paragraphs: [
              `The average person spends 2.5 days per year looking for lost items. Existing ` +
                `solutions like AirTags and Tile require you to pre-tag every object — which means ` +
                `you can only find things you already planned to lose.`,
              `There's no solution for the spontaneous "where did I put my glasses?" moment. I ` +
                `wanted something that works passively, with zero setup, using hardware people ` +
                `already own.`,
            ],
          },
          {
            kind: 'list',
            heading: 'Current Limitations',
            tone: 'negative',
            items: [
              'AirTags/Tile require pre-tagging every object',
              "Can't find items you forgot to tag",
              'No spatial awareness — just "nearby" or "not nearby"',
              'No voice-guided navigation to the object',
            ],
          },
          {
            kind: 'steps',
            heading: 'How Findar Works',
            blurb:
              `Findar connects a camera, LiDAR sensor, and on-device artificial intelligence to ` +
              `build a real-time 3D understanding of your space. Just point your phone and speak — ` +
              `it does the rest.`,
            steps: [
              {
                title: 'Voice Command',
                body: `Say "find my keys", "where's my phone", or "look for my laptop". The Speech framework parses natural language with debouncing, noise filtering, and synonym matching.`,
              },
              {
                title: 'Object Detection (YOLOv8)',
                body: 'Every 8th augmented reality frame is fed through a YOLOv8n CoreML model that detects 80+ object categories in real time. Bounding boxes are drawn as overlays with confidence scores.',
              },
              {
                title: 'LiDAR Depth Mapping',
                body: 'The LiDAR sensor provides smoothed scene depth for every detected object. Findar calculates distance in feet and detects obstacles within 30cm for safety warnings.',
              },
              {
                title: 'Voice + Haptic Navigation',
                body: `"Found it! To your left, about 4 feet away." Findar speaks directions, provides haptic feedback on detection, and auto-confirms when the object is within arm's reach for 2 seconds.`,
              },
            ],
          },
          {
            kind: 'cards',
            heading: 'Key Features',
            cards: [
              {
                title: 'Natural Voice Search',
                body: `Understands "find my phone", "where are my keys", "look for the remote" — with filler word filtering and synonym matching for 80+ objects.`,
              },
              {
                title: 'Real-Time Detection',
                body: 'YOLOv8n runs on every 8th AR frame via CoreML. Detections above 50% confidence get bounding box overlays with labels and percentages.',
              },
              {
                title: 'Directional Guidance',
                body: '5-zone direction system: far left, left, straight ahead, right, far right — with distance in feet computed from LiDAR depth buffer.',
              },
              {
                title: 'Obstacle Safety',
                body: 'LiDAR scans the center of the frame for obstacles under 30cm. Triggers haptic feedback and a spoken warning naming the obstacle if recognized.',
              },
              {
                title: 'Haptic Feedback',
                body: `Three intensity levels: light (scanning), medium (object found), success (object reached). Auto-confirms retrieval when within arm's reach for 2 seconds.`,
              },
              {
                title: 'Premium Voice Output',
                body: 'Prioritizes premium Siri voices (Zoe, Ava) for natural speech. Rate, pitch, and volume tuned for clarity during active search.',
              },
            ],
          },
          {
            kind: 'columns',
            heading: 'Architecture',
            blurb:
              'Everything runs on-device — no cloud, no network, no latency. ARKit provides the camera feed and LiDAR depth. CoreML runs YOLOv8. Speech framework handles voice I/O. All three pipelines run concurrently with careful frame scheduling.',
            columns: [
              {
                title: 'Perception',
                items: [
                  'ARKit ARWorldTrackingConfiguration',
                  'LiDAR smoothedSceneDepth',
                  'YOLOv8n via VNCoreMLRequest',
                  'Frame skip (every 8th) for perf',
                ],
              },
              {
                title: 'Intelligence',
                items: [
                  'Synonym matching (phone → cell phone)',
                  'Primary-word extraction from commands',
                  'Depth-based distance estimation',
                  '5-zone directional classification',
                ],
              },
              {
                title: 'Interaction',
                items: [
                  'SFSpeechRecognizer with debouncing',
                  'AVSpeechSynthesizer (premium voices)',
                  '3-level UIImpactFeedbackGenerator',
                  'Auto-restart listening loop',
                ],
              },
            ],
          },
          {
            kind: 'code',
            heading: 'The Real-Time Pipeline',
            blurb:
              "Every augmented reality frame triggers a cascade of processing — but only what's needed. The system is designed to never block the main thread.",
            language: 'text',
            source: `ARFrame → every frame

├─ checkSafety() → LiDAR center scan → obstacle warning (every 6s)

├─ frameSkip → only process every 8th frame

├─ runDetection() → VNImageRequestHandler → YOLOv8n (background queue)

│   └─ filter detections → confidence > 50%

├─ processDetections() → match target via synonyms

│   ├─ found → getDistance() → describeDirection() → speak + haptic

│   └─ not found → 8s timeout → "Keep looking around"

└─ arm's reach check → < 0.5m for 2s → "Nice, got it!"`,
          },
          {
            kind: 'chips',
            heading: 'Tech Stack',
            items: [
              'Swift',
              'SwiftUI',
              'ARKit',
              'RealityKit',
              'CoreML',
              'YOLOv8n',
              'Vision',
              'LiDAR',
              'Speech Framework',
              'AVSpeechSynthesizer',
              'UIKit Haptics',
              'Xcode',
              'iOS 17+',
            ],
          },
          {
            kind: 'steps',
            heading: 'Smart Object Matching',
            blurb: `Users say things naturally — "find my phone", "where's the TV remote", "help me find my bag". The system handles this through a multi-pass matching pipeline:`,
            steps: [
              {
                title: 'Voice Parsing',
                body: `Recognizes patterns like "find my ___", "where is the ___", "look for ___". Filters filler words (um, uh, like) and extracts the meaningful 1-2 word object name.`,
              },
              {
                title: 'Exact Match',
                body: `First tries exact label match from YOLO detections. If the user says "laptop" and YOLO detects "laptop", it's an instant match.`,
              },
              {
                title: 'Synonym Lookup',
                body: 'Built-in synonym map: phone ↔ cell phone, laptop ↔ computer, couch ↔ sofa, tv ↔ monitor, bag ↔ backpack/handbag/suitcase, and more.',
              },
              {
                title: 'Fuzzy Match',
                body: `Partial string matching and primary-word extraction. "water bottle" matches "bottle", "TV remote" matches "remote".`,
              },
            ],
          },
          {
            kind: 'cards',
            heading: 'What I Learned',
            cards: [
              {
                title: 'Real-Time Pipeline Design',
                body: 'Running YOLO inference, LiDAR depth reads, and speech recognition concurrently on a phone. Frame skipping, background queues, and debouncing are critical to keeping 60fps smooth.',
              },
              {
                title: 'On-Device Machine Learning',
                body: 'Converting YOLOv8n to .mlmodelc for CoreML, understanding VNCoreMLRequest threading, and tuning confidence thresholds for real-world accuracy vs. false positives.',
              },
              {
                title: 'LiDAR Depth Buffers',
                body: 'Working with raw CVPixelBuffer depth maps — lock addresses, calculate byte offsets, and sample Float32 values. The depth-to-bounding-box mapping was the trickiest part.',
              },
              {
                title: 'Rapid Prototyping',
                body: 'Scoping an ambitious augmented reality project to 24 hours. I cut temporal memory and multi-room tracking to ship a polished single-room prototype.',
              },
            ],
          },
          {
            kind: 'cards',
            heading: 'Future Vision',
            blurb:
              'Findar is designed to be plugged into systems people already use — Alexa, Ring cameras, smart home hubs. The long-term vision:',
            cards: [
              {
                title: 'Temporal Memory',
                body: `Remember where objects were last seen over hours and days — "Your keys were on the kitchen counter 20 minutes ago."`,
              },
              {
                title: 'Multi-Camera',
                body: 'Connect Ring cameras and security systems for whole-home coverage without needing to walk around scanning.',
              },
              {
                title: 'Alexa Integration',
                body: `"Alexa, where are my glasses?" — and your nearest Echo Show displays the location on a floor map.`,
              },
            ],
          },
        ],
      },
    },
    {
      id: 'github-extension',
      title: 'GitHub Extension (VS Code)',
      period: 'Jan 2026 – Jun 2026',
      blurb:
        'TypeScript VS Code extension that puts a safety layer in front of Git: secret scanning, risk classification, and preview-and-confirm gates for destructive commands.',
      tech: ['TypeScript', 'VS Code Extension API', 'Node.js', 'Git CLI', 'Webview API'],
      built: [
        'Built a pre-commit secret detection pipeline (TypeScript, regex) scanning staged diffs across 6 credential pattern types, blocking exposed secrets before they reached version control',
        'Designed a real-time risk classification engine (Git CLI, TypeScript) that scored every Git action low/medium/high risk, adding confirmation gates to previously unguarded destructive operations',
        'Implemented a command preview/confirmation flow across 6 core Git workflows (commit, push, pull, branch, staging, sync) using the VS Code Extension API, eliminating blind execution of AI-generated Git commands',
        'Developed a branch overlap detection system (Git diff parsing) that cross-referenced file-level changes across active branches for teams of 2-10, flagging conflicts before merge',
      ],
      impact:
        'Node.js child_process drives direct Git CLI integration across a 9-stage pipeline (parsing, risk analysis, safe execution) for student teams of 2-10',
      learned:
        'Guardrails only work if they are faster than the unsafe path. Every gate had to justify the extra keystroke, which pushed me toward previewing intent rather than blocking actions outright.',
      links: [{ label: 'View Code', href: GITHUB }],
    },
    {
      id: 'unearthed',
      title: 'Unearthed Dinos FIRST LEGO League Website',
      period: '',
      blurb:
        'Full-stack team website for a FIRST LEGO League robotics team featuring an AI-powered chatbot, interactive timeline, team profiles, and community outreach showcase.',
      tech: ['React', 'Vite', 'Tailwind CSS', 'Express.js', 'OpenAI API', 'Framer Motion', 'Vercel'],
      built: [
        'Built full-stack React website with Express.js backend, deployed on Vercel with serverless functions',
        'Created AI-powered chatbot using OpenAI GPT-4o-mini with local site search fallback and optional web search via Google Custom Search Engine',
        'Designed archaeology-themed user interface with Framer Motion animations, responsive layouts, and team member profiles',
        'Implemented interactive timeline, outreach showcase, robot design documentation, and awards gallery',
      ],
      impact:
        'Live team website with AI chatbot serving FIRST LEGO League knowledge, team info, and web search — used by team members, parents, and judges',
      learned:
        'Building for a team of kids means the user interface needs to be instantly understandable. The chatbot taught me how to layer search — try local content first, then offer web search only with user consent.',
      links: [
        { label: 'View Code', href: 'https://github.com/TejaswiErattu/UnearthedFLLWebsite' },
        { label: 'Live Demo', href: 'https://unearthedfllwebsite27820.vercel.app' },
        { label: 'Read the full write-up', href: '/projects/unearthed' },
      ],
      detail: {
        eyebrow: 'FIRST LEGO League',
        intro:
          `A full-stack team website for the "Unearthed Dinos" FIRST LEGO League robotics team — ` +
          `featuring an AI-powered chatbot, archaeology-themed design, interactive timeline, and ` +
          `community outreach showcase.`,
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
            heading: 'The Problem',
            paragraphs: [
              `FLL teams need to present their work to judges, sponsors, and community members — ` +
                `but most teams rely on scattered Google Docs, PowerPoints, and social media posts ` +
                `that don't tell a cohesive story.`,
              'The team also wanted an interactive way for visitors to learn about FIRST LEGO League concepts like Core Values, Robot Game strategy, and judging tips — without having to manually answer every question.',
            ],
          },
          {
            kind: 'list',
            heading: 'Challenges',
            tone: 'negative',
            items: [
              'No centralized showcase for robot design, outreach, and team identity',
              'Visitors and judges had no quick way to learn about FIRST LEGO League or the team',
              "Team members couldn't easily share progress with parents and sponsors",
              'No interactive tool for exploring FIRST LEGO League knowledge and strategy',
            ],
          },
          {
            kind: 'cards',
            heading: 'What I Built',
            blurb:
              'A single-page React app with a full Express.js backend, deployed on Vercel. The site covers every aspect of the team — from member profiles to robot specs to community impact.',
            cards: [
              {
                title: 'Team Profiles',
                body: '5 member cards with photos, roles, and favorite dinosaurs. Animated with Framer Motion on scroll.',
              },
              {
                title: 'Robot Design',
                body: 'Detailed breakdown of chassis, drive system, sensors, modular attachments, and block-based code with PID tuning.',
              },
              {
                title: 'Community Outreach',
                body: 'Museum Maker Day (120+ kids), Library Talks, and STEM Night (300 visitors) — all documented with photos and impact metrics.',
              },
              {
                title: 'AI Chatbot',
                body: 'GPT-4o-mini powered chatbot that searches the site first, then optionally searches the web — with built-in FIRST LEGO League knowledge base.',
              },
              {
                title: 'Interactive Timeline',
                body: 'Alternating timeline from team formation through competitions, outreach, and summer workshops.',
              },
              {
                title: 'Awards Gallery',
                body: 'Championship Finalist, Robot Design Winner, and Core Values Award — with photos from competition events.',
              },
            ],
          },
          {
            kind: 'steps',
            heading: 'The AI Chatbot',
            blurb:
              'The chatbot was the most technically interesting piece. It uses a three-layer search strategy to always give the best possible answer while respecting user privacy.',
            steps: [
              {
                title: 'Local Site Search',
                body: 'First, the chatbot tokenizes the question and searches indexed content from the website itself — team data, section text, and member info. Fast, free, and private.',
              },
              {
                title: 'Built-in FIRST LEGO League Knowledge Base',
                body: 'If the question is about FIRST LEGO League concepts (Core Values, Robot Game, judging, Innovation Project), a curated knowledge base returns expert answers without any API calls.',
              },
              {
                title: 'Web Search (User Consent Required)',
                body: 'Only if the user explicitly agrees, the chatbot searches the web via Google Custom Search Engine, fetches page content, and uses GPT-4o-mini to synthesize a conversational answer with cited sources.',
              },
            ],
          },
          {
            kind: 'cards',
            heading: 'The Team',
            blurb:
              'The Unearthed Dinos are a 5-member FIRST LEGO League team exploring engineering through an archaeology theme — unearthing insights, testing hypotheses, and iterating like field scientists.',
            cards: [
              { title: 'Tanishqa — Media & Outreach Lead', body: 'Favorite dinosaur: Triceratops' },
              { title: 'Simone — Hardware & Scheduling', body: 'Favorite dinosaur: Velociraptor' },
              { title: 'Abhimanyu — Logistics & Email Admin', body: 'Favorite dinosaur: Stegosaurus' },
              { title: 'Manveer — Attendance & Treasurer', body: 'Favorite dinosaur: Ankylosaurus' },
              { title: 'Aarav — Team Member', body: 'Favorite dinosaur: Pachycephalosaurus' },
            ],
          },
          {
            kind: 'columns',
            heading: 'Architecture',
            blurb:
              'Full-stack React + Express application with a Vercel serverless backend. The chatbot handles local search, FIRST LEGO League knowledge, and web search with LRU caching.',
            columns: [
              {
                title: 'Frontend',
                items: [
                  'React 18 with Vite for fast HMR and builds',
                  'Tailwind CSS with custom archaeology-themed color palette',
                  'Framer Motion animations for team cards and scroll effects',
                  'React Router for section-based navigation',
                  'Client-side site search with tokenization and TF-IDF scoring',
                ],
              },
              {
                title: 'Backend',
                items: [
                  'Express.js server with Vercel serverless functions',
                  'OpenAI GPT-4o-mini for natural language answer synthesis',
                  'Google Custom Search Engine for web fallback',
                  'LRU cache (100 entries, 10-min TTL) for API response caching',
                  'Built-in FIRST LEGO League knowledge base with regex-matched answers',
                ],
              },
            ],
          },
          {
            kind: 'chips',
            heading: 'Tech Stack',
            items: [
              'React 18',
              'Vite',
              'Tailwind CSS',
              'Framer Motion',
              'React Router',
              'Express.js',
              'Node.js',
              'OpenAI GPT-4o-mini',
              'Google Custom Search Engine',
              'Vercel',
              'LRU Cache',
              'Lucide Icons',
            ],
          },
          {
            kind: 'cards',
            heading: 'Team Awards',
            blurb:
              "The website showcases the team's competition achievements — all displayed in the Awards gallery section.",
            cards: [
              { title: 'Championship Finalist', body: 'First Dive 2024–2025' },
              { title: 'Robot Design Winner', body: 'First Dive 2024–2025' },
              { title: 'Core Values Award', body: 'MasterPiece 2023–2024' },
            ],
          },
          {
            kind: 'stats',
            heading: 'Community Outreach',
            stats: [
              { value: '120+', label: 'Museum Maker Day — hands-on robotics demo station for kids' },
              {
                value: '300+',
                label: 'STEM Night — shared FIRST LEGO League core values and ran mini-missions',
              },
              { value: '3', label: 'Library Talks — Coding Fossils sessions empowering young minds' },
            ],
          },
          {
            kind: 'cards',
            heading: 'What I Learned',
            cards: [
              {
                title: 'Layered Search Architecture',
                body: 'Try local content first → curated knowledge base → web search only with consent. This pattern minimizes API costs while maximizing answer quality.',
              },
              {
                title: 'Building for Young Users',
                body: 'The user interface needed to be instantly understandable for kids, parents, and judges. Clear hierarchy, big cards, and a warm color palette made it accessible to everyone.',
              },
              {
                title: 'Dev-Mode Self-Tests',
                body: 'Built in-browser self-tests that run in development to catch regressions — verifying section IDs, team data, and DOM structure automatically.',
              },
              {
                title: 'Vercel Serverless',
                body: 'Learned to structure Express.js routes as Vercel serverless functions, handle environment variables securely, and optimize cold start performance with response caching.',
              },
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
        'Climate-aware agricultural lending engine that replaces static interest rates with dynamic, microclimate-driven risk pricing using live satellite and weather data.',
      tech: [
        'JavaScript',
        'Leaflet.js',
        'OpenStreetMap',
        'CARTO',
        'Satellite APIs',
        'Climate APIs',
        'Vercel',
      ],
      built: [
        'Built a climate-aware lending engine that continuously updates interest rates based on live satellite and weather data',
        'Integrated NDVI, soil moisture, temperature anomaly, and rainfall data layers into an interactive Leaflet map',
        'Created a simulation lab with climate archetypes (Dust Bowl, Deluge, Late Frost) to stress-test lending models',
        'Designed multi-role views for loan officers, farmers, and simulation analysts with full transparency',
      ],
      impact:
        'Interactive demo with live climate data, satellite overlays, and simulation lab for stress-testing lending models',
      learned:
        'Translating complex climate data into actionable financial signals requires careful user experience design. The biggest challenge was making microclimate stress scores intuitive for non-technical users like farmers and loan officers.',
      links: [
        { label: 'View Code', href: GITHUB },
        { label: 'Live Demo', href: 'https://terralend-tejaswi.vercel.app/' },
        { label: 'Read the full write-up', href: '/projects/terralend' },
      ],
      detail: {
        eyebrow: 'Climate-Aware FinTech',
        intro:
          'A climate-aware agricultural lending engine that replaces static, regional-average interest rates with dynamic, microclimate-driven risk pricing using live satellite and weather data.',
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
            heading: 'The Problem',
            paragraphs: [
              'Traditional agricultural lending uses static, annually-updated interest rates based on broad regional averages. A farmer in a drought-stricken microclimate pays the same rate as one with ideal growing conditions.',
              'This approach ignores real-time climate risk, punishes good stewards, rewards ignorance, and gives farmers zero visibility into how their rates are determined.',
            ],
          },
          {
            kind: 'list',
            heading: 'Old System Limitations',
            tone: 'negative',
            items: [
              'Static 7.2% rate updated only annually',
              'Based on broad regional averages',
              'Risk model uses only historical yield',
              'No farmer visibility into rate decisions',
            ],
          },
          {
            kind: 'cards',
            heading: 'The TerraLend Solution',
            blurb:
              'TerraLend replaces the old model with a continuously-updated, climate-aware lending engine that uses live satellite data and microclimate stress scoring to dynamically price agricultural loan risk — giving both lenders and farmers full transparency.',
            cards: [
              {
                title: 'Temperature Anomaly',
                body: 'Detects deviations from normal temperature ranges using live climate feeds, flagging heat stress or frost risk.',
              },
              {
                title: 'Drought Index',
                body: 'Monitors soil moisture levels and precipitation deficit to assess drought stress on crops in real time.',
              },
              {
                title: 'Rainfall Anomaly',
                body: 'Tracks rainfall patterns against historical baselines to detect flooding or drought conditions early.',
              },
              {
                title: 'NDVI Vegetation Index',
                body: 'Satellite-derived vegetation health monitoring showing crop vigor and land productivity in real time.',
              },
              {
                title: 'Interactive Map',
                body: 'Click any marker on the Leaflet-powered map to initialize a climate-aware lending analysis for that region.',
              },
              {
                title: 'Simulation Lab',
                body: 'Run climate archetype scenarios — Dust Bowl, Deluge, Late Frost — to see how stress scores and rates respond.',
              },
            ],
          },
          {
            kind: 'cards',
            heading: 'Climate Archetypes',
            blurb:
              'The simulation lab lets users test extreme climate scenarios and see their real-time impact on stress scores and interest rates.',
            cards: [
              {
                title: 'Dust Bowl',
                body: 'Extreme drought simulation with high temperature anomalies, depleted soil moisture, and minimal rainfall.',
              },
              {
                title: 'The Deluge',
                body: 'Flooding scenario with excessive rainfall, waterlogged soil, and potential crop submersion.',
              },
              {
                title: 'Late Frost',
                body: 'Unseasonable cold snap damaging crops during growth phase with sharp temperature drops.',
              },
            ],
          },
          {
            kind: 'cards',
            heading: 'Multi-Role Perspectives',
            blurb:
              'TerraLend serves different stakeholders with tailored views of the same underlying climate data.',
            cards: [
              {
                title: 'Loan Officer View',
                body: 'See composite stress scores, rate recommendations, and risk justifications for underwriting decisions.',
              },
              {
                title: 'Farmer View',
                body: 'Full transparency into how climate data affects your rate — understand exactly what drives your loan pricing.',
              },
              {
                title: 'Simulation Lab',
                body: 'Run what-if scenarios with climate archetypes to stress-test lending models before deploying them.',
              },
            ],
          },
          {
            kind: 'cards',
            heading: 'Satellite Data Layers',
            blurb:
              'The interactive map supports multiple overlay layers for comprehensive environmental analysis.',
            cards: [
              { title: 'NDVI', body: 'Vegetation health index' },
              { title: 'Soil Moisture', body: 'Ground water content' },
              { title: 'Temperature', body: 'Thermal anomaly detection' },
              { title: 'Rainfall', body: 'Precipitation tracking' },
            ],
          },
          {
            kind: 'chips',
            heading: 'Tech Stack',
            items: [
              'JavaScript',
              'Leaflet.js',
              'OpenStreetMap',
              'CARTO',
              'Satellite APIs',
              'NDVI Data',
              'Soil Moisture Sensors',
              'Climate APIs',
              'Vercel',
              'HTML/CSS',
            ],
          },
          {
            kind: 'table',
            heading: 'Old System vs. TerraLend',
            columns: ['Dimension', 'Old System', 'TerraLend'],
            rows: [
              ['Interest Rate', 'Static 7.2%', 'Dynamic, climate-adjusted'],
              ['Update Frequency', 'Annually', 'Continuously'],
              ['Data Source', 'Regional averages', 'Live climate + satellite data'],
              ['Risk Model', 'Historical yield', 'Microclimate stress scoring'],
              ['Farmer Visibility', 'None', 'Full transparency'],
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
        'Production WordPress system managing 2,800+ member records with automated imports and daily backups.',
      tech: ['PHP', 'MySQL', 'JavaScript', 'WordPress'],
      built: [
        'Migrated 2,800+ member records from inconsistent spreadsheets into WordPress with zero data loss',
        'Built custom PHP plugins for CSV imports, user profiles, password resets, and automated backups',
        'Designed schema mapping 9 key fields into searchable profiles and exportable admin reports',
        'Implemented data validation preventing duplicate entries and handling missing fields',
      ],
      impact: 'System runs in production serving live member base',
      learned:
        'Data cleaning always takes longer than expected. Spreadsheets had duplicates, missing fields, and inconsistent formats. I built validation upfront and wrote documentation so others could maintain the system months later.',
      links: [
        { label: 'View Code', href: GITHUB },
        { label: 'Read the full write-up', href: '/projects/kaw' },
      ],
      detail: {
        badges: ['2,800+ records migrated', 'Running in production', 'Zero data loss'],
        intro:
          'A production WordPress migration system that moved 2,800+ member records from messy spreadsheets into a live membership platform — with automated imports, password management, daily backups, and zero data loss.',
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
            heading: 'The Problem',
            paragraphs: [
              'Kerala Association of Washington (KAW) manages a community of 2,800+ members across the Seattle area. Their entire membership database lived in spreadsheets — with inconsistent formatting, duplicate entries, missing fields, and no way to search, filter, or manage members online.',
              'They needed to migrate everything into their WordPress site with Paid Memberships Pro integration, while sending every member login credentials — all without losing a single record.',
            ],
          },
          {
            kind: 'list',
            heading: 'Data Challenges',
            tone: 'negative',
            items: [
              '2,800+ records scattered across multiple spreadsheets',
              'Inconsistent column names and missing required fields',
              'Duplicate members with no unique identifier',
              'No automated way to assign membership levels',
              'Members had no login credentials or online profiles',
            ],
          },
          {
            kind: 'prose',
            heading: 'What I Built',
            paragraphs: [
              'I built two custom WordPress plugins from scratch: a CSV Migration Engine that handles the entire import pipeline, and a Backup & Restore System that protects the live database with automated daily snapshots.',
            ],
          },
          {
            kind: 'steps',
            heading: 'Plugin 1: CSV Migration Engine',
            blurb:
              'The core plugin that imports CSV files, maps fields to WordPress user profiles, handles duplicates, manages memberships, and sends onboarding emails — all from a single admin page.',
            steps: [
              {
                title: 'CSV Upload & Field Mapping',
                body: 'Admin uploads a CSV and selects a membership level. The plugin parses every row and maps 9 key fields — FirstName, LastName, Phone, Email, MembershipId, MembershipLastPaidDate, RecordCreatedDate, MembershipYear, and IsActive — using a flexible column name matcher that handles inconsistent headers across different spreadsheets.',
              },
              {
                title: 'Duplicate Detection & Smart Updates',
                body: 'For each row, the engine checks if a user already exists by email. Existing users get updated — but only blank fields are overwritten, so manually-edited data is never lost. New users are created with auto-generated temporary passwords and a forced password reset on first login.',
              },
              {
                title: 'City Extraction from Addresses',
                body: 'Many records had full addresses instead of clean city names. I built a keyword-matching system that extracts cities from unstructured address strings — recognizing Seattle-area locations like Bellevue, Redmond, Kirkland, Sammamish, and Issaquah from partial matches.',
              },
              {
                title: 'PMPro Membership Integration',
                body: 'After user creation, the plugin assigns the correct Paid Memberships Pro level, storing membership metadata (ID, year, payment date, active status) as searchable user meta fields accessible from the WordPress admin.',
              },
              {
                title: 'Email Onboarding System',
                body: 'Every newly created member receives a branded HTML email with their temporary password, a direct link to the KAW login page, and clear instructions. Passwords expire after 90 days by default, and the system forces a password reset on first login for security.',
              },
              {
                title: 'Audit Trail & CSV Reports',
                body: 'After every import run, the plugin generates downloadable CSV reports: one for successfully imported/updated rows and one for skipped rows (with reasons like missing email or insertion errors). This gives the admin a complete audit trail of every migration.',
              },
            ],
          },
          {
            kind: 'cards',
            heading: 'Plugin 2: Backup & Restore System',
            blurb:
              'A safety net for production data. Automated daily backups of all user records and membership data, with one-click restore, configurable retention, and email notifications.',
            cards: [
              {
                title: 'Scheduled Backups',
                body: 'Runs daily or twice-daily at a configurable time, backing up all WordPress users, usermeta, and PMPro membership tables.',
              },
              {
                title: 'One-Click Restore',
                body: 'Any backup can be restored instantly from the admin dashboard. The system handles table truncation, data reinsertion, and integrity checks.',
              },
              {
                title: 'Retention Policy',
                body: 'Keeps the last 30 backups by default, automatically pruning older snapshots to save server storage while maintaining a safety window.',
              },
              {
                title: 'Email Notifications',
                body: 'Sends the admin an email after every backup with file size, record counts, and status — so they know the system is working without checking manually.',
              },
            ],
          },
          {
            kind: 'code',
            heading: 'Architecture & Data Flow',
            blurb:
              'The migration pipeline processes each CSV row through a validation, deduplication, and enrichment pipeline before touching the database.',
            language: 'text',
            source: `CSV Upload
  │
  ├─ Parse headers → flexible column name matching
  │
  ├─ For each row:
  │   ├─ Extract & validate email (skip if missing)
  │   ├─ Map 9 fields: Name, Phone, Email, MembershipId,
  │   │   MembershipYear, LastPaidDate, IsActive, City, RecordDate
  │   │
  │   ├─ City extraction from unstructured address strings
  │   │   └─ Keyword match: Bellevue, Redmond, Seattle, Kirkland...
  │   │
  │   ├─ Check: user exists by email?
  │   │   ├─ YES → Update only blank fields (preserve manual edits)
  │   │   └─ NO  → Create user with temp password
  │   │           ├─ Set password expiration (+90 days)
  │   │           ├─ Force reset on first login
  │   │           └─ Send branded onboarding email
  │   │
  │   ├─ Assign PMPro membership level
  │   ├─ Store all metadata as searchable user meta
  │   └─ Log to success[] or skipped[] array
  │
  ├─ Generate downloadable CSV: successful imports
  └─ Generate downloadable CSV: skipped rows + reasons`,
          },
          {
            kind: 'chips',
            heading: 'Tech Stack',
            items: [
              'PHP — Plugin development',
              'MySQL — Database & queries',
              'WordPress — Platform & APIs',
              'PMPro — Membership levels',
              'CSV Parsing — Data import',
              'wp_mail — Email system',
              'WP-Cron — Scheduled backups',
              'Data Validation — Dedup & cleanup',
            ],
          },
          {
            kind: 'stats',
            heading: 'By the Numbers',
            stats: [
              { value: '2,800+', label: 'Member records migrated' },
              { value: '9', label: 'Fields mapped per record' },
              { value: '0', label: 'Records lost' },
              { value: '2', label: 'Custom plugins built' },
            ],
          },
          {
            kind: 'code',
            heading: 'Code Highlights — Flexible CSV Column Matcher',
            blurb:
              'Different spreadsheets used different column names for the same data. Instead of requiring exact headers, I built a helper that normalizes column names and matches against known aliases:',
            language: 'php',
            source: `function kaw_get_csv_value($row, $possible_names) {
    foreach ($possible_names as $name) {
        // Try exact match
        if (isset($row[$name])) return trim($row[$name]);
        // Try case-insensitive match
        foreach ($row as $key => $value) {
            if (strtolower(trim($key)) === strtolower($name)) {
                return trim($value);
            }
        }
    }
    return '';
}`,
          },
          {
            kind: 'code',
            heading: 'Code Highlights — Smart Update Logic',
            blurb:
              "When a user already exists, only blank metadata fields get overwritten — preserving any manual edits the admin previously made:",
            language: 'php',
            source: `// Only update meta if current value is empty
$current = get_user_meta($user_id, $meta_key, true);
if (empty($current) && !empty($new_value)) {
    update_user_meta($user_id, $meta_key, $new_value);
}`,
          },
          {
            kind: 'code',
            heading: 'Code Highlights — Password Expiration System',
            blurb:
              'Temporary passwords auto-expire after 90 days. On first login, users are forced to reset — preventing indefinite use of shared credentials:',
            language: 'php',
            source: `// Set expiration timestamp (+90 days)
$expiration = time() + (90 * DAY_IN_SECONDS);
update_user_meta($user_id, 'kaw_temp_pw_expires', $expiration);

// Force password reset on first login
update_user_meta($user_id, 'default_password_nag', true);`,
          },
          {
            kind: 'cards',
            heading: 'What I Learned',
            cards: [
              {
                title: 'Data Cleaning is the Real Work',
                body: 'The actual code took weeks, but cleaning the data took longer. Spreadsheets had inconsistent names, duplicate emails, missing required fields, and addresses where city names should be. I learned to build validation upfront rather than fixing errors downstream.',
              },
              {
                title: 'Production Code Needs Safety Nets',
                body: `This wasn't a class project — real people depend on this data. That's why I built the backup system, audit trail CSVs, and the "only overwrite blank fields" logic. You can't undo mistakes when 2,800+ members are affected.`,
              },
              {
                title: 'Document Everything',
                body: "I wrote documentation so the KAW team could run imports without me. The system needed to be maintainable by people who didn't write it — which forced me to write cleaner code and build intuitive admin interfaces.",
              },
              {
                title: 'WordPress is a Real Platform',
                body: "Building custom plugins taught me how WordPress actually works under the hood — hooks, actions, filters, the admin API, WP-Cron, and the user meta system. It's a full application framework, not just a blogging tool.",
              },
            ],
          },
          {
            kind: 'steps',
            heading: 'Next Steps',
            steps: [
              {
                title: 'Member Self-Service Portal',
                body: 'Let members update their own profiles, view membership status, and manage contact information without admin intervention.',
              },
              {
                title: 'Automated Renewal Emails',
                body: 'Build a notification system that emails members when their membership is approaching expiration, with a direct renewal link.',
              },
              {
                title: 'Analytics Dashboard',
                body: 'Create an admin dashboard showing membership growth trends, active vs. lapsed members, and import history over time.',
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
        'Conversational chatbot handling common user inquiries for a cybersecurity education nonprofit.',
      tech: ['Python', 'scikit-learn', 'Machine Learning', 'Firebase', 'Web APIs'],
      built: [
        'Deployed chatbot handling 100+ monthly website interactions about course information',
        'Built machine learning model personalizing content across 8-module cybersecurity curriculum',
        'Led 5-person cross-functional team coordinating students and volunteers',
        'Established weekly check-ins keeping project aligned with organizational goals',
      ],
      impact: 'Handles 100+ monthly interactions, reducing manual response time',
      learned:
        'Leading volunteers differs from leading employees. People have competing priorities. I learned to set realistic timelines and flag blockers early.',
      links: [{ label: 'View Code', href: GITHUB }],
    },
    {
      id: 'bump',
      title: 'Bump',
      period: '',
      blurb:
        'Native iOS social app that uses real-time location proximity and calendar integration to help friends meet up spontaneously — built with SwiftUI, Supabase, and CoreLocation.',
      tech: ['SwiftUI', 'Supabase', 'CoreLocation', 'EventKit', 'Swift', 'iOS'],
      built: [
        'Built native iOS app with real-time location tracking that detects nearby friends within 100 meters using CoreLocation',
        'Integrated Supabase backend with Edge Functions for friend requests, user authentication, and real-time location uploads',
        'Implemented calendar integration via EventKit to surface mutual availability and smart scheduling',
        'Designed multi-tab experience with Home, Map, Agent, Profile, and Settings views with full privacy controls',
      ],
      impact:
        'Functional prototype with real-time friend proximity detection, friend requests via Supabase Edge Functions, and calendar-aware scheduling',
      learned:
        'Privacy matters more than features. Users worry about real-time location sharing. I built granular opt-in controls where users choose when to share availability, with clear privacy policies and the ability to disable location, calendar, or notifications anytime.',
      links: [
        { label: 'View Code', href: 'https://github.com/TejaswiErattu/bump' },
        { label: 'Read the full write-up', href: '/projects/bump' },
      ],
      detail: {
        eyebrow: 'Native iOS App',
        intro:
          'A native iOS social app that uses real-time location proximity and calendar integration to help friends meet up spontaneously — reducing the friction between wanting to hang out and actually doing it.',
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
            heading: 'The Problem',
            paragraphs: [
              "Making plans with friends shouldn't feel like a chore. You match online but never meet in person. Scheduling feels awkward. Even when you're nearby, you have no idea your friend is just around the corner.",
              'Existing social apps focus on messaging but don’t solve the last-mile problem — actually getting people in the same place at the same time.',
            ],
          },
          {
            kind: 'list',
            heading: 'The Social Friction',
            tone: 'negative',
            items: [
              'No way to know if friends are nearby',
              'Scheduling requires back-and-forth messaging',
              'Suggesting plans carries social risk',
              "Calendar availability isn't shared or visible",
            ],
          },
          {
            kind: 'cards',
            heading: 'How Bump Works',
            blurb:
              'Bump combines real-time location awareness with calendar intelligence to surface spontaneous meetup opportunities — then makes it effortless to act on them.',
            cards: [
              {
                title: 'Proximity Detection',
                body: 'Detects friends within 100 meters using CoreLocation. Uploads coordinates to Supabase and compares positions in real time.',
              },
              {
                title: 'Calendar Integration',
                body: 'Imports events from Apple Calendar (and Google via iOS). Shows free/busy status so friends know when you’re available.',
              },
              {
                title: 'Friend System',
                body: 'Send and accept friend requests by phone number. Manage your social circle with a clean, card-based interface.',
              },
              {
                title: 'Bump Notifications',
                body: 'Send quick "bump" pings to friends — casual, low-pressure invitations like "Down for coffee?" or "I’m nearby!"',
              },
              {
                title: 'Privacy Controls',
                body: 'Granular settings for location, calendar, and notifications. Online status toggle, distance limits, and auto-decline when busy.',
              },
              {
                title: 'Smart Scheduling',
                body: 'Auto-decline invitations when you’re busy. Share free/busy schedule with friends so meetups happen when everyone’s available.',
              },
            ],
          },
          {
            kind: 'cards',
            heading: 'App Experience',
            blurb:
              'Bump is organized into a multi-tab experience, each designed to reduce friction between wanting to meet up and actually doing it.',
            cards: [
              { title: 'Home', body: 'Location status & nearby friends' },
              { title: 'Map', body: 'Visual friend proximity' },
              { title: 'Agent', body: 'AI-powered suggestions' },
              { title: 'Profile', body: 'Bio, schedule & calendar' },
              { title: 'Settings', body: 'Privacy & permissions' },
            ],
          },
          {
            kind: 'columns',
            heading: 'Architecture',
            blurb:
              'Built as a native SwiftUI app with a serverless Supabase backend. Location data flows through CoreLocation to Supabase Postgres, with Edge Functions handling friend request logic.',
            columns: [
              {
                title: 'Frontend',
                items: [
                  'SwiftUI with @StateObject and @AppStorage for state management',
                  'CoreLocation for real-time GPS tracking',
                  'EventKit for Apple & Google Calendar integration',
                  'Sign in with Apple & Google authentication stubs',
                  'Local notifications for bump alerts',
                ],
              },
              {
                title: 'Backend',
                items: [
                  'Supabase Postgres for user data and locations',
                  'Edge Functions for friend request send/accept/reject',
                  'Real-time location upserts with user_locations table',
                  'Proximity queries fetching friends within 100m radius',
                  'Supabase Swift SDK for native iOS integration',
                ],
              },
            ],
          },
          {
            kind: 'chips',
            heading: 'Tech Stack',
            items: [
              'Swift',
              'SwiftUI',
              'CoreLocation',
              'EventKit',
              'UserNotifications',
              'Supabase',
              'Postgres',
              'Edge Functions',
              'Sign in with Apple',
              'Xcode',
              'iOS 17+',
              'MVVM',
            ],
          },
          {
            kind: 'cards',
            heading: 'Privacy-First Design',
            blurb:
              'The biggest lesson from building Bump: privacy matters more than features. Every data-sharing feature has a corresponding opt-out control.',
            cards: [
              { title: 'Location', body: 'Toggle on/off with distance limits' },
              { title: 'Calendar', body: 'Share free/busy only, never details' },
              { title: 'Notifications', body: 'Full control with iOS Settings link' },
              { title: 'Online Status', body: 'Show/hide visibility to friends' },
            ],
          },
        ],
      },
    },
  ],

  experience: [
    {
      id: 'ahf',
      role: 'Software Engineering Lead',
      company: 'Accountability & Hopeful Fridays',
      period: 'May 2026 – Present',
      location: 'Remote',
      bullets: [
        'Led technical infrastructure planning across 6 systems (GoHighLevel, GitHub, SharePoint, Microsoft Planner, Trello, WordPress), designing a 6-phase roadmap covering CI/CD, website migration, and member portal',
        'Built 3 task management proof-of-concepts (Microsoft Planner, Trello, GitHub Projects) and delivered structured comparison to guide leadership decision for a 10+ person organization',
        'Designed CI/CD pipeline architecture (feature → development → staging → production) with branch protection and required reviewers, establishing deployment standards for a team of 5+ developers',
        'Audited and documented 5+ GoHighLevel automation workflows and created safe test protocols to prevent disruption to live member communications',
        'Consolidated 40+ cross-team tasks into a centralized tracking system, reducing coordination overhead across technical and non-technical contributors',
      ],
    },
    {
      id: 'kaw',
      role: 'Developer Intern',
      company: 'Kerala Association of Washington',
      period: 'May 2025 – Dec 2025',
      location: 'Sammamish, WA',
      bullets: [
        'Migrated 2,800+ member records to WordPress via a custom PHP/MySQL ETL pipeline, cutting manual data entry time by 75%',
        'Built custom WordPress plugins (PHP, MySQL, JavaScript/AJAX) for real-time member management and automated daily backups via WP-Cron',
        'Automated report generation with exportable data fields (PHP, SQL), cutting monthly turnaround from hours to minutes',
      ],
    },
    {
      id: 'icode',
      role: 'Instructor',
      company: 'iCode',
      period: 'Jan 2025 – Sept 2025',
      location: 'Sammamish, WA',
      bullets: [
        'Taught coding to 60+ elementary and middle school students using Minecraft Education, Roblox Lua, and Python',
        'Led 4 robotics and Minecraft camps mentoring teams of 8–12 students through hands-on STEM challenges',
      ],
    },
    {
      id: 'apollo',
      role: 'AI Trainer and Tester',
      company: 'Apollo AI',
      period: 'May 2024 – May 2025',
      location: 'Sammamish, WA',
      bullets: [
        "Trained and evaluated 5 classification/regression models (TensorFlow, scikit-learn) for Saturn AI's grading engine, improving accuracy by 40% for 50+ K-12 students",
        'Optimized model performance through hyperparameter tuning, cutting average response time from 8s to 3s',
      ],
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
    },
    {
      id: 'cyber-minds',
      role: 'Machine Learning Manager',
      company: 'Cyber Minds Non-Profit',
      period: 'Jan 2024 – June 2024',
      location: 'Sammamish, WA',
      bullets: [
        'Built and deployed a Python (scikit-learn) chatbot integrated via Firebase, handling 100+ monthly user interactions and cutting average response time by 60%',
        'Led a 5-person team using Agile sprints (GitHub Projects) to integrate a TensorFlow-based ML model into production 2 weeks ahead of schedule',
        'Trained a scikit-learn classification model on student interaction data to personalize an 8-module cybersecurity curriculum, boosting engagement scores by 35%',
      ],
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
    bullets: [
      'Conducted threat modeling across 10+ product surfaces using STRIDE methodology, cataloguing distinct threats and mapping trust boundaries across the mobile, backend, and Firebase architecture',
      'Identified a confirmed privilege-escalation vulnerability in session/identity handling and drove remediation with the engineering team prior to deployment',
      'Built security documentation and risk-mitigation control mappings covering 7+ categories of sensitive data (location, PII, auth, admin access), aligned to STRIDE and CIA triad frameworks',
      'Evaluated and piloted 2 static analysis tools (Semgrep, npm audit) to replace CodeQL in the CI/CD pipeline after a private-repo migration broke existing scanning',
      'Ran manual penetration testing with Burp Suite against API and WebSocket endpoints to assess authorization and data-exposure risk',
    ],
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
    },
    {
      id: 'coding-instructor',
      title: 'Coding Instructor',
      detail: 'Taught programming to elementary and middle school students for three years.',
      period: '3 years – 2025',
    },
  ],

  contact: {
    email: EMAIL,
    phone: PHONE,
    linkedin: LINKEDIN,
    github: GITHUB,
    resumes: RESUMES,
    location: LOCATION,
    blurb:
      "I'm looking for 2027 software engineering and security internships where I solve complex problems and ship impactful products.",
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

/**
 * Navigation sections shared by the top bar, the classic-mode page, and
 * (later) the building interactions. One list, one set of anchor ids.
 */
export const sections = [
  { id: 'about', label: 'About' },
  { id: 'projects', label: 'Projects' },
  { id: 'experience', label: 'Experience' },
  { id: 'education', label: 'Education' },
  { id: 'security', label: 'Security' },
  { id: 'achievements', label: 'Achievements' },
  { id: 'contact', label: 'Contact' },
] as const

export type SectionId = (typeof sections)[number]['id']
