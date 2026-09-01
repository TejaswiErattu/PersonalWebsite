import { content } from '../content/content'

interface LandingScreenProps {
  onStart: () => void
  onSkip: () => void
}

/** First thing a visitor sees: who this is, and two ways in. */
export default function LandingScreen({ onStart, onSkip }: LandingScreenProps) {
  const { person } = content

  return (
    <main className="landing">
      <div className="landing-card">
        <p className="landing-eyebrow">{person.title}</p>
        <h1 className="landing-name">{person.name}</h1>
        <p className="landing-tagline">{person.tagline}</p>

        <div className="landing-actions">
          <button type="button" className="btn btn-primary" onClick={onStart}>
            Start exploring
          </button>
          <button type="button" className="btn btn-secondary" onClick={onSkip}>
            Skip the game — view classic portfolio
          </button>
        </div>

        <p className="landing-hint">
          Move with <kbd>W</kbd> <kbd>A</kbd> <kbd>S</kbd> <kbd>D</kbd> or the arrow keys.
        </p>
      </div>
    </main>
  )
}
