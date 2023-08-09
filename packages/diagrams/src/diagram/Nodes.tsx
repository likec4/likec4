import { useTransition } from '@react-spring/konva'
import { nodeListeners } from './shapes/nodeEvents'
import { nodeShape } from './shapes/nodeShape'
import type { NodeSprings } from './springs'
import { nodeSprings } from './springs'
import type { DiagramNode, LikeC4Theme, DiagramView, OnNodeClick } from './types'

const hasNoChildren = (node: DiagramNode) => {
  return node.children.length <= 0
}

type NodesProps = {
  animate: boolean
  diagram: DiagramView
  theme: LikeC4Theme
  onNodeClick?: OnNodeClick | undefined
}

export function Nodes({ animate, theme, diagram, onNodeClick }: NodesProps) {
  const nodeTransitions = useTransition(diagram.nodes.filter(hasNoChildren), {
    initial: nodeSprings(),
    from: nodeSprings({
      opacity: 0.55,
      scale: 0.6
    }) as unknown as NodeSprings,
    enter: nodeSprings(),
    leave: {
      opacity: 0,
      scaleX: 0.4,
      scaleY: 0.4
    },
    update: nodeSprings(),
    expires: true,
    immediate: !animate,
    keys: node => (node.parent ? node.parent + '-' : '') + node.id + '-' + node.shape,
    config: (_node, _index, state) => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-enum-comparison
      if (state === 'leave') {
        return {
          duration: 130
        }
      }
      return {}
    }
  })
  return nodeTransitions((springs, node, { ctrl }) => {
    const Shape = nodeShape(node)
    return (
      <Shape
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
