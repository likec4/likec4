/* eslint-disable @typescript-eslint/prefer-ts-expect-error */
/* eslint-disable @typescript-eslint/ban-ts-comment */
import type { DiagramEdge, DiagramNode, DiagramView } from '@likec4/core/types'
import { useDebouncedEffect, useSyncedRef, useThrottledEffect, useUpdateEffect } from '@react-hookz/web/esm'
import {
  config,
  useSpring,
  useSpringRef,
  useTransition,
} from '@react-spring/konva'
import { AnimatedStage, Layer } from '../konva'
import type Konva from 'konva'
import { clamp } from 'rambdax'
import { useCallback, useMemo, type ReactElement, useRef } from 'react'
import { CompoundShape, EdgeShape, nodeShape } from './shapes'
import { interpolateNodeSprings } from './shapes/nodeSprings'
import { DefaultDiagramTheme } from './theme'
import type { DiagramPaddings } from './types'
import { mouseDefault, mousePointer } from './shapes/utils'
import { nodeListeners } from './shapes/nodeEvents'

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

export interface DiagramProps {
  diagram: DiagramView
  className?: string | undefined
  interactive?: boolean
  animate?: boolean
  pannable?: boolean
  zoomable?: boolean
  width?: number
  height?: number
  padding?: DiagramPaddings | undefined
  onNodeClick?: ((node: DiagramNode) => void) | undefined
  onEdgeClick?: ((edge: DiagramEdge) => void) | undefined
}

const isCompound = (node: DiagramNode) => node.children.length > 0
const isNotCompound = (node: DiagramNode) => node.children.length == 0

export function Diagram({
  diagram,
  className,
  interactive = true,
  padding = 0,
  onNodeClick,
  onEdgeClick,
  ...props
}: DiagramProps): ReactElement<DiagramProps> {
  const { pannable = interactive, zoomable = interactive, animate = interactive } = props

  const id = diagram.id
  const theme = DefaultDiagramTheme

  const width = Math.max(props.width ?? diagram.width, 16)
  const height = Math.max(props.height ?? diagram.height, 16)

  const viewRect = {
    width,
    height,
  }
  const viewRectRef = useRef(viewRect)
  viewRectRef.current = viewRect

  // const stageRef = useRef<Konva.Stage>(null)
  const stageSpringApi = useSpringRef<{
    x: number
    y: number
    scale: number
  }>()

  const centerOnRect = (rect: IRect) => {
    const [paddingTop, paddingRight, paddingBottom, paddingLeft] = Array.isArray(padding)
      ? padding
      : ([padding, padding, padding, padding] as const)
    // const stage = stageRef.current
    // const container = stage?.container()

    // Get the space we can see in the web page = size of div containing stage
    // or stage size, whichever is the smaller
    const viewRect = viewRectRef.current
    // const viewRect = {
    //   width,
    //   height
    // }
    // if (stage && container) {
    //   viewRect.width = Math.min(container.clientWidth, stage.width())
    //   viewRect.height = Math.min(container.clientHeight, stage.height())
    // }

    const // Add padding to make a larger rect - this is what we want to fill
      centerTo = {
        x: rect.x - paddingLeft,
        y: rect.y - paddingTop,
        width: rect.width + paddingLeft + paddingRight,
        height: rect.height + paddingTop + paddingBottom
      },
      // Get the ratios of target shape v's view space widths and heights
      // decide on best scale to fit longest side of shape into view
      viewScale = Math.min(viewRect.width / centerTo.width, viewRect.height / centerTo.height),
      scale = clamp(0.1, 1.05, viewScale),
      // calculate the final adjustments needed to make
      // the shape centered in the view
      centeringAjustment = {
        x: (viewRect.width - centerTo.width * scale) / 2,
        y: (viewRect.height - centerTo.height * scale) / 2
      }
    // and the final position is...
    // finalPosition = {
    //   x: Math.ceil(centeringAjustment.x + -centerTo.x * scale),
    //   y: Math.ceil(centeringAjustment.y + -centerTo.y * scale)
    // }
    return {
      x: Math.ceil(centeringAjustment.x + -centerTo.x * scale),
      y: Math.ceil(centeringAjustment.y + -centerTo.y * scale),
      scale
    }
  }

  const [stageProps,] = useSpring(() => ({
    ref: stageSpringApi,
    from: centerOnRect({
      x: 0,
      y: 0,
      width: diagram.width,
      height: diagram.height
    })
  }))

  useUpdateEffect(() => {
    stageSpringApi.stop(true).start({
      to: centerOnRect({
        x: 0,
        y: 0,
        width: diagram.width,
        height: diagram.height
      })
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
      onDragStart: (_e: Konva.KonvaEventObject<DragEvent>) => {
        stageSpringApi.stop(true, ['x', 'y'])
      },
      onDragEnd: ({ target }: Konva.KonvaEventObject<DragEvent>) => {
        // if (target === stageRef.current) {
        stageSpringApi.start({
          to: {
            x: target.x(),
            y: target.y()
          },
          immediate: true
        })
        // }
      }
    }
  }, [pannable, stageSpringApi])

  const handleWheelZoom = useCallback(
    (e: Konva.KonvaEventObject<WheelEvent>) => {
      const stage = e.target.getStage()
      const pointer = stage?.getPointerPosition()

      if (!stage || !pointer || Math.abs(e.evt.deltaY) < 10) {
        return
      }

      const zoomStep = Math.abs(e.evt.deltaY) < 50 ? 1.1 : 1.7

      let direction = e.evt.deltaY > 0 ? 1 : -1

      // // stop default scrolling
      // e.evt.preventDefault()
      // e.cancelBubble = true

      const oldScale = stage.scaleX()

      const mousePointTo = {
        x: (pointer.x - stage.x()) / oldScale,
        y: (pointer.y - stage.y()) / oldScale
      }

      // when we zoom on trackpad, e.evt.ctrlKey is true
      // in that case lets revert direction
      if (e.evt.ctrlKey) {
        direction = -direction
      }

      let newScale = direction > 0 ? oldScale * zoomStep : oldScale / zoomStep

      newScale = clamp(0.1, 1.6, newScale)

      stageSpringApi.stop(true).start({
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
    expires: false,
    immediate: !animate,
    keys: g => g.id,
  })

  const edgeTransitions = useTransition(diagram.edges, {
    initial: {
      opacity: 0.8
    },
    from: {
      opacity: 0
    },
    enter: {
      opacity: 0.8
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
    keys: node => (node.parent ?? '') + '-' + node.id + '-' + node.shape
  })

  return (
    // @ts-ignore
    <AnimatedStage
      className={className}
      onWheel={zoomable ? handleWheelZoom : undefined}
      width={width}
      height={height}
      x={stageProps.x}
      y={stageProps.y}
      scaleX={stageProps.scale}
      scaleY={stageProps.scale}
      {...panning}
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
        {edgeTransitions((springs, edge, { key, ctrl }) => (
          <EdgeShape
            key={key}
            edge={edge}
            theme={theme}
            springs={springs}
            onClick={e => {
              if (onEdgeClick) {
                e.cancelBubble = true
                onEdgeClick(edge)
              }
            }}
            onMouseEnter={e => {
              mousePointer(e)
              void ctrl.start({
                to: {
                  opacity: 1,
                },
                config: config.stiff
              })
            }}
            onMouseLeave={e => {
              mouseDefault(e)
              void ctrl.start({
                to: {
                  opacity: 0.8,
                },
                delay: 50,
                config: config.slow
              })
            }}
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
