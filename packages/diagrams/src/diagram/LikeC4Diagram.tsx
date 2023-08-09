/* eslint-disable @typescript-eslint/prefer-ts-expect-error */
/* eslint-disable @typescript-eslint/ban-ts-comment */
import { nonNullable } from '@likec4/core/errors'
import type { DiagramNode } from '@likec4/core/types'
import { useSpring, useTransition } from '@react-spring/konva'
import type Konva from 'konva'
import { clamp } from 'rambdax'
import { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef } from 'react'
import { AnimatedStage, KonvaCore, Layer } from '../konva'
import { CompoundShape, EdgeShape, nodeShape } from './shapes'
import { nodeListeners } from './shapes/nodeEvents'
import { interpolateNodeSprings } from './shapes/nodeSprings'
import type { OnPointerEvent } from './shapes/types'
import { mouseDefault, mousePointer } from './shapes/utils'
import { nodeSprings } from './springs'
import DefaultDiagramTheme from './theme'
import type { LikeC4DiagramApi, LikeC4DiagramProps } from './types'
import { useMultitouchHandlers } from './useMultitouchHandlers'
import { useZoomHandlers } from './useZoomHandlers'

interface IRect {
  x: number
  y: number
  width: number
  height: number
}

const isCompound = (node: DiagramNode) => {
  return node.children.length > 0
}

const isNotCompound = (node: DiagramNode) => {
  return node.children.length == 0
}

const useSyncedRef = <T extends object>(value: T) => {
  const ref = useRef<Readonly<T>>(value)
  Object.assign(ref.current, value)
  return ref as {
    readonly current: Readonly<T>
  }
}

export const LikeC4Diagram = /* @__PURE__ */ forwardRef<LikeC4DiagramApi, LikeC4DiagramProps>(
  (
    {
      diagram,
      padding: _padding = 0,
      pannable = true,
      zoomable = true,
      animate = true,
      initialPosition,
      onEdgeClick,
      onNodeClick,
      onStageClick,
      width: _width = diagram.width,
      height: _height = diagram.height,
      ...props
    },
    ref
  ) => {
    const theme = DefaultDiagramTheme
    const id = diagram.id
    const stageRef = useRef<Konva.Stage>(null)

    // "pin" references
    const padding = useMemo(
      () => {
        return Array.isArray(_padding)
          ? _padding
          : ([_padding, _padding, _padding, _padding] as const)
      },
      Array.isArray(_padding) ? _padding : [_padding]
    )

    const refs = useSyncedRef({
      diagram,
      padding,
      width: _width,
      height: _height
    })

    const whereToCenterOnRect = useCallback(
      (centerTo: IRect) => {
        const { padding, width, height } = refs.current
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
      },
      [refs, stageRef]
    )

    const whereToFitDiagram = useCallback(() => {
      return whereToCenterOnRect(refs.current.diagram.boundingBox)
    }, [whereToCenterOnRect, refs])

    const [stageProps, stageSpringApi] = useSpring(() => ({
      from: initialPosition ?? whereToFitDiagram()
    }))

    const centerOnRect = useCallback(
      (centerTo: IRect) => {
        stageSpringApi.stop(true).start({
          to: whereToCenterOnRect(centerTo)
        })
      },
      [stageSpringApi, whereToCenterOnRect]
    )

    const centerAndFit = useCallback(() => {
      stageSpringApi.stop(true).start({
        to: whereToFitDiagram()
      })
    }, [stageSpringApi, whereToFitDiagram])

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
            centerOnRect({
              x: node.position[0],
              y: node.position[1],
              width: node.size.width,
              height: node.size.height
            })
          },
          centerAndFit
        }) satisfies LikeC4DiagramApi,
      [refs, stageRef, centerAndFit, centerOnRect]
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
    }, [id, _height, _width])

    const compoundTransitions = useTransition(diagram.nodes.filter(isCompound), {
      initial: nodeSprings(),
      from: nodeSprings({
        opacity: 0.6,
        scale: 0.8
      }),
      enter: {
        opacity: 1,
        scale: 1
      },
      leave: {
        opacity: 0,
        scale: 0.5
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

    const edgeTransitions = useTransition(diagram.edges, {
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

    const nodeTransitions = useTransition(diagram.nodes.filter(isNotCompound), {
      initial: nodeSprings(),
      from: nodeSprings({
        opacity: 0.6,
        scale: 0.7
      }),
      enter: {
        opacity: 1,
        scale: 1
      },
      leave: {
        opacity: 0,
        scale: 0.4
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

    return (
      <AnimatedStage
        ref={stageRef}
        width={_width}
        height={_height}
        offsetX={_width / 2}
        offsetY={_height / 2}
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
          {compoundTransitions((springs, node, { key }) => (
            <CompoundShape
              key={key}
              id={node.id}
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
          ))}
        </Layer>
        <Layer>
          {nodeTransitions((springs, node, { key, ctrl }) => {
            const Shape = nodeShape(node)
            return (
              <Shape
                key={key}
                id={key}
                node={node}
                theme={theme}
                springs={interpolateNodeSprings(springs)}
                {...nodeListeners({
                  node,
                  ctrl,
                  onNodeClick
                })}
              />
            )
          })}
        </Layer>
      </AnimatedStage>
    )
  }
)
