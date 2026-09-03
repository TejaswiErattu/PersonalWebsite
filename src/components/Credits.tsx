import { creditGroups, originalWork } from '../content/credits'
import useFocusTrap from '../hooks/useFocusTrap'

/**
 * Shared credits body, used by both the `/credits` page and the in-game
 * overlay. `level` is the heading level for the group titles, so the page can
 * put them under its <h1> and the overlay can put them under its dialog title
 * without either view skipping a heading level.
 */
function CreditsBody({ level }: { level: 2 | 3 }) {
  const GroupHeading = `h${level}` as 'h2'
  const EntryHeading = `h${level + 1}` as 'h3'

  return (
    <div className="credits-body">
      <p>
        This site leans on other people's work. Everything below is listed with its author, a
        link to the source, and the licence it is used under.
      </p>

      {creditGroups.map((group) => (
        <section key={group.title} className="credits-group">
          <GroupHeading>{group.title}</GroupHeading>
          {group.entries.map((entry) => (
            <article key={entry.name} className="credits-entry">
              <EntryHeading>{entry.name}</EntryHeading>
              <p className="credits-meta">
                by {entry.author} ·{' '}
                <a href={entry.licenseUrl} target="_blank" rel="noopener noreferrer">
                  {entry.license}
                </a>
              </p>
              <p>{entry.usage}</p>
              <p className="credits-source">
                <a href={entry.source} target="_blank" rel="noopener noreferrer">
                  {entry.source}
                </a>
              </p>
            </article>
          ))}
        </section>
      ))}

      <section className="credits-group">
        <GroupHeading>Original to this project</GroupHeading>
        {originalWork.map((item) => (
          <article key={item.title} className="credits-entry">
            <EntryHeading>{item.title}</EntryHeading>
            <p>{item.detail}</p>
          </article>
        ))}
      </section>

      <section className="credits-group">
        <GroupHeading>Licensing</GroupHeading>
        <p>
          The code for this site is released under the MIT licence. That licence covers the code
          only — third-party libraries and the typeface keep their own terms, listed above, and
          nothing here grants any additional rights over them.
        </p>
      </section>
    </div>
  )
}

/** The `/credits` route: a full page, so it can be linked, indexed and shared. */
export default function CreditsPage() {
  return (
    <main className="classic classic-single credits">
      {/* No page-local nav — TopBar (Home/logo + village toggle) already
          covers both links this used to duplicate. */}
      <h1>Credits &amp; licensing</h1>
      <CreditsBody level={2} />
    </main>
  )
}

/**
 * The same content as a modal, opened from the top bar.
 *
 * A modal rather than a navigation, because reaching credits from inside the
 * game should not tear down the world and lose where you were standing.
 */
export function CreditsOverlay({ onClose }: { onClose: () => void }) {
  const containerRef = useFocusTrap<HTMLDivElement>()

  return (
    <div
      className="credits-backdrop"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <div
        ref={containerRef}
        className="credits-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="credits-title"
        tabIndex={-1}
        onKeyDown={(event) => {
          if (event.key === 'Escape') onClose()
        }}
      >
        <div className="credits-modal-head">
          <h2 id="credits-title">Credits &amp; licensing</h2>
          <button type="button" className="credits-close" onClick={onClose}>
            Close
          </button>
        </div>
        <CreditsBody level={3} />
      </div>
    </div>
  )
}
