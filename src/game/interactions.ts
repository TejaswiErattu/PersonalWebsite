/**
 * The interaction system.
 *
 * Anything in the world that the player can walk up to and act on registers
 * itself here as an `Interactable`: a point, a radius around it, a label for
 * the on-screen prompt, and what to do when the player presses the key.
 *
 * The registry deliberately knows nothing about buildings, dialogue or Kaplay.
 * It answers exactly one question — "which single thing is the player closest
 * to right now?" — and that is what keeps two overlapping triggers from both
 * firing on one keypress.
 */

export interface Interactable {
  /** Stable id, handy for debugging and for de-registering later. */
  id: string
  /** Shown in the prompt, e.g. "Cozy House". */
  label: string
  /** Trigger centre in world pixels. */
  x: number
  y: number
  /** How close the player's centre must be, in world pixels. */
  radius: number
  /** Runs once per accepted keypress. */
  onInteract: () => void
}

export class InteractionRegistry {
  private items: Interactable[] = []

  register(item: Interactable): void {
    this.items.push(item)
  }

  remove(id: string): void {
    this.items = this.items.filter((item) => item.id !== id)
  }

  clear(): void {
    this.items = []
  }

  /**
   * The closest interactable whose radius contains the point, or null.
   *
   * Only ever returns one, so a keypress can only ever trigger one thing —
   * even where trigger radii overlap. Distances are compared squared to keep
   * the per-frame cost to multiplications.
   */
  nearest(x: number, y: number): Interactable | null {
    let best: Interactable | null = null
    let bestDistance = Infinity

    for (const item of this.items) {
      const dx = item.x - x
      const dy = item.y - y
      const distance = dx * dx + dy * dy
      if (distance > item.radius * item.radius) continue
      if (distance >= bestDistance) continue
      bestDistance = distance
      best = item
    }

    return best
  }
}
