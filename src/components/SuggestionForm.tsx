import { useEffect, useId, useRef, useState, type FormEvent } from 'react'

import { content } from '../content/content'

/**
 * Cooldown after a submit, in milliseconds, before "Send Suggestion" can be
 * pressed again. `window.location.href = mailto:...` hands off to the OS's
 * mail client asynchronously — nothing here waits for that handoff to
 * finish — so without this, a fast double-click (or a visitor mashing the
 * button while nothing visibly happens yet) could fire the same handoff
 * several times in a row. Every other contextual control in this app
 * (train, plant, feed, mail) disables itself the same way after a click;
 * this keeps the suggestion box consistent with that, even though it is a
 * plain form rather than a game animation.
 */
const SUBMIT_COOLDOWN_MS = 4000

/**
 * The Growth Farm's visitor suggestion box: a `mailto:` form, not a server.
 *
 * Submitting never sends anything itself — it builds a `mailto:` URL with
 * the recipient, subject, and the visitor's trimmed message (all through
 * `encodeURIComponent`, so newlines and punctuation survive the trip) and
 * hands it to the browser via `window.location.href`. That opens the
 * visitor's own email client with everything pre-filled; they still have to
 * press send there themselves. No database, no external form service, no
 * network request from this component at all.
 *
 * Shared by the classic Growth section and the Growth Farm's in-village
 * overlay, via `SectionPage`'s dialogue plumbing — one implementation, one
 * `content.growth.suggestion` config, so the two views can never drift apart
 * or disagree about the character limit.
 */
export function SuggestionForm() {
  const { suggestion } = content.growth
  const { toEmail, subject, maxLength, buttonLabel, placeholder } = suggestion
  const [message, setMessage] = useState('')
  const [cooling, setCooling] = useState(false)
  const textareaId = useId()
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Cancels the pending re-enable if this form unmounts mid-cooldown (e.g.
  // the village overlay that contains it closes), so it can't fire a stale
  // state update after the component is gone.
  useEffect(() => {
    return () => {
      if (timeoutRef.current !== null) clearTimeout(timeoutRef.current)
    }
  }, [])

  const trimmedLength = message.trim().length

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (cooling) return
    const trimmed = message.trim()
    if (!trimmed) return

    const mailto = `mailto:${toEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(trimmed)}`
    window.location.href = mailto

    setCooling(true)
    timeoutRef.current = setTimeout(() => setCooling(false), SUBMIT_COOLDOWN_MS)
  }

  return (
    <form className="suggestion-form" onSubmit={handleSubmit}>
      <label htmlFor={textareaId}>Suggest a project, skill, or experiment</label>
      <textarea
        id={textareaId}
        value={message}
        onChange={(event) => setMessage(event.target.value.slice(0, maxLength))}
        maxLength={maxLength}
        placeholder={placeholder}
        rows={4}
      />
      <p className="suggestion-form-meta" aria-live="polite">
        {cooling ? 'Opening your email client…' : `${message.length} / ${maxLength}`}
      </p>
      <button type="submit" className="btn btn-secondary" disabled={trimmedLength === 0 || cooling}>
        {buttonLabel}
      </button>
    </form>
  )
}
