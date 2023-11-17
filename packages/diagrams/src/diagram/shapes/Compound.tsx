import { AnimatedRect, Text } from '../../konva'
import type { NodeSpringValues } from '../springs'
import type { DiagramNode, DiagramTheme } from '../types'

interface CompoundProps {
  node: DiagramNode
  theme: DiagramTheme
  springs: NodeSpringValues
  labelOffsetX?: number
}

export function CompoundShape({ node, theme, springs, labelOffsetX = 0 }: CompoundProps) {
  const { labels } = node

  return (
    <>
      <AnimatedRect
        cornerRadius={4}
        shadowColor={theme.shadow}
        shadowBlur={node.level > 0 ? 20 : 10}
        shadowOpacity={node.level > 0 ? 0.35 : 0.8}
        shadowOffsetX={0}
        shadowOffsetY={4}
        shadowEnabled={springs.opacity.to(v => v > 0.7)}
        width={springs.width}
        height={springs.height}
        fill={springs.fill}
        strokeEnabled={false}
        listening={false}
      />
      {labels.map(({ pt: [x, y], ...label }, i) => (
        <Text
          key={i}
          x={x + 4}
          y={y}
          offsetX={labelOffsetX}
          width={node.size.width + labelOffsetX - 4}
          fill={'#BABABA'}
          fontFamily={theme.font}
          fontSize={label.fontSize}
          fontStyle={label.fontStyle ?? 'normal'}
          align={label.align}
          text={label.text}
          wrap={'none'}
          ellipsis={true}
          perfectDrawEnabled={false}
          globalCompositeOperation={'luminosity'}
        />
      ))}
    </>
  )
}
