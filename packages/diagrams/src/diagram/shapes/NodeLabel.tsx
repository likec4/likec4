import { Group, Text } from '../../konva'
import type { DiagramNode, DiagramTheme } from '../types'

type NodeLabelsProps = {
  node: DiagramNode
  maxWidth?: number
  offsetX?: number
  offsetY?: number
  theme: DiagramTheme
}

export function NodeLabels({ node, theme, offsetX = 0, offsetY = 0, maxWidth }: NodeLabelsProps) {
  const { labels, color } = node
  const colors = theme.elements[color]
  const width = maxWidth ?? node.width - 40
  const titleFontSize = labels[0]?.fontSize ?? 18
  const x = Math.ceil((node.width - width) / 2)

  return (
    <Group x={x} y={3} offsetX={offsetX} offsetY={offsetY}>
      {labels.map((label, i) => {
        const isTitle = label.fontSize === titleFontSize
        let color = colors.hiContrast
        if (!isTitle) {
          color = colors.loContrast
        }
        return (
          <Text
            key={label.text + i}
            text={label.text}
            x={0}
            y={label.pt[1] - label.fontSize}
            width={width}
            fill={color}
            fontFamily={theme.font}
            fontSize={label.fontSize}
            fontStyle={label.fontStyle ?? 'normal'}
            align={'center'}
            wrap={'none'}
            strokeEnablaed={false}
            perfectDrawEnabled={false}
            listening={false}
          />
        )
      })}
    </Group>
  )
}
NodeLabels.displayName = 'NodeLabels'
