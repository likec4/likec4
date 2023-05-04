
import type { FrameValue, SpringValue } from '@react-spring/konva'
import { AnimatedGroup, Circle, Path } from '../../konva'
import { DefaultDiagramTheme } from '../theme'

export type ExternalLinkProps = {
  visible?: boolean | FrameValue<boolean>
  fill: string
  fillIcon?: string
  opacity?: number | SpringValue<number>
  scale?: number | SpringValue<number>
  x: number
  y: number
}

// export type ExternalLinkCtrl

export const ExternalLink = ({
  visible = true,
  fill,
  fillIcon = DefaultDiagramTheme.colors.primary.loContrast,
  opacity = 1,
  scale = 1,
  x = 0,
  y = 0
}: ExternalLinkProps) => {

  const width = 34
  const offsetXY = width / 2

  const iconSize = 20
  const offsetIcon = iconSize / 2

  return (
    // eslint-disable-next-line @typescript-eslint/prefer-ts-expect-error, @typescript-eslint/ban-ts-comment
    // @ts-ignore
    <AnimatedGroup
      x={x + offsetXY}
      y={y + width - 10}
      offsetX={offsetXY}
      offsetY={width - 10}
      visible={visible}
      scaleX={scale}
      scaleY={scale}
      opacity={opacity}
      width={width}
      height={width}
      >
      <Circle
        x={0}
        y={0}
        radius={offsetXY}
        fill={fill}
        stroke={fill}
        strokeWidth={1}
        hitStrokeWidth={25}
        strokeScaleEnabled={false}
        perfectDrawEnabled={false}
        shadowBlur={12}
        shadowOpacity={0.5}
        shadowOffsetX={0}
        shadowOffsetY={2}
        shadowColor={DefaultDiagramTheme.colors.primary.shadow}
        shadowForStrokeEnabled={false}
        onPointerEnter={evt => {
          console.log(`--> CircleEnter`, {evt})
        }}
        onPointerLeave={evt => {
          console.log(`<-- CircLeave`, {evt})
        }}
      />
      <Path
        data='M11 3a1 1 0 1 0 0 2h2.586l-6.293 6.293a1 1 0 1 0 1.414 1.414L15 6.414V9a1 1 0 1 0 2 0V4a1 1 0 0 0-1-1h-5z'
        fill={fillIcon}
        strokeEnabled={false}
        perfectDrawEnabled={false}
        listening={false}
        x={0}
        y={0}
        offsetX={offsetIcon}
        offsetY={offsetIcon}
        width={iconSize}
        height={iconSize}
        // scaleX={width / (iconSize + 6)}
        // scaleY={width / (iconSize + 6)}
      />
      <Path
        data='M5 5a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2v-3a1 1 0 1 0-2 0v3H5V7h3a1 1 0 0 0 0-2H5z'
        fill={fillIcon}
        strokeEnabled={false}
        perfectDrawEnabled={false}
        listening={false}
        x={0}
        y={0}
        offsetX={offsetIcon}
        offsetY={offsetIcon}
        width={iconSize}
        height={iconSize}
        // scaleX={width / (iconSize + 6)}
        // scaleY={width / (iconSize + 6)}
      />
    </AnimatedGroup>
  )
}
