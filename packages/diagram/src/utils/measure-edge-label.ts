import {
  type PreparedTextWithSegments,
  clearCache,
  layout,
  layoutWithLines,
  measureNaturalWidth,
  prepare,
  prepareWithSegments,
} from '@chenglou/pretext'
import { DefaultFontFamily, EdgeLabelMetrics } from '@likec4/core/styles'

/**
 * Canvas font of the edge label (see `EdgeLabelMetrics` in the style preset)
 */
export const edgeLabelFont = (size: number = EdgeLabelMetrics.label.fontSize) => `${size}px ${DefaultFontFamily}`

export type MeasuredEdgeLabel = {
  /**
   * Wrapped label, lines are separated by `\n`
   */
  label: string | null
  /**
   * Size of the label box (including paddings)
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

function wrapLabel(label: string, maxWidth: number): { lines: string[]; width: number } {
  const font = edgeLabelFont()
  const lineHeight = EdgeLabelMetrics.label.fontSize * EdgeLabelMetrics.label.lineHeight
  let lines: string[] = []
  // explicit line breaks are kept (CSS white-space-collapse: preserve-breaks)
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
  lines = lines.slice(0, EdgeLabelMetrics.label.maxLines)
  const width = Math.max(0, ...lines.map(line => line ? measureNaturalWidth(prepare(line, font)) : 0))
  return { lines, width }
}

/**
 * Rough estimate, when there is no canvas to measure text (e.g. jsdom)
 */
function estimateLabel(label: string, maxWidth: number): { lines: string[]; width: number } {
  const charWidth = EdgeLabelMetrics.label.fontSize * 0.55
  const width = Math.min(maxWidth, label.length * charWidth)
  const lineCount = Math.min(EdgeLabelMetrics.label.maxLines, Math.ceil(label.length * charWidth / maxWidth))
  return { lines: Array.from({ length: lineCount }, () => label), width }
}

/**
 * Wraps and measures the edge label as it is rendered by `EdgeLabel`.
 * Uses canvas of the browser, so the font must be loaded (see {@link loadEdgeLabelFont})
 */
export function measureEdgeLabel({
  label,
  technology,
  withActionButton = false,
  maxWidth = EdgeLabelMetrics.maxTextWidth,
}: {
  label: string | null
  technology?: string | null | undefined
  withActionButton?: boolean
  maxWidth?: number
}): MeasuredEdgeLabel {
  const { label: labelStyle, technology: techStyle, gap, paddingBlock, paddingInline, actionButtonSize } =
    EdgeLabelMetrics
  let wrapped: { lines: string[]; width: number }
  let techWidth = 0
  try {
    wrapped = label?.trim() ? wrapLabel(label, maxWidth) : { lines: [], width: 0 }
    if (technology) {
      techWidth = measureNaturalWidth(prepare(`[ ${technology} ]`, edgeLabelFont(techStyle.fontSize)))
    }
  } catch {
    // pretext throws without canvas
    wrapped = label?.trim() ? estimateLabel(label, maxWidth) : { lines: [], width: 0 }
    techWidth = technology ? (technology.length + 4) * techStyle.fontSize * 0.55 : 0
  }
  const rows: number[] = []
  if (wrapped.lines.length > 0) {
    rows.push(wrapped.lines.length * labelStyle.fontSize * labelStyle.lineHeight)
  }
  if (technology) {
    rows.push(techStyle.fontSize * techStyle.lineHeight)
  }
  if (withActionButton) {
    rows.push(actionButtonSize)
  }
  const width = Math.max(wrapped.width, techWidth, withActionButton ? actionButtonSize : 0)
  const height = rows.reduce((sum, h) => sum + h, 0) + Math.max(0, rows.length - 1) * gap
  return {
    label: wrapped.lines.length > 0 ? wrapped.lines.join('\n') : null,
    width: Math.ceil(width + 2 * paddingInline),
    height: Math.ceil(height + 2 * paddingBlock),
  }
}

/**
 * Loads faces of the edge label font required to render given texts.
 * Resolves to `true` if something was loaded (measurements should be repeated)
 */
export async function loadEdgeLabelFont(texts: ReadonlyArray<string>): Promise<boolean> {
  if (typeof document === 'undefined' || !document.fonts) {
    return false
  }
  const sample = texts.join(' ')
  const font = edgeLabelFont()
  if (document.fonts.check(font, sample)) {
    return false
  }
  await document.fonts.load(font, sample)
  clearCache()
  return true
}
