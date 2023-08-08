import { Fragment } from 'react'
import useImageLoader from '../../hooks/useImageLoader'
import { Image, Text } from '../../konva'
import type { DiagramTheme, DiagramNode } from '../types'

type NodeIconProps = {
  icon: string
  maxWidth: number // node width
  maxHeight: number // available height (Y of the first label)
  offsetX?: number
  offsetY?: number
}

function NodeIcon({ icon, maxWidth, maxHeight, offsetX = 0, offsetY = 0 }: NodeIconProps) {
  const [image] = useImageLoader(icon)
  const padding = 16
  const maxIconWidth = Math.round(maxWidth - padding * 2)
  const maxIconHeight = Math.round(maxHeight - padding * 2)
  if (!image) {
    return null
  }
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

type NodeLabelsProps = {
  node: DiagramNode
  maxWidth?: number
  offsetX?: number
  offsetY?: number
  theme: DiagramTheme
}

export function NodeLabels({
  node: { icon, labels, size, color },
  theme,
  offsetX = 0,
  offsetY = 0,
  maxWidth
}: NodeLabelsProps) {
  const colors = theme.colors[color]
  // Title has max font size
  const width = maxWidth ?? size.width
  const firstLabel = labels[0]
  const titleFontSize = firstLabel?.fontSize ?? 12
  let nodeIcon
  if (icon) {
    // Y of the first label or node height
    const maxHeight = firstLabel
      ? Math.floor(firstLabel.pt[1] - firstLabel.fontSize / 2)
      : size.height
    nodeIcon = (
      <NodeIcon
        icon={icon}
        maxWidth={width}
        maxHeight={maxHeight}
        offsetX={offsetX}
        offsetY={offsetY}
      />
    )
  }
  return (
    <Fragment>
      {nodeIcon}
      {labels.map((label, i) => {
        let color = colors.hiContrast
        if (label.fontSize !== titleFontSize) {
          color = colors.loContrast
        }
        return (
          <Text
            key={i}
            x={8}
            width={width - 16}
            y={label.pt[1]}
            offsetY={offsetY + label.fontSize / 2}
            offsetX={offsetX}
            fill={color}
            fontFamily={theme.font}
            fontSize={label.fontSize}
            fontStyle={label.fontStyle ?? 'normal'}
            align={'center'}
            text={label.text}
            strokeEnabled={false}
            perfectDrawEnabled={false}
            hitStrokeWidth={0}
            listening={false}
          />
        )
      })}
    </Fragment>
  )
}
