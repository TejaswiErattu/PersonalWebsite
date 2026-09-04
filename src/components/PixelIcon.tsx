import type { IconId } from '../game/worldSprites'

/**
 * A tiny DOM/SVG rendering of the same 25 pixel glyphs `worldSprites.ts`
 * draws on the canvas (window awnings, signpost boards, plaques) — so a
 * dialogue's header icon and a signpost's legend markers read as the same
 * visual language as the building you just walked into, without this file
 * touching the canvas sprite code at all. Every glyph is authored against a
 * 10x10 unit grid, same as `drawIcon()` there; `cells` are filled squares,
 * `strokes` are outline-only squares (window/terminal-style icons).
 */

interface Glyph {
  cells?: [number, number, number, number][]
  strokes?: [number, number, number, number][]
}

const GLYPHS: Record<IconId, Glyph> = {
  heart: { cells: [[2, 2, 2, 2], [6, 2, 2, 2], [1, 3, 8, 2], [2, 5, 6, 1], [3, 6, 4, 1], [4, 7, 2, 1]] },
  cap: { cells: [[1, 4, 8, 1], [4, 1, 2, 3], [0, 4, 10, 1], [2, 6, 6, 2], [7, 5, 1, 4]] },
  compass: { strokes: [[0, 0, 10, 10]], cells: [[4, 2, 1, 3], [5, 5, 1, 3], [2, 4, 3, 1], [5, 5, 3, 1]] },
  shield: { cells: [[2, 1, 6, 1], [1, 2, 8, 4], [2, 6, 6, 2], [3, 8, 4, 1], [4, 3, 2, 3]] },
  flag: { cells: [[2, 1, 1, 8], [3, 1, 5, 1], [3, 2, 4, 1], [3, 3, 5, 1], [3, 4, 3, 1]] },
  coin: { cells: [[3, 1, 4, 1], [1, 2, 2, 6], [7, 2, 2, 6], [3, 8, 4, 1], [4, 3, 2, 4]] },
  gear: {
    cells: [
      [3, 0, 4, 2],
      [3, 8, 4, 2],
      [0, 3, 2, 4],
      [8, 3, 2, 4],
      [3, 3, 4, 4],
      [1, 1, 2, 2],
      [7, 1, 2, 2],
      [1, 7, 2, 2],
      [7, 7, 2, 2],
    ],
  },
  wrench: { cells: [[1, 1, 3, 3], [3, 3, 5, 1], [6, 3, 3, 3], [2, 4, 1, 5], [1, 8, 3, 1]] },
  bolt: { cells: [[5, 0, 3, 3], [3, 3, 3, 2], [4, 5, 3, 2], [2, 7, 3, 3]] },
  robot: {
    strokes: [[2, 0, 6, 6]],
    cells: [[3, 2, 1, 1], [6, 2, 1, 1], [3, 4, 4, 1], [4, 6, 2, 2], [1, 7, 2, 2], [7, 7, 2, 2], [4, 8, 2, 2]],
  },
  chat: { cells: [[0, 0, 10, 6], [2, 6, 1, 2], [1, 8, 1, 1], [2, 2, 1, 2], [5, 2, 1, 2]] },
  book: { cells: [[1, 1, 4, 8], [5, 1, 4, 8], [4, 1, 1, 8]] },
  belt: { cells: [[0, 4, 10, 2], [4, 3, 2, 4]] },
  pin: { cells: [[3, 1, 4, 4], [4, 5, 2, 2], [4.5, 7, 1, 3]] },
  phone: { strokes: [[2.5, 0, 5, 10]], cells: [[4, 8, 2, 1]] },
  branch: { cells: [[1, 1, 2, 2], [1, 3, 2, 5], [7, 5, 2, 2], [2, 7, 6, 1], [7, 3, 2, 2]] },
  terminal: { strokes: [[0, 0, 10, 10]], cells: [[2, 3, 1, 1], [3, 4, 1, 1], [2, 5, 1, 1], [5, 6, 3, 1]] },
  leaf: { cells: [[4, 1, 2, 2], [2, 3, 6, 2], [1, 5, 8, 2], [4, 7, 2, 2], [4, 3, 1, 6]] },
  fossil: { cells: [[1, 4, 8, 2], [2, 2, 2, 2], [6, 6, 2, 2], [3, 3, 1, 1], [6, 5, 1, 1]] },
  globe: { cells: [[2, 1, 6, 8], [1, 3, 8, 1], [1, 6, 8, 1], [4, 1, 2, 8]] },
  mail: { strokes: [[0, 1, 10, 7]], cells: [[0, 1, 1, 1], [1, 2, 1, 1], [2, 3, 6, 1], [8, 2, 1, 1], [9, 1, 1, 1]] },
  link: { strokes: [[0, 2, 5, 4], [4, 4, 5, 4]] },
  server: { strokes: [[0, 0, 10, 4], [0, 5, 10, 4]], cells: [[1, 2, 1, 1], [1, 7, 1, 1]] },
  sprout: { cells: [[4, 6, 2, 3], [2, 4, 3, 2], [5, 3, 3, 2], [4, 2, 2, 2]] },
  bell: { cells: [[3, 1, 4, 1], [2, 2, 6, 4], [1, 6, 8, 1], [4, 8, 2, 1]] },
  clock: { strokes: [[0, 0, 10, 10]], cells: [[4.5, 2, 1, 3], [5, 5, 3, 1]] },
}

export default function PixelIcon({
  id,
  size = 20,
  className,
}: {
  id: IconId
  size?: number
  className?: string
}) {
  const glyph = GLYPHS[id]
  return (
    <svg
      viewBox="0 0 10 10"
      width={size}
      height={size}
      className={className}
      shapeRendering="crispEdges"
      aria-hidden="true"
      focusable="false"
    >
      {glyph.cells?.map(([x, y, w, h], i) => (
        <rect key={`c${i}`} x={x} y={y} width={w} height={h} fill="currentColor" />
      ))}
      {glyph.strokes?.map(([x, y, w, h], i) => (
        <rect
          key={`s${i}`}
          x={x + 0.5}
          y={y + 0.5}
          width={Math.max(w - 1, 0)}
          height={Math.max(h - 1, 0)}
          fill="none"
          stroke="currentColor"
          strokeWidth={1}
        />
      ))}
    </svg>
  )
}
