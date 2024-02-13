import useImageLoader from '../../hooks/useImageLoader'
import { Image } from '../../konva'
import type { DiagramNode } from '../types'

type IconImageProps = {
  icon: string
  maxWidth: number // node width
  maxHeight: number // available height (Y of the first label)
  centerX: number
  centerY: number
  offsetX?: number
  offsetY?: number
}

function IconImage({
  icon,
  centerX,
  centerY,
  maxWidth,
  maxHeight,
  offsetX = 0,
  offsetY = 0
}: IconImageProps) {
  const [image] = useImageLoader(icon)
  if (!image) {
    return null
  }
  const scale = Math.min(maxWidth / image.naturalWidth, maxHeight / image.naturalHeight)
  const iconWidth = Math.floor(image.naturalWidth * scale)
  const iconHeight = Math.floor(image.naturalHeight * scale)

  return (
    <Image
      image={image}
      x={centerX - iconWidth / 2}
      y={centerY - iconHeight / 2}
      offsetX={offsetX}
      offsetY={offsetY}
      width={iconWidth}
      height={iconHeight}
      listening={false}
      globalCompositeOperation="hard-light"
    />
  )
}

export type NodeIconProps = {
  node: DiagramNode
  maxWidth?: number | undefined
  paddingX?: number | undefined
  paddingY?: number | undefined
  offsetX?: number | undefined
  offsetY?: number | undefined
}

export function NodeIcon({
  node,
  maxWidth,
  paddingX = 24,
  paddingY = 24,
  offsetX = 0,
  offsetY = 0
}: NodeIconProps) {
  if (!node.icon) {
    return null
  }
  const firstLabel = node.labels[0]
  if (!firstLabel) {
    return null
  }

  const firstLabelY = Math.floor(firstLabel.pt[1] - firstLabel.fontSize * 1.25)
  const maxIconHeight = Math.round(firstLabelY - paddingY - 8)
  const maxIconWidth = maxWidth ?? node.width - paddingX * 2

  const centerY = paddingY + Math.floor(maxIconHeight / 2)
  const centerX = Math.floor(node.width / 2)

  return (
    <IconImage
      icon={node.icon}
      centerX={centerX}
      centerY={centerY}
      maxWidth={maxIconWidth}
      maxHeight={maxIconHeight}
      offsetX={offsetX}
      offsetY={offsetY}
    />
  )
}
