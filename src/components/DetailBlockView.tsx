import type { JSX } from 'react'

import type { DetailBlock } from '../content/content'

/**
 * Renders one `DetailBlock` from a project's long-form write-up.
 *
 * Shared by two callers — `ProjectPage` (the full `/projects/<id>` page) and
 * `DialogueBox` (the in-village station, once its lines finish) — so the
 * village and the page can never show different content for the same block:
 * both call this exact function against the exact same array in
 * `content.ts`. Nothing here is view-specific; each caller wraps it in its
 * own layout (page section vs. dialogue panel).
 */

type HeadingLevel = 2 | 3 | 4 | 5 | 6

/** Clamps to 6 so a deeply-nested block (e.g. a card inside a page section
 *  already at h5) never asks for a heading tag that doesn't exist. */
function clamp(level: number): HeadingLevel {
  return Math.min(Math.max(level, 2), 6) as HeadingLevel
}

function Heading({
  level,
  children,
}: {
  level: HeadingLevel
  children: React.ReactNode
}) {
  const Tag = `h${level}` as 'h2'
  return <Tag>{children}</Tag>
}

export function DetailBlockView({
  block,
  level,
}: {
  block: DetailBlock
  /** Heading level for this block's own `heading`/title text. */
  level: HeadingLevel
}): JSX.Element {
  switch (block.kind) {
    case 'video':
      return (
        <figure className="detail-media">
          <video controls muted playsInline preload="metadata" poster={block.poster}>
            <source src={block.src} type="video/mp4" />
          </video>
          <figcaption>{block.caption}</figcaption>
        </figure>
      )

    case 'image':
      return (
        <figure className="detail-media">
          <img
            src={block.src}
            alt={block.alt}
            width={block.width}
            height={block.height}
            loading="lazy"
            decoding="async"
          />
          {block.caption && <figcaption>{block.caption}</figcaption>}
        </figure>
      )

    case 'prose':
      return (
        <div className="detail-block">
          <Heading level={level}>{block.heading}</Heading>
          {block.paragraphs.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>
      )

    case 'list':
      return (
        <div className="detail-block">
          <Heading level={level}>{block.heading}</Heading>
          <ul className={block.tone === 'negative' ? 'detail-list detail-list-negative' : 'detail-list'}>
            {block.items.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      )

    case 'steps':
      return (
        <div className="detail-block">
          <Heading level={level}>{block.heading}</Heading>
          {block.blurb && <p className="detail-blurb">{block.blurb}</p>}
          <ol className="detail-steps">
            {block.steps.map((step, index) => (
              <li key={step.title}>
                <span className="detail-step-num" aria-hidden="true">
                  {index + 1}
                </span>
                <div>
                  <Heading level={clamp(level + 1)}>{step.title}</Heading>
                  <p>{step.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      )

    case 'cards':
      return (
        <div className="detail-block">
          <Heading level={level}>{block.heading}</Heading>
          {block.blurb && <p className="detail-blurb">{block.blurb}</p>}
          <div className="detail-cards">
            {block.cards.map((card) => (
              <div className="detail-card" key={card.title}>
                <Heading level={clamp(level + 1)}>{card.title}</Heading>
                <p>{card.body}</p>
              </div>
            ))}
          </div>
        </div>
      )

    case 'columns':
      return (
        <div className="detail-block">
          <Heading level={level}>{block.heading}</Heading>
          {block.blurb && <p className="detail-blurb">{block.blurb}</p>}
          <div className="detail-columns">
            {block.columns.map((column) => (
              <div className="detail-column" key={column.title}>
                <Heading level={clamp(level + 1)}>{column.title}</Heading>
                <ul>
                  {column.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )

    case 'stats':
      return (
        <div className="detail-block">
          {block.heading && <Heading level={level}>{block.heading}</Heading>}
          <div className="detail-stats">
            {block.stats.map((stat) => (
              <div className="detail-stat" key={stat.label}>
                <span className="detail-stat-value">{stat.value}</span>
                <span className="detail-stat-label">{stat.label}</span>
              </div>
            ))}
          </div>
        </div>
      )

    case 'code':
      return (
        <div className="detail-block">
          <Heading level={level}>{block.heading}</Heading>
          {block.blurb && <p className="detail-blurb">{block.blurb}</p>}
          <pre className="detail-code">
            <code>{block.source}</code>
          </pre>
        </div>
      )

    case 'table':
      return (
        <div className="detail-block">
          <Heading level={level}>{block.heading}</Heading>
          <div className="detail-table-wrap">
            <table>
              <thead>
                <tr>
                  {block.columns.map((column) => (
                    <th key={column}>{column}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {block.rows.map((row) => (
                  <tr key={row.join('|')}>
                    {row.map((cell, cellIndex) => (
                      <td key={cellIndex}>{cell}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )

    case 'chips':
      return (
        <div className="detail-block">
          <Heading level={level}>{block.heading}</Heading>
          <ul className="detail-chips">
            {block.items.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      )
  }
}
