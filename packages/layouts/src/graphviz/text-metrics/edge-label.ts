import {
  type PreparedTextWithSegments,
  layout,
  layoutWithLines,
  measureNaturalWidth,
  prepare,
  prepareWithSegments,
} from '@chenglou/pretext'
import { EdgeLabelMetrics } from '@likec4/core/styles'
import { canvasFont, withFontMetrics } from './measure'

export type EdgeLabelLines = {
  lines: string[]
  /**
   * Size of the text (without paddings)
   */
  width: number
  height: number
}

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

/**
 * Wraps the label to balanced lines not wider than `maxWidth`, and measures it.
 * Explicit line breaks are preserved (CSS `white-space-collapse: preserve-breaks`)
 */
export function wrapEdgeLabel(
  label: string,
  { maxWidth = EdgeLabelMetrics.maxTextWidth, maxLines = EdgeLabelMetrics.label.maxLines }: {
    maxWidth?: number
    maxLines?: number
  } = {},
): EdgeLabelLines {
  const { fontSize: size, lineHeight: lineHeightEm } = EdgeLabelMetrics.label
  const font = canvasFont(size)
  const lineHeight = size * lineHeightEm
  return withFontMetrics(() => {
    let lines: string[] = []
    for (const paragraph of label.trim().split(/\r?\n/)) {
      if (!paragraph.trim()) {
        lines.push('')
        continue
      }
      const prepared = prepareWithSegments(paragraph, font)
      const width = balancedWidth(paragraph, prepared, { maxWidth, lineHeight, font })
      for (const line of layoutWithLines(prepared, width, lineHeight).lines) {
        lines.push(line.text.trim())
      }
    }
    lines = lines.slice(0, maxLines)
    const width = Math.max(0, ...lines.map(line => line ? measureNaturalWidth(prepare(line, font)) : 0))
    return { lines, width, height: lines.length * lineHeight }
  })
}

/**
 * Measures single line text (no wrapping)
 */
function measureLine(text: string, size: number): number {
  return withFontMetrics(() => measureNaturalWidth(prepare(text, canvasFont(size))))
}

export type EdgeLabelBox = {
  /**
   * Wrapped label, lines are separated by `\n`
   */
  label: string | null
  /**
   * Size of the rendered label box (including paddings)
   */
  width: number
  height: number
}

/**
 * Wraps and measures the edge label as it is rendered in the diagram
 * (label and technology, see packages/diagram/src/base-primitives/edge/EdgeLabel.tsx)
 */
function computeEdgeLabelBox(label: string | null, technology: string | null): EdgeLabelBox | null {
  if (!label && !technology) {
    return null
  }
  const { technology: techStyle, gap, paddingBlock, paddingInline } = EdgeLabelMetrics
  const wrapped = label ? wrapEdgeLabel(label) : { lines: [], width: 0, height: 0 }
  let width = wrapped.width
  let height = wrapped.height
  if (technology) {
    width = Math.max(width, measureLine(`[ ${technology} ]`, techStyle.fontSize))
    height += (wrapped.lines.length > 0 ? gap : 0) + techStyle.fontSize * techStyle.lineHeight
  }
  return {
    label: wrapped.lines.length > 0 ? wrapped.lines.join('\n') : null,
    width: Math.ceil(width + 2 * paddingInline),
    height: Math.ceil(height + 2 * paddingBlock),
  }
}

const edgeLabelBoxCache = new Map<string, EdgeLabelBox | null>()

/**
 * Wraps and measures the edge label as it is rendered in the diagram.
 * Returns null if there is nothing to render.
 */
export function edgeLabelBox({ label, technology }: {
  label?: string | null | undefined
  technology?: string | null | undefined
}): EdgeLabelBox | null {
  const key = `${label ?? ''}\u0000${technology ?? ''}`
  let box = edgeLabelBoxCache.get(key)
  if (box === undefined) {
    box = computeEdgeLabelBox(label?.trim() || null, technology?.trim() || null)
    edgeLabelBoxCache.set(key, box)
  }
  return box
}
