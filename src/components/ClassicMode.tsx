import { content } from '../content/content'

/**
 * The accessible, no-JavaScript-game version of the portfolio.
 *
 * Phase 1 deliberately keeps this unstyled and structural: it exists to prove
 * that every field in content.ts is reachable without playing the game. Phase 5
 * gives it real styling. The section ids match `sections` in content.ts so the
 * top bar anchors land in the right place.
 */
export default function ClassicMode() {
  const { person, about, projects, experience, education, security, achievements, contact } =
    content

  return (
    <main className="classic">
      <h1>{person.name}</h1>
      <p>{person.title}</p>
      <p>{person.tagline}</p>

      <section id="about">
        <h2>About</h2>
        <h3>{about.headline}</h3>
        <p>{about.subheadline}</p>
        {about.paragraphs.map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}

        <h3>Highlights</h3>
        <ul>
          {about.highlights.map((highlight) => (
            <li key={highlight}>{highlight}</li>
          ))}
        </ul>

        <h3>Quick facts</h3>
        <dl>
          {about.quickFacts.map((fact) => (
            <div key={fact.label}>
              <dt>{fact.label}</dt>
              <dd>{fact.value}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section id="projects">
        <h2>Projects</h2>
        {projects.map((project) => (
          <article key={project.id}>
            <h3>
              {project.title}
              {project.period ? ` — ${project.period}` : ''}
            </h3>
            <p>{project.blurb}</p>
            <p>
              <strong>Tech:</strong> {project.tech.join(', ')}
            </p>
            <h4>What I built</h4>
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
            <ul>
              {project.links.map((link) => (
                <li key={link.href + link.label}>
                  <a href={link.href} target="_blank" rel="noopener noreferrer">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </article>
        ))}
      </section>

      <section id="experience">
        <h2>Experience</h2>
        {experience.map((job) => (
          <article key={job.id}>
            <h3>
              {job.role} — {job.company}
            </h3>
            <p>
              {job.period} · {job.location}
            </p>
            <ul>
              {job.bullets.map((bullet) => (
                <li key={bullet}>{bullet}</li>
              ))}
            </ul>
          </article>
        ))}
      </section>

      <section id="education">
        <h2>Education</h2>
        <h3>{education.school}</h3>
        <p>{education.degree}</p>
        <p>Focus area: {education.focusArea}</p>
        <p>Expected graduation: {education.expectedGraduation}</p>
        <p>GPA: {education.gpa}</p>

        <h3>Technical skills</h3>
        {education.skills.map((group) => (
          <p key={group.category}>
            <strong>{group.category}:</strong> {group.items.join(', ')}
          </p>
        ))}
      </section>

      <section id="security">
        <h2>Security</h2>
        <h3>
          {security.role} — {security.organization}
        </h3>
        <p>{security.period}</p>
        <ul>
          {security.bullets.map((bullet) => (
            <li key={bullet}>{bullet}</li>
          ))}
        </ul>
        <p>
          <strong>Security skills:</strong> {security.skills.join(', ')}
        </p>
        <p>
          <strong>Certifications:</strong> {security.certifications.join(', ')}
        </p>
      </section>

      <section id="achievements">
        <h2>Achievements &amp; leadership</h2>
        <ul>
          {achievements.map((achievement) => (
            <li key={achievement.id}>
              <strong>{achievement.title}</strong>
              {achievement.period ? ` (${achievement.period})` : ''} — {achievement.detail}
            </li>
          ))}
        </ul>
      </section>

      <section id="contact">
        <h2>Contact</h2>
        <p>{contact.blurb}</p>
        <ul>
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
          {contact.resumes.map((resume) => (
            <li key={resume.href}>
              {resume.label}:{' '}
              <a href={resume.href} target="_blank" rel="noopener noreferrer">
                Download PDF
              </a>
            </li>
          ))}
          <li>Location: {contact.location}</li>
        </ul>
        <p>
          <strong>Open to roles in:</strong> {contact.rolesSeeking.join(', ')}
        </p>
        <p>{contact.availability}</p>
        <p>
          <strong>Languages:</strong> {person.spokenLanguages.join(', ')}
        </p>
      </section>
    </main>
  )
}
