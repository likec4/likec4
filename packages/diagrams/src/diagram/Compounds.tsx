import { useTransition } from '@react-spring/konva'
import { CompoundShape } from './shapes/Compound'
import type { NodeSprings } from './springs'
import { nodeSprings } from './springs'
import type { DiagramNode, LikeC4Theme, DiagramView, OnNodeClick } from './types'

const isCompound = (node: DiagramNode) => {
  return node.children.length > 0
}

type CompoundsProps = {
  animate: boolean
  diagram: DiagramView
  theme: LikeC4Theme
  onNodeClick?: OnNodeClick | undefined
}

export function Compounds({ animate, theme, diagram, onNodeClick }: CompoundsProps) {
  const compoundTransitions = useTransition(diagram.nodes.filter(isCompound), {
    initial: nodeSprings(),
    from: nodeSprings({
      opacity: 0.55,
      scale: 0.75
    }) as unknown as NodeSprings, // cast to NodeSprings, type infer useTransition does not work correctly
    enter: {
      opacity: 1,
      scaleX: 1,
      scaleY: 1
    },
    leave: {
      opacity: 0,
      scaleX: 0.5,
      scaleY: 0.5
    },
    update: nodeSprings(),
    expires: true,
    immediate: !animate,
    keys: g => g.id,
    config: (_node, _index, state) => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-enum-comparison
      if (state === 'leave') {
        return {
          duration: 150
        }
      }
      return {}
    }
  })

  return compoundTransitions((springs, node) => (
    <CompoundShape
      id={node.id}
      animate={animate}
      node={node}
      theme={theme}
      springs={springs}
      onNodeClick={onNodeClick}
    />
  ))
}
