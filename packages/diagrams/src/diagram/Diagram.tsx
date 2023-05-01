/* eslint-disable @typescript-eslint/prefer-ts-expect-error */
/* eslint-disable @typescript-eslint/ban-ts-comment */
import type { DiagramEdge, DiagramNode, DiagramView } from '@likec4/core/types'
import {
  useSpring,
  useTransition
} from '@react-spring/konva'
import type Konva from 'konva'
import { clamp } from 'rambdax'
import { useCallback, useMemo, useRef, type ReactElement, useEffect } from 'react'
import { AnimatedStage, Layer } from '../konva'
import { CompoundShape, EdgeShape, nodeShape } from './shapes'
import { nodeListeners } from './shapes/nodeEvents'
import { interpolateNodeSprings } from './shapes/nodeSprings'
import type { OnNodeClick, OnPointerEvent, OnStageClick } from './shapes/types'
import { mouseDefault, mousePointer } from './shapes/utils'
import { DefaultDiagramTheme } from './theme'
import type { DiagramPaddings } from './types'

interface IRect {
  x: number
  y: number
  width: number
  height: number
}

function nodeState(overrides: {
  opacity?: number
  scale?: number
} = {}) {
  const transition = (node: DiagramNode) => ({
    opacity: overrides.opacity ?? 1,
    scale: overrides.scale ?? 1,
    x: node.position[0],
    y: node.position[1],
    width: node.size.width,
    height: node.size.height,
  })
  type NodeState = ReturnType<typeof transition>
  return (transition as unknown) as NodeState
}

export interface DiagramProps extends
  Pick<
    React.HTMLAttributes<HTMLDivElement>,
    'className' | 'role' | 'style' | 'tabIndex' | 'title'
  > {
  diagram: DiagramView
  interactive?: boolean
  animate?: boolean
  pannable?: boolean
  zoomable?: boolean

  initialStagePosition?: {
    x: number
    y: number
    scale: number
  }
  width?: number
  height?: number
  padding?: DiagramPaddings | undefined
  onNodeClick?: OnNodeClick | undefined
  onStageClick?: OnStageClick | undefined
  onEdgeClick?: ((edge: DiagramEdge) => void) | undefined
}

const isCompound = (node: DiagramNode) => node.children.length > 0
const isNotCompound = (node: DiagramNode) => node.children.length == 0

export function Diagram({
  diagram,
  interactive = true,
  padding = 0,
  initialStagePosition,
  onNodeClick,
  onEdgeClick,
  onStageClick,
  ...diagramprops
}: DiagramProps): ReactElement<DiagramProps> {
  const {
    pannable = interactive,
    zoomable = interactive,
    animate = interactive,
    width = diagram.width,
    height = diagram.height,
    ...stageprops
  } = diagramprops

  const id = diagram.id
  const theme = DefaultDiagramTheme

  const viewRect = {
    width,
    height,
  }
  const viewRectRef = useRef(viewRect)
  viewRectRef.current = viewRect

  const stageRef = useRef<Konva.Stage>(null)

  const centerOnRect = (rect: IRect) => {
    const [paddingTop, paddingRight, paddingBottom, paddingLeft] = Array.isArray(padding)
      ? padding
      : ([padding, padding, padding, padding] as const)
    const container = stageRef.current?.container()

    const // Add padding to make a larger rect - this is what we want to fill
      centerTo = {
        x: rect.x, // + rect.width /2,
        y: rect.y, // + rect.height /2,
        width: rect.width,
        height: rect.height
      },
      // Get the space we can see in the web page = size of div containing stage
      // or stage size, whichever is the smaller
      viewport = {
        width: Math.min(container?.clientWidth ?? width, width) - paddingLeft - paddingRight,
        height: Math.min(container?.clientHeight ?? height, height) - paddingTop - paddingBottom
      },
      // Get the ratios of target shape v's view space widths and heights
      // decide on best scale to fit longest side of shape into view
      viewScale = Math.min(
        viewport.width / centerTo.width,
        viewport.height / centerTo.height
      ),
      scale = clamp(0.1, 1, viewScale),
      // calculate the final adjustments needed to make
      // the shape centered in the view
      centeringAjustment = {
        x: ((width - centerTo.width) * scale + viewport.width) / 2,
        y: ((height - centerTo.height) * scale + viewport.height) / 2
      },
      // and the final position is...
      finalPosition = {
        x: Math.ceil(paddingLeft + centeringAjustment.x - (centerTo.x * scale)),
        y: Math.ceil(paddingTop + centeringAjustment.y - (centerTo.y * scale)),
      }
    return {
      ...finalPosition,
      scale
    }
  }

  const centerAndFitDiagram = () => {
    // const nodes = diagram.nodes
    // if (nodes.length === 0) return
    // const boundingRect = [Infinity, Infinity, -Infinity, -Infinity] as [
    //   minX: number,
    //   minY: number,
    //   maxX: number,
    //   maxY: number
    // ]
    // for (const node of nodes) {
    //   const { position: [x, y], size: { width, height } } = node
    //   boundingRect[0] = Math.min(boundingRect[0], x)
    //   boundingRect[1] = Math.min(boundingRect[1], y)
    //   boundingRect[2] = Math.max(boundingRect[2], x + width)
    //   boundingRect[3] = Math.max(boundingRect[3], y + height)
    // }
    // return centerOnRect({
    //   x: boundingRect[0],
    //   y: boundingRect[1],
    //   width: boundingRect[2] - boundingRect[0],
    //   height: boundingRect[3] - boundingRect[1]
    // })
    return centerOnRect({
      x: 0,
      y: 0,
      width: diagram.width,
      height: diagram.height
    })
  }

  const [stageProps, stageSpringApi] = useSpring(() => ({
    from: initialStagePosition ?? centerAndFitDiagram()
  }))

  useEffect(() => {
    stageSpringApi.stop(true).start({
      to: centerAndFitDiagram()
    })
  }, [id, width, height, diagram.width, diagram.height])

  const panning = useMemo(() => {
    if (!pannable) {
      return {
        draggable: false
      }
    }
    return {
      draggable: true,
      dragDistance: 5,
      onDragStart: (e: Konva.KonvaEventObject<DragEvent>) => {
        if (e.target === stageRef.current) {
          e.cancelBubble = true
          // stageSpringApi.pause(['x', 'y'])
        }
      },
      onDragMove: (e: Konva.KonvaEventObject<DragEvent>) => {
        if (e.target === stageRef.current) {
          stageSpringApi.set({
            x: e.target.x(),
            y: e.target.y()
          })
        }
      },
      onDragEnd: (e: Konva.KonvaEventObject<DragEvent>) => {
        if (e.target === stageRef.current) {
          e.cancelBubble = true
          stageSpringApi.start({
            to: {
              x: e.target.x(),
              y: e.target.y()
            },
            immediate: true
          })
        }
      }
    }
  }, [pannable, stageSpringApi])

  const handleWheelZoom = useCallback(
    (e: Konva.KonvaEventObject<WheelEvent>) => {
      const pointer = e.target.getStage()?.getPointerPosition()
      if (!pointer || Math.abs(e.evt.deltaY) < 3) {
        return
      }
      e.cancelBubble = true

      const zoomStep = Math.abs(e.evt.deltaY) < 20 ? 1.03 : 1.15

      let direction = e.evt.deltaY > 0 ? 1 : -1

      const oldScale = stageProps.scale.get()
      const stageX = stageProps.x.get()
      const stageY = stageProps.y.get()

      const mousePointTo = {
        x: (pointer.x - stageX) / oldScale,
        y: (pointer.y - stageY) / oldScale
      }

      // when we zoom on trackpad, e.evt.ctrlKey is true
      // in that case lets revert direction
      if (e.evt.ctrlKey) {
        direction = -direction
      }

      let newScale = direction > 0 ? oldScale * zoomStep : oldScale / zoomStep

      newScale = clamp(0.1, 1.6, newScale)

      stageSpringApi.start({
        to: {
          scale: newScale,
          x: pointer.x - mousePointTo.x * newScale,
          y: pointer.y - mousePointTo.y * newScale
        }
      })
    },
    [stageSpringApi]
  )


  const compoundTransitions = useTransition(diagram.nodes.filter(isCompound), {
    initial: nodeState(),
    from: nodeState({
      opacity: 0.5,
      scale: 0.8
    }),
    enter: {
      opacity: 1,
      scale: 1
    },
    leave: {
      opacity: 0,
      scale: 0.5,
    },
    update: nodeState(),
    expires: true,
    immediate: !animate,
    keys: g => g.id,
  })

  const edgeTransitions = useTransition(diagram.edges, {
    initial: {
      opacity: 1
    },
    from: {
      opacity: 0
    },
    enter: {
      opacity: 1
    },
    leave: {
      opacity: 0
    },
    exitBeforeEnter: true,
    expires: true,
    immediate: !animate,
    config: {
      duration: 150
    },
    keys: e => e.id + id
  })

  const nodeTransitions = useTransition(diagram.nodes.filter(isNotCompound), {
    initial: nodeState(),
    from: nodeState({
      opacity: 0.05,
      scale: 0.7
    }),
    enter: {
      opacity: 1,
      scale: 1
    },
    leave: {
      opacity: 0,
      scale: 0.5
    },
    update: node => ({
      x: node.position[0],
      y: node.position[1],
      width: node.size.width,
      height: node.size.height,
    }),
    expires: true,
    immediate: !animate,
    keys: node => (node.parent ? node.parent + '-' : '') + node.id + '-' + node.shape
  })
  return (
    // @ts-ignore
    <AnimatedStage
      ref={stageRef}
      onWheel={zoomable ? handleWheelZoom : undefined}
      width={width}
      height={height}
      offsetX={width / 2}
      offsetY={height / 2}
      x={stageProps.x}
      y={stageProps.y}
      scaleX={stageProps.scale}
      scaleY={stageProps.scale}
      onPointerClick={onStageClick ? (e) => {
        if (e.target.isDragging() || !stageRef.current) {
          return
        }
        if (e.target === stageRef.current || !onNodeClick) {
          e.cancelBubble = true
          onStageClick(stageRef.current, e)
        }
      } : undefined}
      {...panning}
      {...stageprops}
    >
      <Layer>
        {compoundTransitions((springs, node, { key }) => (
          <CompoundShape
            key={key}
            animate={animate}
            node={node}
            theme={theme}
            springs={interpolateNodeSprings(springs)}
            onNodeClick={onNodeClick}
          />
        ))}
        {edgeTransitions((springs, edge, { key }) => (
          <EdgeShape
            key={key}
            edge={edge}
            theme={theme}
            springs={springs}
            onPointerClick={onEdgeClick ? (e) => {
              e.cancelBubble = true
              onEdgeClick(edge)
            } : undefined}
            {...(onEdgeClick || interactive ? {
              onPointerEnter: (e: OnPointerEvent) => {
                mousePointer(e)
              },
              onPointerLeave: (e: OnPointerEvent) => {
                mouseDefault(e)
              }
            } : undefined)}
          />
        ))}
      </Layer>
      <Layer>
        {nodeTransitions((springs, node, { key, ctrl }) => {
          const Shape = nodeShape(node)
          return <Shape
            key={key}
            node={node}
            theme={theme}
            springs={interpolateNodeSprings(springs)}
            {...nodeListeners({
              node,
              ctrl,
              onNodeClick
            })}
          />
        })}
      </Layer>
    </AnimatedStage>
  )
}
