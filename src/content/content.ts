/**
 * SINGLE SOURCE OF TRUTH
 *
 * Every word rendered by the game world AND by classic mode comes from this
 * file. Nothing here is invented: it is transcribed from the master/software/
 * security resumes and the current live portfolio site.
 *
 * If content is wrong, fix it HERE and both experiences update together.
 */

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
const WEBSITE = 'https://tejaswierattuwebsite.vercel.app/'
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
        { label: 'In-Depth Page', href: 'https://tejaswierattuwebsite.vercel.app/projects/findar' },
      ],
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
        {
          label: 'In-Depth Page',
          href: 'https://tejaswierattuwebsite.vercel.app/projects/unearthed',
        },
      ],
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
        {
          label: 'In-Depth Page',
          href: 'https://tejaswierattuwebsite.vercel.app/projects/terralend',
        },
      ],
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
        { label: 'In-Depth Page', href: 'https://tejaswierattuwebsite.vercel.app/projects/kaw' },
      ],
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
        'Designed multi-tab experience with Home, Map, Friends, Profile, and Settings views with full privacy controls',
      ],
      impact:
        'Functional prototype with real-time friend proximity detection, friend requests via Supabase Edge Functions, and calendar-aware scheduling',
      learned:
        'Privacy matters more than features. Users worry about real-time location sharing. I built granular opt-in controls where users choose when to share availability, with clear privacy policies and the ability to disable location, calendar, or notifications anytime.',
      links: [
        { label: 'View Code', href: 'https://github.com/TejaswiErattu/bump' },
        { label: 'In-Depth Page', href: 'https://tejaswierattuwebsite.vercel.app/projects/bump' },
      ],
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
