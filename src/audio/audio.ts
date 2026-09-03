/**
 * The only audio surface the rest of the app touches.
 *
 * Three rules are enforced here, in one place, so no component has to
 * remember them:
 *
 *   1. NEVER autoplay. The engine module is not even fetched until the
 *      visitor unmutes, which by definition happens inside a click or key
 *      press. Before that, no `AudioContext` exists.
 *   2. Lazy-load. `./engine` arrives via dynamic `import()`, so Web Audio
 *      code stays out of the initial bundle for the majority of visitors who
 *      never turn sound on.
 *   3. Preferences win. Mute state and volume are restored from localStorage
 *      on load, and a muted visitor stays silent without any network cost.
 */

import { loadPrefs, savePrefs, type AudioPrefs } from './prefs'
import type { SoundEngine } from './engine'

type Listener = (prefs: AudioPrefs) => void

let prefs: AudioPrefs = loadPrefs()
let engine: SoundEngine | null = null
/** Held so two fast clicks can't kick off two parallel imports. */
let loading: Promise<SoundEngine> | null = null

const listeners = new Set<Listener>()

function emit(): void {
  for (const listener of listeners) listener(prefs)
}

/** Subscribes to preference changes. Returns its own unsubscribe. */
export function subscribe(listener: Listener): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function getPrefs(): AudioPrefs {
  return prefs
}

/**
 * Fetches and constructs the engine, at most once.
 *
 * Must only be called from inside a user gesture — that is what allows the
 * `AudioContext` to leave the 'suspended' state.
 */
async function ensureEngine(): Promise<SoundEngine> {
  if (engine) return engine
  if (loading) return loading

  loading = import('./engine')
    .then(({ createSoundEngine }) => {
      engine = createSoundEngine()
      engine.setVolume(prefs.volume)
      return engine
    })
    .catch((error: unknown) => {
      // Audio is an enhancement. If the import or the context fails, the site
      // carries on silently rather than surfacing an error.
      loading = null
      throw error
    })

  return loading
}

/**
 * Turns sound on or off. Call this from a click/keypress handler.
 *
 * Unmuting is the gesture that loads the engine; muting only fades the
 * existing one out, keeping the context alive so unmuting again is instant.
 */
export async function setMuted(muted: boolean): Promise<void> {
  prefs = { ...prefs, muted }
  savePrefs(prefs)
  emit()

  if (muted) {
    engine?.stopBed()
    return
  }

  try {
    const active = await ensureEngine()
    active.setVolume(prefs.volume)
    await active.startBed()
  } catch {
    /* Enhancement only — stay silent. */
  }
}

export function setVolume(volume: number): void {
  prefs = { ...prefs, volume }
  savePrefs(prefs)
  emit()
  engine?.setVolume(volume)
}

/**
 * Plays a short interaction tick.
 *
 * Safe to call from anywhere: it is a no-op while muted or before the engine
 * has been loaded, so callers never have to check state first.
 */
export function blip(kind: 'open' | 'advance' | 'close'): void {
  if (prefs.muted) return
  engine?.blip(kind)
}

/**
 * Plays the Incoming Train's departure horn.
 *
 * Same no-op-when-silent contract as `blip`: safe to call unconditionally
 * from the game loop, muted or not, engine loaded or not.
 */
export function playTrainHorn(): void {
  if (prefs.muted) return
  engine?.trainHorn()
}
