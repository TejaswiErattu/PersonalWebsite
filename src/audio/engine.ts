/**
 * The sound engine.
 *
 * ── Why this is synthesised rather than streamed from files ──
 * Everything here is generated at runtime with the Web Audio API: a few
 * oscillators, a filter and some envelopes. That is a deliberate choice over
 * shipping .ogg/.mp3 assets.
 *
 *   - It is CC0 by construction. There is no third-party recording in the
 *     repo, so there is no licence to honour, no attribution file to keep in
 *     sync, and no risk of a "CC0" download turning out to be mislicensed.
 *   - It weighs a couple of kB of code instead of a couple of hundred kB of
 *     audio, and the background bed loops seamlessly because it never loops —
 *     the oscillators simply keep running.
 *
 * If real recordings are ever preferred, the exported surface below is the
 * only thing the rest of the app knows about, so a file-backed engine can be
 * dropped in behind it without touching a single component.
 *
 * This module is only ever reached through a dynamic `import()` in
 * `audio.ts`, after a user gesture. Nothing here runs — and no
 * `AudioContext` is constructed — until someone actually turns sound on.
 */

/** Ceiling applied before the user's own volume. Keeps the bed genuinely soft. */
const MASTER_CEILING = 0.22

/** Seconds spent fading the bed in or out. Long enough to never click. */
const FADE_SECONDS = 1.2

/** The pad chord, in Hz. A low open fifth plus a tenth — calm, not melodic. */
const PAD_FREQUENCIES = [110, 164.81, 277.18]

/**
 * A soft, sparse melody over the pad — the bed's "playful" layer. Notes are
 * an A major pentatonic (the pad's own A-E-C# chord plus its second and
 * sixth), so nothing ever clashes with the sustained drone underneath.
 * Picked at random, spaced several seconds apart, so it reads as an
 * occasional wind-chime or music-box sparkle rather than a melody loop —
 * cheerful and cozy without becoming something a visitor has to tune out.
 */
const SPARKLE_NOTES = [440, 493.88, 554.37, 659.25, 739.99, 880]
const SPARKLE_MIN_GAP_SECONDS = 3.5
const SPARKLE_MAX_GAP_SECONDS = 7.5
/** Peak volume of one sparkle note, pre-master-gain. Quieter than a blip. */
const SPARKLE_PEAK_GAIN = 0.16
const SPARKLE_DECAY_SECONDS = 1.4

export interface SoundEngine {
  /** Starts (or resumes) the looping background bed. */
  startBed: () => Promise<void>
  /** Fades the bed out but keeps the context alive for blips. */
  stopBed: () => void
  /** Short UI tick. `kind` only varies the pitch. */
  blip: (kind: 'open' | 'advance' | 'close') => void
  /** The Incoming Train's departure horn — a two-tone honk. */
  trainHorn: () => void
  /** 0..1, applied to everything. */
  setVolume: (volume: number) => void
  /** Releases the audio hardware. */
  dispose: () => void
}

/** Pitches for each blip, chosen to sit inside the pad chord so nothing clashes. */
const BLIP_HZ: Record<'open' | 'advance' | 'close', number> = {
  open: 660,
  advance: 880,
  close: 440,
}

export function createSoundEngine(): SoundEngine {
  const context = new AudioContext()

  // master -> destination. Every voice routes through this, so volume and
  // muting are one gain node rather than bookkeeping across many.
  const master = context.createGain()
  master.gain.value = 0
  master.connect(context.destination)

  // A gentle lowpass over the pad removes the buzz that raw oscillators have
  // and makes the result sit behind the page rather than on top of it.
  const padFilter = context.createBiquadFilter()
  padFilter.type = 'lowpass'
  padFilter.frequency.value = 620
  padFilter.Q.value = 0.5

  const padGain = context.createGain()
  padGain.gain.value = 0
  padFilter.connect(padGain)
  padGain.connect(master)

  const padOscillators: OscillatorNode[] = PAD_FREQUENCIES.map((hz, index) => {
    const osc = context.createOscillator()
    osc.type = 'sine'
    osc.frequency.value = hz
    // A few cents of detune per voice gives the chord a slow natural drift,
    // which is what stops a sustained pad from sounding like a test tone.
    osc.detune.value = (index - 1) * 6

    const voice = context.createGain()
    voice.gain.value = index === 0 ? 0.5 : 0.28
    osc.connect(voice)
    voice.connect(padFilter)
    return osc
  })

  // Very slow filter sweep. This is the whole reason the bed does not get
  // boring: the chord never changes, but its colour does.
  const lfo = context.createOscillator()
  lfo.frequency.value = 0.045
  const lfoDepth = context.createGain()
  lfoDepth.gain.value = 180
  lfo.connect(lfoDepth)
  lfoDepth.connect(padFilter.frequency)

  let started = false
  let userVolume = 1
  let bedWanted = false

  const applyMasterGain = (): void => {
    const target = bedWanted ? MASTER_CEILING * userVolume : 0
    const now = context.currentTime
    master.gain.cancelScheduledValues(now)
    master.gain.setValueAtTime(master.gain.value, now)
    master.gain.linearRampToValueAtTime(target, now + FADE_SECONDS)
  }

  // The sparkle layer's own scheduler — a plain `setTimeout` chain rather
  // than anything Web-Audio-clocked, since a few seconds of jitter on an
  // ambient chime nobody is counting is unnoticeable. Tracked so `stopBed()`
  // and `dispose()` can cancel the next tick and truly go silent instead of
  // firing one more note after the bed has faded out.
  let sparkleTimeoutId: ReturnType<typeof setTimeout> | null = null

  const playSparkle = (): void => {
    // Same guard as `blip`/`trainHorn` — skip rather than schedule a voice
    // that would play into a faded-out or suspended context.
    if (!bedWanted || context.state !== 'running') return

    const now = context.currentTime
    const hz = SPARKLE_NOTES[Math.floor(Math.random() * SPARKLE_NOTES.length)]

    const osc = context.createOscillator()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(hz, now)

    const envelope = context.createGain()
    envelope.gain.setValueAtTime(0, now)
    envelope.gain.linearRampToValueAtTime(SPARKLE_PEAK_GAIN, now + 0.05)
    envelope.gain.exponentialRampToValueAtTime(0.0001, now + SPARKLE_DECAY_SECONDS)

    osc.connect(envelope)
    envelope.connect(master)
    osc.start(now)
    osc.stop(now + SPARKLE_DECAY_SECONDS + 0.05)
    osc.onended = () => {
      osc.disconnect()
      envelope.disconnect()
    }
  }

  const scheduleSparkle = (): void => {
    const gapSeconds =
      SPARKLE_MIN_GAP_SECONDS + Math.random() * (SPARKLE_MAX_GAP_SECONDS - SPARKLE_MIN_GAP_SECONDS)
    sparkleTimeoutId = setTimeout(() => {
      playSparkle()
      // Re-arms itself only while the bed is still wanted, so muting during
      // the gap between two notes stops the chain rather than firing once
      // more and rescheduling again.
      if (bedWanted) scheduleSparkle()
    }, gapSeconds * 1000)
  }

  return {
    startBed: async () => {
      bedWanted = true

      // Autoplay policy: a context created outside a gesture starts
      // 'suspended'. Resuming is what a gesture buys us.
      if (context.state === 'suspended') await context.resume()

      if (!started) {
        started = true
        const now = context.currentTime
        padOscillators.forEach((osc) => osc.start(now))
        lfo.start(now)
        padGain.gain.setValueAtTime(0, now)
        padGain.gain.linearRampToValueAtTime(1, now + FADE_SECONDS)
      }

      applyMasterGain()
      // Guarded so a second `startBed()` (unmute → mute → unmute) can't
      // stack a second, faster-firing sparkle chain on top of the first.
      if (sparkleTimeoutId === null) scheduleSparkle()
    },

    stopBed: () => {
      bedWanted = false
      applyMasterGain()
      if (sparkleTimeoutId !== null) {
        clearTimeout(sparkleTimeoutId)
        sparkleTimeoutId = null
      }
    },

    blip: (kind) => {
      // Blips are pointless if the bed is off — that is what "muted" means to
      // a visitor — and scheduling them anyway would leak nodes while silent.
      if (!bedWanted || context.state !== 'running') return

      const now = context.currentTime
      const osc = context.createOscillator()
      osc.type = 'triangle'
      osc.frequency.setValueAtTime(BLIP_HZ[kind], now)

      const envelope = context.createGain()
      // Fast attack, short exponential-ish decay: a tick, not a beep.
      envelope.gain.setValueAtTime(0, now)
      envelope.gain.linearRampToValueAtTime(0.5, now + 0.008)
      envelope.gain.exponentialRampToValueAtTime(0.0001, now + 0.16)

      osc.connect(envelope)
      envelope.connect(master)
      osc.start(now)
      osc.stop(now + 0.18)
      // Let the node graph collect itself once the voice has finished.
      osc.onended = () => {
        osc.disconnect()
        envelope.disconnect()
      }
    },

    trainHorn: () => {
      // Same muted/inactive guard as `blip` — no point scheduling a voice
      // that would play silently.
      if (!bedWanted || context.state !== 'running') return

      const now = context.currentTime
      const duration = 0.5

      // A two-tone diesel-horn chord (a minor third), through a lowpass so
      // the raw sawtooth reads as a brassy honk rather than a buzz.
      const envelope = context.createGain()
      envelope.gain.setValueAtTime(0, now)
      envelope.gain.linearRampToValueAtTime(0.4, now + 0.04)
      envelope.gain.setValueAtTime(0.4, now + duration - 0.16)
      envelope.gain.exponentialRampToValueAtTime(0.0001, now + duration)

      const hornFilter = context.createBiquadFilter()
      hornFilter.type = 'lowpass'
      hornFilter.frequency.value = 1500
      hornFilter.Q.value = 0.6
      hornFilter.connect(envelope)
      envelope.connect(master)

      const oscillators = [233.08, 277.18].map((hz) => {
        const osc = context.createOscillator()
        osc.type = 'sawtooth'
        osc.frequency.setValueAtTime(hz, now)
        const voice = context.createGain()
        voice.gain.value = 0.45
        osc.connect(voice)
        voice.connect(hornFilter)
        osc.start(now)
        osc.stop(now + duration + 0.02)
        return osc
      })

      oscillators[oscillators.length - 1].onended = () => {
        oscillators.forEach((osc) => osc.disconnect())
        hornFilter.disconnect()
        envelope.disconnect()
      }
    },

    setVolume: (volume) => {
      userVolume = volume
      applyMasterGain()
    },

    dispose: () => {
      if (sparkleTimeoutId !== null) {
        clearTimeout(sparkleTimeoutId)
        sparkleTimeoutId = null
      }
      try {
        if (started) {
          padOscillators.forEach((osc) => osc.stop())
          lfo.stop()
        }
      } catch {
        /* Already stopped. */
      }
      void context.close()
    },
  }
}
