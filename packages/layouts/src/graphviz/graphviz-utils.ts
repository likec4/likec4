import type { ComputedNode } from '@likec4/core/types'
import { clamp } from 'rambdax'
import textPixelWidth from 'string-pixel-width'
import { sizes as DiagramNodeSizes } from './sizes'

export const pointToPx = (pt: number) => Math.ceil((pt * 96) / 72)
export const inchToPx = (inch: number) => Math.ceil(inch * 96)
export const pxToInch = (px: number) => px / 96

export function estimateNodeSize(node: ComputedNode) {
  const { maxWidth: maxNodeWidth, ...sizes } = DiagramNodeSizes
  const padding = sizes.padding * 2

  const titleWidth = textPixelWidth(node.title, {
    font: 'helvetica',
    size: sizes.title.fontSize
  })

  const descriptionWidth = node.description
    ? textPixelWidth(node.description, {
        font: 'helvetica',
        size: sizes.description.fontSize
      })
    : 0

  const width = clamp(
    sizes.width - padding,
    maxNodeWidth - padding,
    Math.max(titleWidth, descriptionWidth)
  )

  // TODO: dirty hack, need to fix it
  const titleLines = Math.ceil(titleWidth / width)
  const descriptionLines = Math.ceil(descriptionWidth / width)

  const titleHeight = Math.ceil(titleLines * sizes.title.lineHeight * sizes.title.fontSize)
  const descriptionHeight =
    descriptionLines === 0
      ? 0
      : Math.ceil(descriptionLines * sizes.description.lineHeight * sizes.description.fontSize)

  const height = Math.max(
    sizes.height,
    titleHeight +
      padding +
      (descriptionHeight > 0 ? descriptionHeight + sizes.padding - sizes.title.fontSize : 0)
  )

  return {
    ...sizes,
    width: width + padding,
    height: height
  } as const
}
