import type { JSX } from 'react'

import { content, type SectionId } from '../content/content'
import { Link } from '../router'
import { SuggestionForm } from './SuggestionForm'

/**
 * The classic-mode content, one component per section.
 *
 * These are shared by two views with different heading structures:
 *
 *   - the full page at `/`, where the <h1> is the person's name and each
 *     section is an <h2>
 *   - a section route such as `/projects`, where the section title *is* the
 *     <h1> and there is no name heading above it
 *
 * Rather than duplicate the markup, every section takes a `level` for its own
 * title and derives its child headings from it. That guarantees the hierarchy
 * never skips a level in either view, which is both a WCAG requirement and the
 * structure screen-reader users navigate by.
 */

type Level = 1 | 2 | 3 | 4 | 5

interface SectionProps {
  /** Heading level for this section's own title. */
  level: Level
  /** Title text. Section routes pass a fuller phrase than the nav label. */
  title: string
}

function Heading({
  level,
  children,
  ...rest
}: { level: Level; children: React.ReactNode } & JSX.IntrinsicElements['h2']) {
  const Tag = `h${Math.min(level, 6)}` as 'h2'
  return <Tag {...rest}>{children}</Tag>
}

/** Child heading levels, clamped so `level + 2` can never exceed h6. */
function childLevels(level: Level): [Level, Level] {
  return [Math.min(level + 1, 5) as Level, Math.min(level + 2, 6) as Level]
}

export function AboutSection({ level, title }: SectionProps) {
  const { about, person, education } = content
  const [sub] = childLevels(level)

  return (
    <section id="about" className="classic-section">
      <Heading level={level}>{title}</Heading>

      <div className="classic-bio">
        {/* The portrait is displayed at 9rem (144px), so a 440px-wide source
            still covers a 3x screen. WebP first, JPEG for anything that cannot
            take it. width/height match the real intrinsic size so the browser
            reserves the box and the text below does not jump (CLS). */}
        <picture>
          <source srcSet="/headshot.webp" type="image/webp" />
          <img
            className="classic-headshot"
            src="/headshot.jpg"
            width={440}
            height={451}
            loading="lazy"
            decoding="async"
            alt={`${person.name}, smiling, in a portrait photograph.`}
          />
        </picture>
        <div>
          <Heading level={sub}>{about.headline}</Heading>
          <p>{about.subheadline}</p>
          {about.paragraphs.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>
      </div>

      <Heading level={sub}>Highlights</Heading>
      <ul>
        {about.highlights.map((highlight) => (
          <li key={highlight}>{highlight}</li>
        ))}
      </ul>

      <Heading level={sub}>Quick facts</Heading>
      <dl className="classic-facts">
        {about.quickFacts.map((fact) => (
          <div key={fact.label}>
            <dt>{fact.label}</dt>
            <dd>{fact.value}</dd>
          </div>
        ))}
      </dl>

      <Heading level={sub}>Education</Heading>
      <p>{education.degree}</p>
      <dl className="classic-facts">
        <div>
          <dt>School</dt>
          <dd>{education.school}</dd>
        </div>
        <div>
          <dt>Focus area</dt>
          <dd>{education.focusArea}</dd>
        </div>
        <div>
          <dt>Expected graduation</dt>
          <dd>{education.expectedGraduation}</dd>
        </div>
        <div>
          <dt>GPA</dt>
          <dd>{education.gpa}</dd>
        </div>
      </dl>

      <p className="classic-crosslink">
        The full technical skills breakdown lives in{' '}
        <Link to="/education">education &amp; skills</Link>, and it's applied in{' '}
        <Link to="/projects">projects</Link>.
      </p>
    </section>
  )
}

export function ProjectsSection({ level, title }: SectionProps) {
  const { projects } = content
  const [sub, subSub] = childLevels(level)

  return (
    <section id="projects" className="classic-section">
      <Heading level={level}>{title}</Heading>
      {projects.map((project) => (
        <article key={project.id} className="classic-card">
          <Heading level={sub}>
            {project.title}
            {project.period ? ` — ${project.period}` : ''}
          </Heading>
          <p>{project.blurb}</p>
          <p>
            <strong>Tech:</strong> {project.tech.join(', ')}
          </p>
          <Heading level={subSub}>What I built</Heading>
          <ul>
            {project.built.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          <p>
            <strong>Impact:</strong> {project.impact}
          </p>
          <p>
            <strong>What I learned:</strong> {project.learned}
          </p>
          {project.contentTodo && <p className="classic-todo">{project.contentTodo}</p>}
          <ul className="classic-links">
            {project.links.map((link) => (
              <li key={link.href + link.label}>
                {/* An internal path (the write-up pages this site owns) navigates
                    client-side, same tab, like every other link on the site. An
                    external one (GitHub, a live demo) opens in its own tab so the
                    reader doesn't lose their place in the project list. */}
                {link.href.startsWith('/') ? (
                  <Link to={link.href}>{link.label}</Link>
                ) : (
                  <a href={link.href} target="_blank" rel="noopener noreferrer">
                    {link.label}
                  </a>
                )}
              </li>
            ))}
          </ul>
        </article>
      ))}
      <p className="classic-crosslink">
        The security work behind several of these is written up under{' '}
        <Link to="/security">security engineering</Link>, and the roles they came out of are in{' '}
        <Link to="/experience">experience</Link>.
      </p>
    </section>
  )
}

function ExperienceCard({ job, sub }: { job: (typeof content.experience)[number]; sub: Level }) {
  return (
    <article className="classic-card">
      <Heading level={sub}>
        {job.role} — {job.company}
      </Heading>
      <p className="classic-meta">
        {job.period} · {job.location}
      </p>
      <ul>
        {job.bullets.map((bullet) => (
          <li key={bullet}>{bullet}</li>
        ))}
      </ul>
    </article>
  )
}

export function ExperienceSection({ level, title }: SectionProps) {
  const { experience } = content
  const [sub, subSub] = childLevels(level)
  const current = experience.filter((job) => job.current)
  const past = experience.filter((job) => !job.current)

  return (
    <section id="experience" className="classic-section">
      <Heading level={level}>{title}</Heading>

      <Heading level={sub}>Current roles</Heading>
      {current.map((job) => (
        <ExperienceCard key={job.id} job={job} sub={subSub} />
      ))}

      <Heading level={sub}>Past positions</Heading>
      {past.map((job) => (
        <ExperienceCard key={job.id} job={job} sub={subSub} />
      ))}

      <p className="classic-crosslink">
        See the shipped results in <Link to="/projects">projects</Link>, or the recognition in{' '}
        <Link to="/achievements">achievements &amp; leadership</Link>.
      </p>
    </section>
  )
}

export function EducationSection({ level, title }: SectionProps) {
  const { education } = content
  const [sub] = childLevels(level)

  return (
    <section id="education" className="classic-section">
      <Heading level={level}>{title}</Heading>
      <Heading level={sub}>{education.school}</Heading>
      <p>{education.degree}</p>
      <dl className="classic-facts">
        <div>
          <dt>Focus area</dt>
          <dd>{education.focusArea}</dd>
        </div>
        <div>
          <dt>Expected graduation</dt>
          <dd>{education.expectedGraduation}</dd>
        </div>
        <div>
          <dt>GPA</dt>
          <dd>{education.gpa}</dd>
        </div>
      </dl>

      <Heading level={sub}>Technical skills</Heading>
      <dl className="classic-facts">
        {education.skills.map((group) => (
          <div key={group.category}>
            <dt>{group.category}</dt>
            <dd>{group.items.join(', ')}</dd>
          </div>
        ))}
      </dl>
      <p className="classic-crosslink">
        These show up in practice across <Link to="/projects">projects</Link> and{' '}
        <Link to="/experience">experience</Link>.
      </p>
    </section>
  )
}

export function SecuritySection({ level, title }: SectionProps) {
  const { security } = content
  const [sub] = childLevels(level)

  return (
    <section id="security" className="classic-section">
      <Heading level={level}>{title}</Heading>
      <Heading level={sub}>
        {security.role} — {security.organization}
      </Heading>
      <p className="classic-meta">{security.period}</p>
      <ul>
        {security.bullets.map((bullet) => (
          <li key={bullet}>{bullet}</li>
        ))}
      </ul>
      <dl className="classic-facts">
        <div>
          <dt>Security skills</dt>
          <dd>{security.skills.join(', ')}</dd>
        </div>
        <div>
          <dt>Certifications</dt>
          <dd>{security.certifications.join(', ')}</dd>
        </div>
      </dl>
      <p className="classic-crosslink">
        Certifications are listed with the rest of my{' '}
        <Link to="/achievements">achievements &amp; leadership</Link>, and the role sits in{' '}
        <Link to="/experience">experience</Link>.
      </p>
    </section>
  )
}

export function AchievementsSection({ level, title }: SectionProps) {
  const { achievements } = content

  return (
    <section id="achievements" className="classic-section">
      <Heading level={level}>{title}</Heading>
      <ul className="classic-achievements">
        {achievements.map((achievement) => (
          <li key={achievement.id}>
            <strong>{achievement.title}</strong>
            {achievement.period ? ` (${achievement.period})` : ''} — {achievement.detail}
          </li>
        ))}
      </ul>
      <p className="classic-crosslink">
        The security certifications are put to work in{' '}
        <Link to="/security">security engineering</Link>.
      </p>
    </section>
  )
}

/**
 * The Growth Farm's plots plus its visitor suggestion box.
 *
 * The suggestion box itself is `SuggestionForm`, shared with the in-village
 * overlay opened from the farm's "Suggest Something" plot — one component,
 * one `content.growth.suggestion` config, so the two views can never
 * disagree about the mailto address, subject, or character limit.
 */
export function GrowthSection({ level, title }: SectionProps) {
  const { growth } = content
  const [sub] = childLevels(level)

  return (
    <section id="growth" className="classic-section">
      <Heading level={level}>{title}</Heading>
      <p>{growth.intro}</p>

      {growth.plans.map((plan) => (
        <article key={plan.id} className="classic-card">
          <Heading level={sub}>{plan.title}</Heading>
          {plan.paragraphs.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </article>
      ))}

      <Heading level={sub}>Suggest something</Heading>
      <SuggestionForm />

      <p className="classic-crosslink">
        Curious what's already shipped? See <Link to="/projects">projects</Link>.
      </p>
    </section>
  )
}

export function ContactSection({ level, title }: SectionProps) {
  const { contact, person } = content

  return (
    <section id="contact" className="classic-section">
      <Heading level={level}>{title}</Heading>
      <p>{contact.blurb}</p>
      <ul className="classic-links">
        <li>
          Email: <a href={`mailto:${contact.email}`}>{contact.email}</a>
        </li>
        <li>
          Phone: <a href={`tel:${contact.phone.replace(/[^\d+]/g, '')}`}>{contact.phone}</a>
        </li>
        <li>
          LinkedIn:{' '}
          <a href={contact.linkedin} target="_blank" rel="noopener noreferrer">
            {contact.linkedin}
          </a>
        </li>
        <li>
          GitHub:{' '}
          <a href={contact.github} target="_blank" rel="noopener noreferrer">
            {contact.github}
          </a>
        </li>
      </ul>
      <dl className="classic-facts">
        <div>
          <dt>Location</dt>
          <dd>{contact.location}</dd>
        </div>
        <div>
          <dt>Open to roles in</dt>
          <dd>{contact.rolesSeeking.join(', ')}</dd>
        </div>
        <div>
          <dt>Availability</dt>
          <dd>{contact.availability}</dd>
        </div>
        <div>
          <dt>Languages</dt>
          <dd>{person.spokenLanguages.join(', ')}</dd>
        </div>
      </dl>
      <p className="classic-crosslink">
        Start from the top with <Link to="/about">about</Link>, or{' '}
        <Link to="/play">walk the village instead</Link>.
      </p>
    </section>
  )
}

export const sectionComponents: Record<
  SectionId,
  (props: SectionProps) => React.ReactElement
> = {
  about: AboutSection,
  projects: ProjectsSection,
  experience: ExperienceSection,
  education: EducationSection,
  security: SecuritySection,
  achievements: AchievementsSection,
  growth: GrowthSection,
  contact: ContactSection,
}
