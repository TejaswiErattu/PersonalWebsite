/**
 * Audio preferences, and nothing else.
 *
 * Deliberately free of any Web Audio code so it can be imported eagerly by the
 * volume control in the top bar without dragging the synthesis engine — or an
 * `AudioContext` — into the initial bundle.
 *
 * Preferences persist to localStorage so a visitor who mutes the site once
 * stays muted on every later visit.
 */

const STORAGE_KEY = 'pixel-portfolio:audio'

export interface AudioPrefs {
  muted: boolean
  /** 0..1. Applied on top of the engine's own conservative ceiling. */
  volume: number
}

export const DEFAULT_PREFS: AudioPrefs = {
  // Default to muted. Sound that starts itself is the single most complained
  // about thing a portfolio can do, and browsers block it anyway — this makes
  // "on" an explicit, remembered choice.
  muted: true,
  volume: 0.6,
}

function clamp01(value: number): number {
  if (!Number.isFinite(value)) return DEFAULT_PREFS.volume
  return Math.min(Math.max(value, 0), 1)
}

/**
 * Reads saved preferences, falling back to defaults for anything missing or
 * malformed. localStorage access is wrapped because it throws outright in
 * Safari private mode and when cookies are blocked.
 */
export function loadPrefs(): AudioPrefs {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULT_PREFS

    const parsed: unknown = JSON.parse(raw)
    if (typeof parsed !== 'object' || parsed === null) return DEFAULT_PREFS

    const record = parsed as Partial<Record<keyof AudioPrefs, unknown>>
    return {
      muted: typeof record.muted === 'boolean' ? record.muted : DEFAULT_PREFS.muted,
      volume: typeof record.volume === 'number' ? clamp01(record.volume) : DEFAULT_PREFS.volume,
    }
  } catch {
    return DEFAULT_PREFS
  }
}

/** Best-effort persist. A failure here must never break playback. */
export function savePrefs(prefs: AudioPrefs): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs))
  } catch {
    /* Storage unavailable — preferences simply don't survive the session. */
  }
}
