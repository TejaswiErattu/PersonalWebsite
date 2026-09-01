import { content, sections } from '../content/content'

export type ViewMode = 'game' | 'classic'

interface TopBarProps {
  mode: ViewMode
  onToggleMode: () => void
  onGoHome: () => void
}

/**
 * Always-visible navigation.
 *
 * Phase 1: the section links are stubs. In classic mode they are real in-page
 * anchors; in game mode they do nothing yet (Phase 2 wires them to the
 * matching building). They are real <a>/<button> elements either way, so they
 * are keyboard focusable and screen-reader navigable from day one.
 */
export default function TopBar({ mode, onToggleMode, onGoHome }: TopBarProps) {
  return (
    <header className="topbar">
      <nav className="topbar-inner" aria-label="Portfolio sections">
        <button type="button" className="topbar-brand" onClick={onGoHome}>
          {content.person.name}
        </button>

        <ul className="topbar-links">
          {sections.map((section) => (
            <li key={section.id}>
              <a className="topbar-link" href={`#${section.id}`}>
                {section.label}
              </a>
            </li>
          ))}
          <li>
            <a
              className="topbar-link"
              href={content.person.resumeUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              Resume
            </a>
          </li>
        </ul>

        <button type="button" className="topbar-toggle" onClick={onToggleMode}>
          {mode === 'game' ? 'Classic view' : 'Back to the village'}
        </button>
      </nav>
    </header>
  )
}
