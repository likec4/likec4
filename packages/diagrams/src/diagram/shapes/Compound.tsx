import { AnimatedRect, AnimatedText } from '../../konva'
import type { NodeSpringValues } from '../springs'
import type { DiagramNode, DiagramTheme } from '../types'

interface CompoundProps {
  node: DiagramNode
  theme: DiagramTheme
  springs: NodeSpringValues
}

export function CompoundShape({ node, theme, springs }: CompoundProps) {
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
        <AnimatedText
          key={i}
          x={x}
          y={y - label.fontSize / 2}
          offsetX={4}
          offsetY={4}
          width={springs.width.to(v => v - x - 4)}
          fill={'#BABABA'}
          fontFamily={theme.font}
          fontSize={label.fontSize}
          fontStyle={label.fontStyle ?? 'normal'}
          letterSpacing={0.8}
          align={label.align}
          text={label.text}
          wrap={'none'}
          ellipsis={true}
          perfectDrawEnabled={false}
          padding={6}
          hitStrokeWidth={3}
          globalCompositeOperation={'luminosity'}
        />
      ))}
      {/* <ExternalLink
          x={-5}
          y={36}
          fill={colors.fill}
          fillIcon={colors.loContrast}
          {...toolbarProps}
        /> */}
    </>
  )
}
