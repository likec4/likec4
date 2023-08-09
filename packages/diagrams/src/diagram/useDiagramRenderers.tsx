import { partition } from 'rambdax'
import { useMemo } from 'react'
import type { DiagramNode, DiagramTheme, DiagramView, OnEdgeClick, OnNodeClick } from './types'
import type { NodeSprings } from './springs'
import { nodeSprings } from './springs'
import { useTransition } from '@react-spring/konva'
import { CompoundShape } from './shapes/Compound'
import { EdgeShape } from './shapes/Edge'
import { KonvaCore } from '../konva'
import type { OnPointerEvent } from './shapes/types'
import { mouseDefault, mousePointer } from './shapes/utils'
import { nodeShape } from './shapes/nodeShape'
import { nodeListeners } from './shapes/nodeEvents'

const isCompound = (node: DiagramNode) => {
  return node.children.length > 0
}

type Props = {
  animate: boolean
  diagram: DiagramView
  theme: DiagramTheme
  onNodeClick?: OnNodeClick | undefined
  onEdgeClick?: OnEdgeClick | undefined
}

export const useDiagramRenderers = ({
  animate,
  theme,
  diagram: { id, nodes: diagramNodes, edges: _edges },
  onNodeClick,
  onEdgeClick
}: Props) => {
  const [_compounds, _nodes] = useMemo(() => partition(isCompound, diagramNodes), [diagramNodes])

  const compoundTransitions = useTransition(_compounds, {
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
    config: (_node, _item, state) => {
      if (state === 'leave') {
        return {
          duration: 150
        }
      }
      return {}
    }
  })
  const compounds = compoundTransitions((springs, node, { key }) => (
    <CompoundShape
      key={key}
      id={node.id}
      animate={animate}
      node={node}
      theme={theme}
      springs={springs}
      onNodeClick={onNodeClick}
    />
  ))

  const edgeTransitions = useTransition(_edges, {
    initial: {
      opacity: 1,
      width: 2
    },
    from: {
      opacity: 0,
      width: 2
    },
    enter: {
      opacity: 1
    },
    leave: {
      opacity: 0
    },
    expires: true,
    immediate: !animate,
    config: {
      duration: 150
    },
    // unique edge key, scoped to this diagram
    // to avoid any issues with diagram-to-diagram transitions
    keys: e => e.id + id
  })
  const edges = edgeTransitions((springs, edge, { ctrl }) => (
    <EdgeShape
      edge={edge}
      theme={theme}
      springs={springs}
      {...(onEdgeClick && {
        onPointerClick: e => {
          if (KonvaCore.isDragging()) {
            return
          }
          e.cancelBubble = true
          onEdgeClick(edge, e)
        },
        onPointerEnter: (e: OnPointerEvent) => {
          void ctrl.start({
            to: {
              width: 3
            },
            delay: 100
          })
          mousePointer(e)
        },
        onPointerLeave: (e: OnPointerEvent) => {
          void ctrl.start({
            to: {
              width: 2
            }
          })
          mouseDefault(e)
        }
      })}
    />
  ))

  const nodeTransitions = useTransition(_nodes, {
    initial: nodeSprings(),
    from: nodeSprings({
      opacity: 0.55,
      scale: 0.6
    }) as unknown as NodeSprings, // cast to NodeSprings, type infer useTransition does not work correctly
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
    config: (_node, _item, state) => {
      if (state === 'leave') {
        return {
          duration: 130
        }
      }
      return {}
    }
  })
  const nodes = nodeTransitions((springs, node, { ctrl }) => {
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

  return {
    compounds,
    edges,
    nodes
  }
}
