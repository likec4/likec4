import type { DiagramNode } from '@likec4/core/types'
import {
  animated,
  useSpring
} from '@react-spring/konva'
import type { DiagramTheme } from '../types'
import { useNodeEvents } from './nodeEvents'
import { NodeLabels } from './nodeLabels'
import type { InterporatedNodeSprings, NodeSpringsCtrl } from './nodeSprings'


export interface RectangleShapeProps {
  animate?: boolean
  node: DiagramNode
  theme: DiagramTheme
  springs: InterporatedNodeSprings
  ctrl: NodeSpringsCtrl
  onNodeClick?: ((node: DiagramNode) => void) | undefined
}

export const RectangleShape = ({
  animate = true,
  node,
  theme,
  springs,
  ctrl,
  onNodeClick
}: RectangleShapeProps) => {
  const {
    id,
    color,
    labels
  } = node
  const { fill, shadow: shadowColor } = theme.colors[color]

  const rectProps = useSpring({
    to: {
      fill,
      shadowColor
    },
    immediate: !animate
  })

  return (
    // eslint-disable-next-line @typescript-eslint/prefer-ts-expect-error, @typescript-eslint/ban-ts-comment
    // @ts-ignore
    <animated.Group
      {...springs}
      {...useNodeEvents({
        node,
        ctrl,
        onNodeClick
      })}
    >
      <animated.Rect
        cornerRadius={6}
        shadowBlur={12}
        shadowOpacity={0.3}
        shadowOffsetX={0}
        shadowOffsetY={8}
        width={springs.width}
        height={springs.height}
        {...rectProps}
      />
      <NodeLabels
        labels={labels}
        width={node.size.width}
        color={color}
        theme={theme}
      />
    </animated.Group>
  )
}
