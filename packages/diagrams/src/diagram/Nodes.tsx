import type { Fqn } from '@likec4/core'
import { nonexhaustive } from '@likec4/core'
import { isEqualSimple } from '@react-hookz/deep-equal/esnext'
import type { ControllerUpdate, UseTransitionProps } from '@react-spring/konva'
import { useTransition } from '@react-spring/konva'
import { memo, useRef } from 'react'
import { AnimatedGroup } from '../konva'
import { Portal } from '../konva-portal'
import { ZoomInIcon } from './icons'
import type { ShapeComponent } from './shapes'
import { CylinderShape, MobileShape, PersonShape, QueueShape, RectangleShape } from './shapes'
import { BrowserShape } from './shapes/Browser'
import { CompoundShape } from './shapes/Compound'
import { mouseDefault, mousePointer } from './shapes/utils'
import type { NodeSprings, NodeSpringsCtrl } from './springs'
import { isCompound, useNodeSpringsFn } from './springs'
import { DiagramGesture, useHoveredEdge, useHoveredNodeId, useSetHoveredNode } from './state'
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
  const [hoveredEdge] = useHoveredEdge()
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
      const isInactive =
        animate && hoveredEdge && hoveredEdge.source !== node.id && hoveredEdge.target !== node.id
      const scale = animate && !isCompound(node) && hoveredNodeId === node.id ? 1.08 : 1
      return {
        ...nodeSprings(node),
        opacity: isInactive ? 0.3 : 1,
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
    <NodeShape
      key={key}
      animate={animate}
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
  animate: boolean
  node: DiagramNode
  theme: DiagramTheme
  ctrl: NodeSpringsCtrl
  isHovered: boolean
  expired: boolean | undefined
  onNodeClick?: OnNodeClick | undefined
}

const NodeShape = memo<NodeShapeProps>(
  ({ animate, node, ctrl, theme, isHovered, expired, onNodeClick }) => {
    const setHoveredNode = useSetHoveredNode()

    const _isCompound = isCompound(node)
    const isNavigatable = animate && !!node.navigateTo && !!onNodeClick

    const Shape = nodeShape(node)

    const springs = ctrl.springs

    let zoomInIconY: number
    switch (node.shape) {
      case 'browser':
      case 'mobile':
        zoomInIconY = node.size.height - 20
        break
      default:
        zoomInIconY = node.size.height - 16
    }

    return (
      <Portal selector='.top' enabled={isHovered && !_isCompound}>
        <AnimatedGroup
          name={node.id}
          visible={expired !== true}
          onPointerEnter={e => {
            setHoveredNode(node)
            if (isNavigatable) {
              mousePointer(e)
            }
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
          {_isCompound && (
            <>
              <CompoundShape
                node={node}
                theme={theme}
                springs={springs}
                labelOffsetX={isNavigatable ? -18 : 0}
              />
              {isNavigatable && <ZoomInIcon opacity={0.9} size={18} x={18} y={22} />}
            </>
          )}
          {!_isCompound && (
            <>
              <Shape node={node} theme={theme} springs={springs} isHovered={isHovered} />
              {isNavigatable && <ZoomInIcon size={16} x={node.size.width / 2} y={zoomInIconY} />}
            </>
          )}
        </AnimatedGroup>
      </Portal>
    )
  },
  isEqualSimple
)
NodeShape.displayName = 'NodeShape'
