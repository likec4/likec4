import type { SpringConfig, UseTransitionProps } from '@react-spring/konva'
import { useTransition } from '@react-spring/konva'
import { CompoundShape } from './shapes/Compound'
import type { NodeSprings } from './springs'
import { nodeSprings } from './springs'
import type { DiagramNode, DiagramView, LikeC4Theme, OnNodeClick } from './types'

const isCompound = (node: DiagramNode) => {
  return node.children.length > 0
}

type CompoundsProps = {
  animate: boolean
  diagram: DiagramView
  theme: LikeC4Theme
  onNodeClick?: OnNodeClick | undefined
}

const keyOf = (node: DiagramNode) => node.id

export function Compounds({ animate, theme, diagram, onNodeClick }: CompoundsProps) {
  const nodes = diagram.nodes.filter(isCompound)
  const compoundTransitions = useTransition(nodes, {
    initial: nodeSprings(),
    from: nodeSprings({
      opacity: 0.45,
      scale: 0.8
    }) as unknown as NodeSprings, // cast to NodeSprings, type infer useTransition does not work correctly
    enter: nodeSprings(),
    leave: nodeSprings({
      opacity: 0,
      scale: 0.6
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
          duration: 160
        }
      }
      return {
        precision: 0.005
      }
    }
  } satisfies UseTransitionProps<DiagramNode>)

  return compoundTransitions((springs, node) => (
    <CompoundShape
      id={node.id}
      node={node}
      theme={theme}
      springs={springs}
      onNodeClick={onNodeClick}
    />
  ))
}
