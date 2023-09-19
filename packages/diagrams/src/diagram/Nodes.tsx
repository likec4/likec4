import type { SpringConfig, UseTransitionProps } from '@react-spring/konva'
import { useTransition } from '@react-spring/konva'
import { AnimatedGroup } from '../konva'
import { nodeShape } from './shapes/nodeShape'
import { mouseDefault, mousePointer } from './shapes/utils'
import type { NodeSprings, NodeSpringsCtrl } from './springs'
import { nodeSprings } from './springs'
import { DiagramGesture, useHoveredNodeId, useSetHoveredNode } from './state'
import type { DiagramNode, DiagramTheme, DiagramView, LikeC4Theme, OnNodeClick } from './types'

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

  const hoveredNodeId = useHoveredNodeId()

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
    update: (node: DiagramNode, _index) => {
      return nodeSprings({
        scale: onNodeClick && hoveredNodeId === node.id ? 1.08 : 1
      })(node, _index)
    },
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

  return nodeTransitions((_, node, { key, ctrl }) => (
    <NodeSnape
      key={key}
      node={node}
      theme={theme}
      ctrl={ctrl}
      onNodeClick={onNodeClick}
      isHovered={hoveredNodeId === node.id}
    />
  ))
}

type NodeShapeProps = {
  node: DiagramNode
  theme: DiagramTheme
  ctrl: NodeSpringsCtrl
  isHovered: boolean
  onNodeClick?: OnNodeClick | undefined
}

const NodeSnape = ({ node, ctrl, theme, isHovered, onNodeClick }: NodeShapeProps) => {
  const setHoveredNode = useSetHoveredNode()
  const Shape = nodeShape(node)

  // const offsetX = Math.round(node.size.width / 2)
  // const offsetY = Math.round(node.size.height / 2)
  // const hoveredOffset = 4
  // const hoveredSprings = useSpring({
  //   to: isHovered
  //     ? {
  //         x: -hoveredOffset,
  //         y: -hoveredOffset,
  //         width: node.size.width + 2 * hoveredOffset,
  //         height: node.size.height + 2 * hoveredOffset,
  //         opacity: 0.3
  //       }
  //     : {
  //         x: 0,
  //         y: 0,
  //         ...node.size,
  //         opacity: 0
  //       }
  // })

  return (
    <AnimatedGroup
      onPointerEnter={e => {
        setHoveredNode(node)
        onNodeClick && mousePointer(e)
      }}
      onPointerLeave={e => {
        setHoveredNode(null)
        mouseDefault(e)
      }}
      name={node.id}
      {...(onNodeClick && {
        onPointerClick: e => {
          if (DiagramGesture.isDragging || e.evt.button !== 0) {
            return
          }
          e.cancelBubble = true
          onNodeClick(node, e)
        }
      })}
      {...ctrl.springs}
    >
      {/* <AnimatedRect
        {...hoveredSprings}
        cornerRadius={6}
        visible={hoveredSprings.opacity.to(v => v > 0.1)}
        fill={hoveredFill}
        globalCompositeOperation={'hard-light'}
        stroke={'#000'}
        strokeScaleEnabled={false}
        strokeWidth={2}
      /> */}
      {/* <AnimatedRect
      {...hoveredSprings}
        cornerRadius={6}
        fill={theme.colors['green'].fill}
        perfectDrawEnabled={false}
        strokeEnabled={false}
        scaleX={scale}
        scaleY={scale}
        visible={scale.to(v => v > 0.8)}
        // shadowForStrokeEnabled={false}
        // stroke={rectProps.fill}
        // strokeScaleEnabled={false}
        // strokeWidth={1}
        // hitStrokeWidth={25}
      /> */}
      <Shape node={node} theme={theme} springs={ctrl.springs} isHovered={isHovered} />

      {/*


        <Text
          x={8}
          y={node.size.height}
          offsetY={20}
          fill={theme.colors[node.color].loContrast}
          strokeEnabled={true}
          fontFamily={theme.font}
          fillEnabled={true}
          fontSize={11}
          text={'Open Source'}
        />
        <Rect x={8} y={node.size.height} fill={theme.colors[node.color].loContrast}/> */}
    </AnimatedGroup>
  )
}
