export const portfolioData = {
  personal: {
    name: "Tejaswi Erattu Taj",
    location: "Seattle, Washington",
    email: "tjerattu@gmail.com",
    phone: "(425) 800-4330",
    linkedin: "https://www.linkedin.com/in/tejaswi-erattu-3b9b04246/",
    github: "https://github.com/TejaswiErattu",
    university: "University of Washington",
    major: "Informatics",
    years: "2025–2029"
  },
  
  hero: {
    headline: "Software engineering student building systems people depend on.",
    subheadline: "First-year Informatics student at University of Washington. I migrate databases, train machine learning models, and ship production code."
  },

  quickProof: [
    "Migrated 2,800+ member records to production",
    "Trained 5+ ML models supporting 50+ students",
    "Built custom WordPress plugins serving live users",
    "Taught coding to 60+ elementary students",
    "Led 5-person cross-functional engineering team"
  ],

  projects: [
    {
      id: 1,
      title: "Kerala Association Membership Platform",
      description: "Production WordPress system managing 2,800+ member records with automated imports and daily backups.",
      tech: ["PHP", "MySQL", "JavaScript", "WordPress"],
      impact: "System runs in production serving live member base",
      github: "https://github.com/TejaswiErattu",
      demo: "#",
      problem: "Kerala Association of Washington needed to migrate 2,800+ member records from inconsistent spreadsheets into WordPress with zero data loss.",
      solution: [
        "Migrated 2,800+ member records from inconsistent spreadsheets into WordPress with zero data loss",
        "Built custom PHP plugins for CSV imports, user profiles, password resets, and automated backups",
        "Designed schema mapping 9 key fields into searchable profiles and exportable admin reports",
        "Implemented data validation preventing duplicate entries and handling missing fields"
      ],
      learned: "Data cleaning always takes longer than expected. Spreadsheets had duplicates, missing fields, and inconsistent formats. I built validation upfront and wrote documentation so others could maintain the system months later.",
      nextSteps: [
        "Add member portal where users update their own profiles",
        "Build automated email notifications for membership renewals",
        "Create analytics dashboard showing membership trends over time"
      ]
    },
    {
      id: 2,
      title: "Cyber Minds AI Chatbot",
      description: "Conversational chatbot handling common user inquiries for a cybersecurity education nonprofit.",
      tech: ["Python", "Machine Learning", "Web APIs"],
      impact: "Handles 100+ monthly interactions, reducing manual response time",
      github: "https://github.com/TejaswiErattu",
      demo: "#",
      problem: "Nonprofit needed to handle common website questions without staff manually responding to every inquiry.",
      solution: [
        "Deployed chatbot handling 100+ monthly website interactions about course information",
        "Built machine learning model personalizing content across 8-module cybersecurity curriculum",
        "Led 5-person cross-functional team coordinating students and volunteers",
        "Established weekly check-ins keeping project aligned with organizational goals"
      ],
      learned: "Leading volunteers differs from leading employees. People have competing priorities. I learned to set realistic timelines and flag blockers early.",
      nextSteps: [
        "Add multi-language support for non-English speakers",
        "Build analytics tracking which questions users ask most",
        "Create admin dashboard for updating responses without code changes"
      ]
    },
    {
      id: 3,
      title: "Bump (In Development)",
      description: "Friend-finding mobile app using calendar integration and location awareness to reduce social friction.",
      tech: ["React Native", "Calendar APIs", "AI/ML", "Location Services"],
      impact: "Beta testing with small user group",
      github: "https://github.com/TejaswiErattu",
      demo: "#",
      problem: "Meeting new people is hard. You match online but never meet in person. Scheduling feels awkward. Suggesting activities carries social risk.",
      solution: [
        "Calendar integration matching users by mutual availability",
        "Location awareness surfacing nearby users when both are free",
        "AI suggestion engine proposing meetup ideas based on shared interests",
        "Auto-generated invitation drafts reducing pressure on initiating contact"
      ],
      learned: "Privacy matters more than features. Users worry about real-time location sharing. I'm building granular opt-in controls where users choose when to share availability.",
      nextSteps: [
        "Launch beta with 20 testers",
        "Gather feedback on AI-generated invitation tone",
        "Build group meetup functionality"
      ]
    }
  ],

  experience: [
    {
      company: "Kerala Association of Washington",
      role: "Developer Intern",
      period: "May 2025 – Present",
      location: "Sammamish, WA",
      bullets: [
        "Migrated 2,800+ member records into production WordPress system with zero data loss",
        "Built custom PHP plugins for CSV imports, user profiles, password resets, and automated daily backups",
        "Designed database schema mapping 9 user fields into searchable profiles and exportable admin reports"
      ]
    },
    {
      company: "iCode",
      role: "Instructor", 
      period: "Jan 2025 – Sept 2025",
      location: "Sammamish, WA",
      bullets: [
        "Taught coding to 60+ elementary and middle school students using Minecraft Education, Roblox Lua, and Python",
        "Led 4 robotics and Minecraft camps mentoring teams of 8–12 students through hands-on STEM challenges"
      ]
    },
    {
      company: "Apollo AI",
      role: "AI Trainer and Tester",
      period: "May 2024 – May 2025", 
      location: "Sammamish, WA",
      bullets: [
        "Trained and evaluated 5 machine learning models for Saturn, an educational app supporting 50+ K-12 students",
        "Ran dozens of hyperparameter tuning experiments improving model accuracy for homework grading and lesson planning"
      ]
    },
    {
      company: "Cyber Minds Nonprofit",
      role: "Machine Learning Manager",
      period: "Jan 2024 – June 2024",
      location: "Sammamish, WA", 
      bullets: [
        "Deployed website chatbot handling 100+ monthly user interactions for cybersecurity education platform",
        "Led 5-person cross-functional team through weekly check-ins and sprint planning",
        "Built ML model personalizing content delivery across 8-module cybersecurity course"
      ]
    }
  ],

  skills: {
    languages: ["Python", "Java", "JavaScript", "PHP", "HTML", "CSS", "SQL"],
    frameworks: ["React", "WordPress", "Power BI", "Git", "MySQL", "Photoshop", "Illustrator"],
    areas: ["Data migration and ETL pipelines", "Machine learning model training", "Web development (frontend + backend)", "Database design and optimization", "API integration", "Technical documentation"],
    soft: ["Teaching and mentorship", "Team leadership", "Technical communication", "Project management", "Cross-functional collaboration"],
    spoken: ["English (fluent)", "Malayalam (native)", "Spanish (conversational)"]
  }
};