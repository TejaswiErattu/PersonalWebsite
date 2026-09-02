import { content } from '../content/content'
import { SITE_ORIGIN, absoluteUrl } from './site'

/**
 * schema.org Person markup.
 *
 * Deliberately Person, not LocalBusiness or Organization. This is one human
 * looking for work; LocalBusiness would be describing a storefront that does
 * not exist, and Google treats mismatched entity types as a quality signal
 * against the site rather than a harmless mistake.
 *
 * `knowsAbout` is built from the same skill arrays the Education and Security
 * sections render, so the structured data cannot claim a skill the visible
 * page does not list — which is exactly the kind of inconsistency structured
 * data guidelines are written to catch.
 */
export function buildPersonSchema(): Record<string, unknown> {
  const { person, about, education, security, contact } = content

  const knowsAbout = [
    ...education.skills.flatMap((group) => group.items),
    ...security.skills,
  ]
    // Some entries carry a parenthetical toolset, e.g. "Computer Vision
    // (YOLOv8, CoreML, Vision)". Structured data wants the concept, not the
    // footnote, so the parenthetical is trimmed here.
    .map((item) => item.replace(/\s*\(.*\)\s*$/, '').trim())
    .filter((item, index, all) => item.length > 0 && all.indexOf(item) === index)

  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    '@id': `${SITE_ORIGIN}/#person`,
    name: person.name,
    jobTitle: person.title,
    description: about.subheadline,
    url: `${SITE_ORIGIN}/`,
    image: absoluteUrl('/headshot.jpg'),
    email: `mailto:${person.email}`,
    telephone: person.phone,
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Seattle',
      addressRegion: 'WA',
      addressCountry: 'US',
    },
    alumniOf: {
      '@type': 'CollegeOrUniversity',
      name: education.school,
      sameAs: 'https://www.washington.edu/',
    },
    worksFor: {
      '@type': 'Organization',
      name: security.organization,
    },
    knowsLanguage: person.spokenLanguages.map((language) => ({
      '@type': 'Language',
      name: language.replace(/\s*\(.*\)\s*$/, '').trim(),
    })),
    knowsAbout,
    seeks: contact.rolesSeeking.map((role) => ({
      '@type': 'Demand',
      name: `${role} internship`,
    })),
    sameAs: [person.github, person.linkedin],
  }
}

/**
 * Serialised for embedding in a <script type="application/ld+json">.
 *
 * `<` is escaped to `\u003c` because a literal `</script>` appearing anywhere
 * inside JSON string data would terminate the script block early and inject
 * raw markup into the page. JSON.stringify does not do this for you, and it is
 * the standard XSS hole in hand-rolled JSON-LD embedding.
 */
export function serialiseSchema(schema: Record<string, unknown>): string {
  return JSON.stringify(schema).replace(/</g, '\\u003c')
}
