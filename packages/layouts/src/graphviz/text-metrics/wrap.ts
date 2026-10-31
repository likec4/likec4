import {
  type PreparedTextWithSegments,
  layout,
  layoutWithLines,
  measureNaturalWidth,
  prepare,
  prepareWithSegments,
} from '@chenglou/pretext'
import { withFontMetrics } from './measure'

/**
 * Finds the narrowest width that keeps the same number of lines as at `maxWidth`,
 * so lines are roughly equal (like CSS `text-wrap: balance`)
 */
function balancedWidth(
  paragraph: string,
  prepared: PreparedTextWithSegments,
  { maxWidth, lineHeight, font }: { maxWidth: number; lineHeight: number; font: string },
): number {
  const lineCount = layout(prepared, maxWidth, lineHeight).lineCount
  if (lineCount <= 1) {
    return maxWidth
  }
  // never go narrower than the longest word, otherwise words are broken in the middle
  const longestWord = Math.max(
    ...paragraph.split(/\s+/).map(word => word ? measureNaturalWidth(prepare(word, font)) : 0),
  )
  if (longestWord >= maxWidth) {
    return maxWidth
  }
  let lo = longestWord
  let hi = maxWidth
  if (layout(prepared, lo, lineHeight).lineCount === lineCount) {
    return lo
  }
  while (hi - lo > 1) {
    const mid = (lo + hi) / 2
    if (layout(prepared, mid, lineHeight).lineCount > lineCount) {
      lo = mid
    } else {
      hi = mid
    }
  }
  return hi
}

export type WrappedText = {
  lines: string[]
  /**
   * Width of the widest line
   */
  width: number
}

/**
 * Wraps text to lines not wider than `maxWidth`, as the browser does
 * with `overflow-wrap: anywhere` and `white-space-collapse: preserve-breaks` (explicit line breaks are kept).
 */
export function wrapText(
  text: string,
  { font, maxWidth, lineHeight, maxLines, balance = false }: {
    /**
     * Canvas font, see `canvasFont`
     */
    font: string
    maxWidth: number
    lineHeight: number
    maxLines?: number | undefined
    /**
     * Balance lines (like CSS `text-wrap: balance`), does not change the number of lines
     */
    balance?: boolean
  },
): WrappedText {
  return withFontMetrics(() => {
    let lines: string[] = []
    for (const paragraph of text.trim().split(/\r?\n/)) {
      if (!paragraph.trim()) {
        lines.push('')
        continue
      }
      const prepared = prepareWithSegments(paragraph, font)
      const width = balance ? balancedWidth(paragraph, prepared, { maxWidth, lineHeight, font }) : maxWidth
      for (const line of layoutWithLines(prepared, width, lineHeight).lines) {
        lines.push(line.text.trim())
      }
    }
    if (maxLines !== undefined) {
      lines = lines.slice(0, maxLines)
    }
    const width = Math.max(0, ...lines.map(line => line ? measureNaturalWidth(prepare(line, font)) : 0))
    return { lines, width }
  })
}
