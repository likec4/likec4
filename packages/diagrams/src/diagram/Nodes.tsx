import type { SpringConfig, UseTransitionProps } from '@react-spring/konva'
import { useTransition } from '@react-spring/konva'
import { nodeListeners } from './shapes/nodeEvents'
import { nodeShape } from './shapes/nodeShape'
import type { NodeSprings } from './springs'
import { nodeSprings } from './springs'
import type { DiagramNode, DiagramView, LikeC4Theme, OnNodeClick } from './types'

const hasNoChildren = (node: DiagramNode) => {
  return node.children.length <= 0
}

type NodesProps = {
  animate: boolean
  diagram: DiagramView
  theme: LikeC4Theme
  onNodeClick?: OnNodeClick | undefined
}

const keyOf = (node: DiagramNode) => (node.parent ? node.parent + '-' : '') + node.id + '-' + node.shape

export function Nodes({ animate, theme, diagram, onNodeClick }: NodesProps) {
  const nodes = diagram.nodes.filter(hasNoChildren)
  const nodeTransitions = useTransition(nodes, {
    initial: nodeSprings(),
    from: nodeSprings({
      opacity: 0.4,
      scale: 0.7
    }) as unknown as NodeSprings,
    enter: nodeSprings(),
    leave: nodeSprings({
      opacity: 0,
      scale: 0.4
    }),
    update: nodeSprings(),
    expires: true,
    immediate: !animate,
    keys: keyOf,
    delay(key) {
      const isUpdating = nodes.some(n => keyOf(n) === key)
      return isUpdating ? 30 : 0
    },
    config: (_node, _index, state): SpringConfig => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-enum-comparison
      if (state === 'leave') {
        return {
          precision: 0.005,
          duration: 120
        }
      }
      return {
        precision: 0.005
      }
    }
  } satisfies UseTransitionProps<DiagramNode>)

  return nodeTransitions((springs, node, { key, ctrl }) => {
    const Shape = nodeShape(node)
    return (
      <Shape
        key={key}
        node={node}
        theme={theme}
        springs={springs}
        {...nodeListeners({
          node,
          ctrl,
          onNodeClick
        })}
      />
    )
  })
}
