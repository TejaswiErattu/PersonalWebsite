import { useId, useState, type FormEvent } from 'react'

import { content } from '../content/content'

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
  const textareaId = useId()

  const trimmedLength = message.trim().length

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const trimmed = message.trim()
    if (!trimmed) return
    const mailto = `mailto:${toEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(trimmed)}`
    window.location.href = mailto
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
        {message.length} / {maxLength}
      </p>
      <button type="submit" className="btn btn-secondary" disabled={trimmedLength === 0}>
        {buttonLabel}
      </button>
    </form>
  )
}
