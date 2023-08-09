import useImageLoader from '../../hooks/useImageLoader'
import { Image } from '../../konva'

export type NodeIconProps = {
  icon: string
  maxWidth: number // node width
  maxHeight: number // available height (Y of the first label)
  offsetX?: number
  offsetY?: number
}

export function NodeIcon({ icon, maxWidth, maxHeight, offsetX = 0, offsetY = 0 }: NodeIconProps) {
  const [image] = useImageLoader(icon)
  if (!image) {
    return null
  }
  const padding = 16
  const maxIconWidth = Math.round(maxWidth - padding * 2)
  const maxIconHeight = Math.round(maxHeight - padding * 2)
  const scale = Math.min(maxIconWidth / image.width, maxIconHeight / image.height)
  const iconWidth = Math.floor(image.width * scale)
  const iconHeight = Math.floor(image.height * scale)
  return (
    <Image
      image={image}
      x={padding + (maxIconWidth - iconWidth) / 2}
      y={padding + (maxIconHeight - iconHeight) / 2}
      offsetX={offsetX}
      offsetY={offsetY}
      width={iconWidth}
      height={iconHeight}
      listening={false}
    />
  )
}
