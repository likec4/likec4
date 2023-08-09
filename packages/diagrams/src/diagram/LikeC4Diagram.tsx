import { nonNullable } from '@likec4/core/errors'
import type { DiagramNode } from '@likec4/core/types'
import { useSpring, useSpringRef, useTransition } from '@react-spring/konva'
import type Konva from 'konva'
import { clamp, partition, view } from 'rambdax'
import { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef } from 'react'
import { AnimatedStage, KonvaCore, Layer } from '../konva'
import { CompoundShape, EdgeShape, interpolateNodeSprings, nodeShape } from './shapes'
import { nodeListeners } from './shapes/nodeEvents'
import type { OnPointerEvent } from './shapes/types'
import { mouseDefault, mousePointer } from './shapes/utils'
import { nodeSprings, type NodeSprings } from './springs'
import DefaultDiagramTheme from './theme'
import type { DiagramPaddings, LikeC4DiagramApi, LikeC4DiagramProps } from './types'
import { useMultitouchHandlers } from './useMultitouchHandlers'
import { useZoomHandlers } from './useZoomHandlers'
import { useDiagramRenderers } from './useDiagramRenderers'

interface IRect {
  x: number
  y: number
  width: number
  height: number
}

const isCompound = (node: DiagramNode) => {
  return node.children.length > 0
}

const useSyncedRef = <T extends object>(value: T) => {
  const ref = useRef<Readonly<T>>(value)
  Object.assign(ref.current, value)
  return ref as {
    readonly current: Readonly<T>
  }
}

const NoPadding: DiagramPaddings = [0, 0, 0, 0]

export const LikeC4Diagram = /* @__PURE__ */ forwardRef<LikeC4DiagramApi, LikeC4DiagramProps>(
  (
    {
      diagram,
      padding: _padding = NoPadding,
      pannable = true,
      zoomable = true,
      animate = true,
      initialPosition,
      onEdgeClick,
      onNodeClick,
      onStageClick,
      width = diagram.width,
      height = diagram.height,
      ...props
    },
    ref
  ) => {
    const theme = DefaultDiagramTheme
    const id = diagram.id
    const stageRef = useRef<Konva.Stage>(null)

    // "pin" references
    const padding: DiagramPaddings = Array.isArray(_padding)
      ? _padding
      : [_padding, _padding, _padding, _padding]

    const whereToCenterOnRect = (centerTo: IRect) => {
      const [paddingTop, paddingRight, paddingBottom, paddingLeft] = padding
      const container = stageRef.current?.container()

      const // Get the space we can see in the web page = size of div containing stage
        // or stage size, whichever is the smaller
        // and Exclude padding
        viewRect = {
          width: Math.min(container?.clientWidth ?? width, width) - paddingLeft - paddingRight,
          height: Math.min(container?.clientHeight ?? height, height) - paddingTop - paddingBottom
        },
        // Get the ratios of target shape v's view space widths and heights
        // decide on best scale to fit longest side of shape into view
        viewScale = Math.min(viewRect.width / centerTo.width, viewRect.height / centerTo.height),
        scale = clamp(0.1, 1, viewScale),
        // calculate the final adjustments needed to make
        // the shape centered in the view
        centeringAjustment = {
          x: ((width - centerTo.width) * scale + viewRect.width) / 2,
          y: ((height - centerTo.height) * scale + viewRect.height) / 2
        },
        // and the final position is...
        finalPosition = {
          x: Math.ceil(paddingLeft + centeringAjustment.x - centerTo.x * scale),
          y: Math.ceil(paddingTop + centeringAjustment.y - centerTo.y * scale)
        }
      return {
        ...finalPosition,
        scale
      }
    }

    const whereToFitDiagram = () => whereToCenterOnRect(diagram.boundingBox)

    const [stageProps, stageSpringApi] = useSpring(() => ({
      from: initialPosition ?? whereToFitDiagram()
    }))

    const centerOnRect = (centerTo: IRect) => {
      stageSpringApi.stop(true).start({
        to: whereToCenterOnRect(centerTo)
      })
    }

    const centerAndFit = () => {
      stageSpringApi.stop(true).start({
        to: whereToFitDiagram()
      })
    }

    const refs = useSyncedRef({
      diagram,
      padding,
      width,
      height,
      centerOnRect,
      centerAndFit
    })

    useImperativeHandle(
      ref,
      () =>
        ({
          stage: () => nonNullable(stageRef.current),
          diagramView: () => refs.current.diagram,
          container: () => nonNullable(stageRef.current?.container()),
          resetStageZoom: (_immediate?: boolean) => {
            throw new Error('Not implemented')
          },
          centerOnNode: (node: DiagramNode): void => {
            refs.current.centerOnRect({
              x: node.position[0],
              y: node.position[1],
              width: node.size.width,
              height: node.size.height
            })
          },
          centerAndFit: () => refs.current.centerAndFit()
        }) satisfies LikeC4DiagramApi,
      [refs.current, stageRef]
    )

    useEffect(() => {
      const el = stageRef.current?.container()
      if (!el) return
      if (!pannable && !zoomable) {
        el.style.touchAction = 'none'
        return
      }
      el.style.touchAction = `${pannable ? 'pan-x pan-y ' : ''}${zoomable ? 'pinch-zoom' : ''}`
    }, [pannable, zoomable])

    useEffect(() => {
      centerAndFit()
    }, [id, height, width])

    // const [compounds, nodes] = useMemo(() => partition(isCompound, diagram.nodes), [diagram.nodes])

    // const compoundTransitions = useTransition(compounds, {
    //   initial: nodeSprings(),
    //   from: (nodeSprings({
    //     opacity: 0.55,
    //     scale: 0.75
    //   }) as unknown as NodeSprings), // cast to NodeSprings, type infer useTransition does not work correctly
    //   enter: {
    //     opacity: 1,
    //     scaleX: 1,
    //     scaleY: 1
    //   },
    //   leave: {
    //     opacity: 0,
    //     scaleX: 0.5,
    //     scaleY: 0.5
    //   },
    //   update: nodeSprings(),
    //   expires: true,
    //   immediate: !animate,
    //   keys: g => g.id,
    //   config: (_node, _item, state) => {
    //     if (state === 'leave') {
    //       return {
    //         duration: 150
    //       }
    //     }
    //     return {}
    //   }
    // })

    // const edgeTransitions = useTransition(diagram.edges, {
    //   initial: {
    //     opacity: 1,
    //     width: 2
    //   },
    //   from: {
    //     opacity: 0,
    //     width: 2
    //   },
    //   enter: {
    //     opacity: 1
    //   },
    //   leave: {
    //     opacity: 0
    //   },
    //   expires: true,
    //   immediate: !animate,
    //   config: {
    //     duration: 150
    //   },
    //   // unique edge key, scoped to this diagram
    //   // to avoid any issues with diagram-to-diagram transitions
    //   keys: e => e.id + id
    // })

    // const nodeTransitions = useTransition(nodes, {
    //   initial: nodeSprings(),
    //   from: (nodeSprings({
    //     opacity: 0.55,
    //     scale: 0.6
    //   }) as unknown as NodeSprings), // cast to NodeSprings, type infer useTransition does not work correctly
    //   enter: nodeSprings(),
    //   leave: {
    //     opacity: 0,
    //     scaleX: 0.4,
    //     scaleY: 0.4
    //   },
    //   update: nodeSprings(),
    //   expires: true,
    //   immediate: !animate,
    //   keys: node => (node.parent ? node.parent + '-' : '') + node.id + '-' + node.shape,
    //   config: (_node, _item, state) => {
    //     if (state === 'leave') {
    //       return {
    //         duration: 130
    //       }
    //     }
    //     return {}
    //   }
    // })

    const { compounds, edges, nodes } = useDiagramRenderers({
      diagram,
      animate,
      theme,
      onNodeClick,
      onEdgeClick
    })

    return (
      <AnimatedStage
        ref={stageRef}
        width={width}
        height={height}
        offsetX={width / 2}
        offsetY={height / 2}
        x={stageProps.x}
        y={stageProps.y}
        scaleX={stageProps.scale}
        scaleY={stageProps.scale}
        {...(onStageClick && {
          onPointerClick: e => {
            if (KonvaCore.isDragging() || !stageRef.current) {
              return
            }
            if (e.target === stageRef.current || !onNodeClick) {
              e.cancelBubble = true
              onStageClick(stageRef.current, e)
            }
          }
        })}
        {...useMultitouchHandlers(pannable, stageSpringApi)}
        {...useZoomHandlers(pannable, stageSpringApi)}
        {...props}
        // onPointerDblClick={e => {
        //   if (KonvaCore.isDragging() || !stageRef.current) {
        //     return
        //   }
        //   if (e.target === stageRef.current || !onNodeClick) {
        //     e.cancelBubble = true
        //     stageSpringApi.start({
        //       to: centerAndFitDiagram()
        //     })
        //   }
        // }}
      >
        <Layer>
          {compounds}
          {edges}
        </Layer>
        <Layer>{nodes}</Layer>
      </AnimatedStage>
    )
  }
)
LikeC4Diagram.displayName = 'LikeC4Diagram'
