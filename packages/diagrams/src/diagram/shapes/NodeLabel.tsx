import { Text } from '../../konva'
import type { DiagramTheme, DiagramNode } from '../types'
import { NodeIcon } from './NodeIcon'

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
    <>
      {nodeIcon}
      {labels.map((label, i) => {
        let color = colors.hiContrast
        if (label.fontSize !== titleFontSize) {
          color = colors.loContrast
        }
        return (
          <Text
            key={label.text + i}
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
            listening={false}
          />
        )
      })}
    </>
  )
}
NodeLabels.displayName = 'NodeLabels'
