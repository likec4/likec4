import type { Fqn } from '@likec4/core'
import { nonexhaustive } from '@likec4/core'
import { isEqualSimple } from '@react-hookz/deep-equal/esnext'
import { useToggle } from '@react-hookz/web/esm'
import type { ControllerUpdate, UseTransitionProps } from '@react-spring/konva'
import { useSpring, useTransition } from '@react-spring/konva'
import { lighten, mix, toHex } from 'khroma'
import { memo, useRef } from 'react'
import { Group } from 'react-konva'
import { AnimatedCircle, AnimatedGroup, Rect } from '../konva'
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

    return (
      <Portal selector='.top' enabled={isHovered && !_isCompound}>
        <AnimatedGroup
          name={node.id}
          visible={expired !== true}
          {...(animate && {
            onPointerEnter: _ => {
              setHoveredNode(node)
            },
            onPointerLeave: e => {
              setHoveredNode(null)
              mouseDefault(e)
            }
          })}
          {...(onNodeClick && {
            onPointerClick: e => {
              if (DiagramGesture.isDragging || e.evt.button !== 0) {
                return
              }
              e.cancelBubble = true
              // Navigation handled by NodeZoomBtn
              if (!isNavigatable) {
                onNodeClick(node, e)
              }
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
                labelOffsetX={isNavigatable ? -22 : 0}
              />
              {isNavigatable && (
                <>
                  <Rect
                    x={0}
                    y={0}
                    width={node.size.width}
                    height={Math.min(node.size.height, 150)}
                    perfectDrawEnabled={false}
                  />
                  <CompoundZoomBtn
                    animate={animate}
                    node={node}
                    ctrl={ctrl}
                    theme={theme}
                    isHovered={isHovered}
                    onNodeClick={onNodeClick}
                  />
                </>
              )}
            </>
          )}
          {!_isCompound && (
            <>
              <Shape node={node} theme={theme} springs={springs} isHovered={isHovered} />
              {isNavigatable && (
                <NodeZoomBtn
                  animate={animate}
                  node={node}
                  ctrl={ctrl}
                  theme={theme}
                  isHovered={isHovered}
                  onNodeClick={onNodeClick}
                />
              )}
            </>
          )}
        </AnimatedGroup>
      </Portal>
    )
  },
  isEqualSimple
)
NodeShape.displayName = 'NodeShape'

type NodeZoomBtn = {
  animate: boolean
  node: DiagramNode
  theme: DiagramTheme
  ctrl: NodeSpringsCtrl
  isHovered: boolean
  onNodeClick: OnNodeClick
}

const NodeZoomBtn = ({ animate, node, theme, isHovered: _isHovered, onNodeClick }: NodeZoomBtn) => {
  const size = 30
  const halfSize = size / 2
  const colors = theme.elements[node.color]
  let zoomInIconY: number
  switch (node.shape) {
    case 'browser':
    case 'mobile':
      zoomInIconY = node.size.height - 20
      break
    default:
      zoomInIconY = node.size.height - 16
  }
  const fill = toHex(mix(colors.fill, colors.stroke, 65))
  const onOver = toHex(mix(colors.fill, colors.stroke, 75))
  const [isOver, toggleOver] = useToggle(false)
  const isHovered = _isHovered || isOver
  const props = useSpring({
    to: {
      fill: isOver ? onOver : fill,
      opacity: isOver ? 1 : 0,
      y: zoomInIconY + (isOver ? 2 : 0),
      scale: isOver ? 1.38 : 1,
      // shadowBlur: isOver ? 6 : 4,
      shadowOpacity: isOver ? 0.3 : 0.15
      // shadowOffsetY: isOver ? 8 : 6
    },
    delay: isHovered && !isOver ? 100 : 0,
    immediate: !animate
  })
  return (
    <AnimatedGroup
      x={node.size.width / 2}
      y={props.y}
      offsetX={halfSize}
      offsetY={halfSize}
      scaleX={props.scale}
      scaleY={props.scale}
      width={size}
      height={size}
      onPointerEnter={e => {
        toggleOver(true)
        mousePointer(e)
      }}
      onPointerLeave={e => {
        toggleOver(false)
        mouseDefault(e)
      }}
      onPointerClick={e => {
        if (DiagramGesture.isDragging || e.evt.button !== 0) {
          return
        }
        e.cancelBubble = true
        onNodeClick(node, e)
      }}
    >
      <AnimatedCircle
        x={halfSize}
        y={halfSize}
        radius={halfSize}
        fill={props.fill}
        shadowBlur={4}
        shadowOpacity={props.shadowOpacity}
        shadowOffsetX={2}
        shadowOffsetY={6}
        shadowColor={theme.shadow}
        shadowEnabled={isHovered}
        perfectDrawEnabled={false}
        opacity={props.opacity}
        hitStrokeWidth={halfSize}
      />
      <ZoomInIcon size={16} x={halfSize} y={halfSize} />
    </AnimatedGroup>
  )
}

const CompoundZoomBtn = ({
  animate,
  node,
  theme,
  ctrl,
  isHovered: _isHovered,
  onNodeClick
}: NodeZoomBtn) => {
  const size = 28
  const [isOver, toggleOver] = useToggle(false)
  const halfSize = size / 2
  const fill = toHex(lighten(ctrl.springs.fill.get(), 10))
  const isHovered = _isHovered || isOver
  const props = useSpring({
    to: {
      opacity: isOver ? 1 : 0,
      x: halfSize + 4 - (isOver ? 4 : 0),
      y: halfSize + 6 - (isOver ? 4 : 0),
      scale: isOver ? 1.35 : 1,
      // shadowBlur: isOver ? 6 : 4,
      shadowOpacity: isOver ? 0.3 : 0.15
      // shadowOffsetY: isOver ? 8 : 6
    },
    delay: isHovered && !isOver ? 100 : 0,
    // delay: isOver ? 150 : (isHovered ? 70 : 0),
    immediate: !animate
  })
  return (
    <Group
      onPointerEnter={e => {
        toggleOver(true)
        mousePointer(e)
      }}
      onPointerLeave={e => {
        toggleOver(false)
        mouseDefault(e)
      }}
      onPointerClick={e => {
        if (DiagramGesture.isDragging || e.evt.button !== 0) {
          return
        }
        e.cancelBubble = true
        onNodeClick(node, e)
      }}
    >
      <AnimatedGroup
        x={props.x}
        y={props.y}
        offsetX={halfSize}
        offsetY={halfSize}
        scaleX={props.scale}
        scaleY={props.scale}
        width={size}
        height={size}
      >
        <AnimatedCircle
          x={halfSize}
          y={halfSize}
          radius={halfSize}
          fill={fill}
          shadowBlur={4}
          shadowOpacity={props.shadowOpacity}
          shadowOffsetX={2}
          shadowOffsetY={6}
          shadowColor={theme.shadow}
          shadowEnabled={isHovered}
          perfectDrawEnabled={false}
          opacity={props.opacity}
          hitStrokeWidth={halfSize}
        />
        <ZoomInIcon size={16} x={halfSize} y={halfSize} />
      </AnimatedGroup>
    </Group>
  )
}
