import { useEffect, useState } from 'react'

import { getPrefs, setMuted, setVolume, subscribe } from '../audio/audio'

/**
 * Mute toggle plus a volume slider, for the top bar.
 *
 * Both controls are real form elements, so the whole thing is keyboard
 * operable and screen-reader labelled without any ARIA gymnastics. The
 * slider is hidden while muted — a volume control that does nothing is
 * worse than no volume control.
 *
 * State lives in the audio module rather than here, because the landing
 * screen and the game both need to read it; this component is a view onto
 * that store via `subscribe`.
 */
export default function AudioControl() {
  const [prefs, setPrefs] = useState(getPrefs)

  useEffect(() => subscribe(setPrefs), [])

  return (
    <div className="audio-control">
      <button
        type="button"
        className="audio-toggle"
        // The click itself is the user gesture that lets the AudioContext
        // start, which is why unmuting must happen from a handler like this.
        onClick={() => void setMuted(!prefs.muted)}
        aria-pressed={!prefs.muted}
      >
        <span aria-hidden="true">{prefs.muted ? '🔇' : '🔊'}</span>
        <span className="sr-only">{prefs.muted ? 'Turn sound on' : 'Turn sound off'}</span>
      </button>

      {!prefs.muted && (
        <label className="audio-volume">
          <span className="sr-only">Volume</span>
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={prefs.volume}
            onChange={(event) => setVolume(Number(event.target.value))}
          />
        </label>
      )}
    </div>
  )
}
