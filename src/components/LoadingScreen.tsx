/**
 * Full-bleed pixel loading screen shown while the game boots.
 *
 * There are two genuinely different waits here and the bar reflects both
 * honestly rather than papering over them with a timer:
 *
 *  1. Downloading the game chunk. The browser gives no byte-level progress for
 *     a dynamic `import()`, so this stage is rendered as an indeterminate
 *     barber-pole with no `aria-valuenow`. Faking a percentage for a number we
 *     do not have would be a lie the user could catch by throttling to 3G.
 *  2. Decoding sprites. Kaplay's loader reports a real resolved/total ratio,
 *     which is passed straight through. Because every sprite is generated in
 *     code rather than fetched, this stage is genuinely quick — the bar
 *     jumping to full is the truth, not a skipped animation.
 *
 * The screen is announced politely rather than assertively: it is progress
 * information, not an alert, and a screen-reader user pressing "start" already
 * knows something is happening.
 */
export interface LoadingScreenProps {
  /** 0..1 for a known ratio, or null when the wait has no measurable size. */
  progress: number | null
  /** What is being waited on, shown under the bar and read out. */
  label: string
}

/** Pixel blocks in the bar. Chunky on purpose, to match the world's 16px grid. */
const SEGMENTS = 20

export default function LoadingScreen({ progress, label }: LoadingScreenProps) {
  const percent = progress === null ? 0 : Math.round(progress * 100)
  const filled = progress === null ? 0 : Math.round(progress * SEGMENTS)

  return (
    <div className="loading" role="status" aria-live="polite">
      <div className="loading-inner">
        <p className="loading-title">Loading the village</p>

        <div
          className={`loading-bar${progress === null ? ' is-indeterminate' : ''}`}
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          // Omitted entirely while indeterminate, which is how assistive tech
          // is told "in progress, size unknown".
          aria-valuenow={progress === null ? undefined : percent}
          aria-label={label}
        >
          {Array.from({ length: SEGMENTS }, (_, index) => (
            <span
              key={index}
              className={`loading-seg${index < filled ? ' is-on' : ''}`}
              // Decorative: the bar's own role and value carry the meaning.
              aria-hidden="true"
            />
          ))}
        </div>

        <p className="loading-label">
          {label}
          {progress !== null && <span className="loading-percent">{percent}%</span>}
        </p>
      </div>
    </div>
  )
}
