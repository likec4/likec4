import type { ComputedNode } from '@likec4/core'
import { type LikeC4Styles, ElementNodeMetrics, elementNodePaddings } from '@likec4/core/styles'
import { RichText } from '@likec4/core/types'
import { canvasFont } from './measure'
import { wrapText } from './wrap'

export type ElementNodeBox = {
  /**
   * Node size
   */
  width: number
  height: number
  /**
   * Wrapped lines of the title, technology and description (as rendered)
   */
  title: string[]
  technology: string[]
  description: string[]
}

type Node = Pick<ComputedNode, 'title' | 'technology' | 'description' | 'icon' | 'shape' | 'style'>

/**
 * Measures the content of the element node as it is rendered by the diagram
 * (see `elementNodeData` recipe and `ElementNodeMetrics`).
 *
 * The node keeps the width of its size (from the theme), the height grows when the content does not fit.
 * Returns null for nodes with `sizing: fixed` (they keep their size and shrink the content).
 */
export function elementNodeBox(node: Node, styles: LikeC4Styles): ElementNodeBox | null {
  if (node.style.sizing === 'fixed') {
    return null
  }
  const M = ElementNodeMetrics
  const { sizes: { size }, values } = styles.nodeSizes(node.style)
  const { textSize, iconSize, padding } = values
  let { width, height } = values.sizes
  // Mirrors adjustments of the shapes in DotPrinter
  switch (node.shape) {
    case 'queue':
      height = height - 8
      break
    case 'component':
      width = width + 10
      break
  }

  const paddings = elementNodePaddings(node.shape, padding)
  const hasIcon = !!node.icon && node.icon !== 'none'
  const iconPosition = node.style.iconPosition ?? styles.defaults.iconPosition ?? 'left'
  const iconOnSide = hasIcon && (iconPosition === 'left' || iconPosition === 'right')

  const textWidth = width - paddings.left - paddings.right - (iconOnSide ? iconSize + M.iconGapHorizontal : 0)

  const blocks = [] as number[]

  const titleLineHeight = textSize * M.title.lineHeight
  // CSS `text-wrap: balance` does not change the number of lines
  const title = wrapText(node.title, {
    font: canvasFont(textSize, M.title.fontWeight),
    maxWidth: textWidth,
    lineHeight: titleLineHeight,
    maxLines: M.title.maxLines[size],
    balance: true,
  }).lines
  blocks.push(title.length * titleLineHeight)

  let technology = [] as string[]
  const techText = node.technology?.trim()
  if (techText && M.technology.maxLines[size] > 0) {
    const fontSize = textSize * M.technology.fontSizeRatio
    const lineHeight = fontSize * M.technology.lineHeight
    technology = wrapText(techText, {
      font: canvasFont(fontSize, M.technology.fontWeight),
      maxWidth: textWidth,
      lineHeight,
      maxLines: M.technology.maxLines[size],
    }).lines
    blocks.push(technology.length * lineHeight)
  }

  let description = [] as string[]
  const desc = node.description ? RichText.from(node.description) : null
  const descText = desc?.text?.trim()
  if (desc && descText && M.description.maxLines[size] > 0) {
    const fontSize = textSize * M.description.fontSizeRatio
    const lineHeight = fontSize * M.description.lineHeight
    description = wrapText(descText, {
      font: canvasFont(fontSize, M.description.fontWeight),
      maxWidth: textWidth,
      lineHeight,
      maxLines: M.description.maxLines[size],
    }).lines
    let descHeight = description.length * lineHeight
    if (desc.isMarkdown) {
      // markdown is limited by max-height (see ElementData.Description)
      descHeight = Math.min(descHeight, 8 * 16)
    }
    blocks.push(descHeight)
  }

  const gap = technology.length > 0 && description.length > 0 ? M.contentGapDense : M.contentGap
  let contentHeight = blocks.reduce((sum, h) => sum + h, 0) + Math.max(0, blocks.length - 1) * gap

  if (hasIcon) {
    contentHeight = iconOnSide
      ? Math.max(contentHeight, iconSize)
      : contentHeight + iconSize + M.iconGapVertical
  }

  return {
    width,
    height: Math.max(height, Math.ceil(contentHeight + paddings.top + paddings.bottom)),
    title,
    technology,
    description,
  }
}
