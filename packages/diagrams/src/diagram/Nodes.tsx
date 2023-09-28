import { nonexhaustive } from '@likec4/core'
import type { ControllerUpdate, UseTransitionProps } from '@react-spring/konva'
import { useTransition } from '@react-spring/konva'
import { useRef } from 'react'
import type { Fqn } from '..'
import { AnimatedGroup } from '../konva'
import { Portal } from '../konva-portal'
import type { ShapeComponent } from './shapes'
import { CylinderShape, MobileShape, PersonShape, QueueShape, RectangleShape } from './shapes'
import { BrowserShape } from './shapes/Browser'
import { CompoundShape } from './shapes/Compound'
import { mouseDefault, mousePointer } from './shapes/utils'
import type { NodeSprings, NodeSpringsCtrl } from './springs'
import { useNodeSpringsFn } from './springs'
import { DiagramGesture, useHoveredNodeId, useSetHoveredNode } from './state'
import type { DiagramNode, DiagramTheme, DiagramView, LikeC4Theme, OnNodeClick } from './types'

function nodeShape({ shape }: DiagramNode): ShapeComponent {
  switch (shape) {
    case 'cylinder':
    case 'storage': {
      return CylinderShape
    }
    case 'queue': {
      return QueueShape
    }
    case 'browser': {
      return BrowserShape
    }
    case 'person': {
      return PersonShape
    }
    case 'rectangle': {
      return RectangleShape
    }
    case 'mobile': {
      return MobileShape
    }
    default: {
      return nonexhaustive(shape)
    }
  }
}

const isCompound = (node: DiagramNode) => {
  return node.children.length > 0
}

type NodesProps = {
  animate: boolean
  diagram: DiagramView
  theme: LikeC4Theme
  onNodeClick?: OnNodeClick | undefined
}

const keyOf = (node: DiagramNode) => {
  const key = (node.parent ? node.parent + '-' : '') + node.id
  if (isCompound(node)) {
    return 'compound-' + key
  }
  return key
}

export function Nodes({ animate, theme, diagram, onNodeClick }: NodesProps) {
  const _prev = useRef(new Map<Fqn, DiagramNode>())
  const _last = useRef<DiagramView>(diagram)
  if (_last.current.id !== diagram.id) {
    _prev.current = new Map(_last.current.nodes.map(n => [n.id, n]))
  }
  _last.current = diagram

  const prevNodes = _prev.current
  const hoveredNodeId = useHoveredNodeId()
  const nodeSprings = useNodeSpringsFn(theme)

  const nodeTransitions = useTransition<DiagramNode, NodeSprings>(diagram.nodes, {
    initial: nodeSprings,
    from: ((node: DiagramNode) => {
      const prevNode = prevNodes.get(node.id)
      if (prevNode) {
        return nodeSprings(prevNode)
      }
      return {
        ...nodeSprings(node),
        opacity: 0,
        scaleX: isCompound(node) ? 0.85 : 0.6,
        scaleY: isCompound(node) ? 0.85 : 0.6
      }
    }) as unknown as NodeSprings,
    enter: node => {
      const isReplacing = prevNodes.has(node.id)
      return {
        ...nodeSprings(node),
        delay: isReplacing ? 50 : 70
      }
    },
    // update: nodeSprings(),
    update: node => {
      const scale = !isCompound(node) && hoveredNodeId === node.id ? 1.08 : 1
      return {
        ...nodeSprings(node),
        scaleX: scale,
        scaleY: scale
      }
    },
    leave: (node): ControllerUpdate<NodeSprings, DiagramNode> => {
      const replacedWith = diagram.nodes.find(n => n.id === node.id)
      if (replacedWith && keyOf(node) !== keyOf(replacedWith)) {
        return {
          opacity: 0,
          immediate: true
        }
      }
      return {
        opacity: 0,
        scaleX: isCompound(node) ? 0.7 : 0.5,
        scaleY: isCompound(node) ? 0.7 : 0.5,
        config: {
          duration: 120
        }
      }
    },
    sort: (a, b) => {
      if (isCompound(a) === isCompound(b)) {
        return a.level - b.level
      }
      return isCompound(a) ? -1 : 1
    },
    expires: true,
    immediate: !animate,
    keys: keyOf
  } satisfies UseTransitionProps<DiagramNode>)

  return nodeTransitions((_, node, { key, ctrl, expired }) => (
    <NodeSnape
      key={key}
      node={node}
      theme={theme}
      ctrl={ctrl}
      expired={expired}
      onNodeClick={onNodeClick}
      isHovered={node.id === hoveredNodeId}
    />
  ))
}

type NodeShapeProps = {
  node: DiagramNode
  theme: DiagramTheme
  ctrl: NodeSpringsCtrl
  isHovered: boolean
  expired: boolean | undefined
  onNodeClick?: OnNodeClick | undefined
}

const NodeSnape = ({ node, ctrl, theme, isHovered, expired, onNodeClick }: NodeShapeProps) => {
  const setHoveredNode = useSetHoveredNode()

  const Shape = isCompound(node) ? CompoundShape : nodeShape(node)

  const springs = ctrl.springs

  return (
    <Portal selector='.top' enabled={isHovered && !isCompound(node)}>
      <AnimatedGroup
        name={node.id}
        visible={expired !== true}
        onPointerEnter={e => {
          setHoveredNode(node)
          onNodeClick && mousePointer(e)
        }}
        onPointerLeave={e => {
          setHoveredNode(null)
          mouseDefault(e)
        }}
        {...(onNodeClick && {
          onPointerClick: e => {
            if (DiagramGesture.isDragging || e.evt.button !== 0) {
              return
            }
            e.cancelBubble = true
            onNodeClick(node, e)
          }
        })}
        x={springs.x}
        y={springs.y}
        offsetX={springs.offsetX}
        offsetY={springs.offsetY}
        width={springs.width}
        height={springs.height}
        scaleX={springs.scaleX}
        scaleY={springs.scaleY}
        opacity={springs.opacity}
      >
        <Shape node={node} theme={theme} springs={springs} isHovered={isHovered} />
      </AnimatedGroup>
    </Portal>
  )
}
