import { AnimatedPath, AnimatedRect } from '../../konva'
import { useShadowSprings } from '../springs'
import { NodeIcon } from './NodeIcon'
import { NodeLabels } from './NodeLabel'
import type { NodeShapeProps } from './types'

const PersonIcon = {
  width: 115,
  height: 120,
  path:
    `M57.9197 0C10.9124 0 33.5766 54.75 33.5766 54.75C38.6131 62.25 45.3285 60.75 45.3285 66C45.3285 70.5 39.4526 72 33.5766 72.75C24.3431 72.75 15.9489 71.25 7.55474 84.75C2.51825 93 0 120 0 120H115C115 120 112.482 93 108.285 84.75C99.8905 70.5 91.4963 72.75 82.2628 72C76.3869 71.25 70.5109 69.75 70.5109 65.25C70.5109 60.75 77.2263 62.25 82.2628 54C82.2628 54.75 104.927 0 57.9197 0V0Z`
} as const

export function PersonShape({ node, theme, springs, isHovered }: NodeShapeProps) {
  // const [toolbarProps, toggleToolbar] = useNodeToolbarSpring()
  return (
    <>
      <AnimatedRect
        {...useShadowSprings(isHovered, theme, springs)}
        cornerRadius={6}
        perfectDrawEnabled={false}
        strokeEnabled={false}
        width={springs.width}
        height={springs.height}
        fill={springs.fill}
        // shadowForStrokeEnabled={false}
        // stroke={rectProps.fill}
        // strokeScaleEnabled={false}
        // strokeWidth={1}
        // hitStrokeWidth={25}
      />
      <AnimatedPath
        x={springs.width.to(v => v - 8)}
        y={springs.height}
        data={PersonIcon.path}
        width={PersonIcon.width}
        height={PersonIcon.height}
        fill={springs.stroke}
        opacity={0.7}
        perfectDrawEnabled={false}
        offsetX={PersonIcon.width}
        offsetY={PersonIcon.height}
        listening={false}
        // scaleX={1.1}
        // scaleY={1.1}
      />
      {
        /* <AnimatedCircle
        x={springs.offsetX}
        y={HeadRadius}
        offsetY={HeadRadius / 2}
        radius={HeadRadius}
        fill={rectProps.fill}
      /> */
      }
      <NodeLabels node={node} theme={theme} />
      {
        /* <ExternalLink
              x={-2}
              y={30}
              fill={scale(colors.fill, { s: -10, l: 3 })}
              fillIcon={colors.loContrast}
              {...toolbarProps}
            /> */
      }
      <NodeIcon node={node} />
    </>
  )
}
