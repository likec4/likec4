import { measureNaturalWidth, prepare } from '@chenglou/pretext'
import { EdgeLabelMetrics } from '@likec4/core/styles'
import { canvasFont, withFontMetrics } from './measure'
import { wrapText } from './wrap'

export type EdgeLabelLines = {
  lines: string[]
  /**
   * Size of the text (without paddings)
   */
  width: number
  height: number
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
  const { fontSize, lineHeight: lineHeightEm } = EdgeLabelMetrics.label
  const lineHeight = fontSize * lineHeightEm
  const { lines, width } = wrapText(label, {
    font: canvasFont(fontSize),
    maxWidth,
    lineHeight,
    maxLines,
    balance: true,
  })
  return { lines, width, height: lines.length * lineHeight }
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
