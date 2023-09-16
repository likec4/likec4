import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react'
import { AnimatedGroup, AnimatedRect, AnimatedStage, KonvaCore, Layer } from '../konva'
import { nonNullable } from '@likec4/core'
import type { DiagramNode, NodeId } from '@likec4/core'
import { useSpring, useTransition } from '@react-spring/konva'
import type Konva from 'konva'
import { clamp } from 'rambdax'
import { Compounds } from './Compounds'
import { Edges } from './Edges'
import { Nodes } from './Nodes'
import { defaultTheme as theme } from '@likec4/core'
import type { DiagramPaddings, DiagramApi, DiagramProps } from './types'
import { useTouchHandlers } from './useTouchHandlers'
import { useMouseWheel } from './useMouseWheel'
import { useDrag } from '@use-gesture/react'
import { useHookableRef } from '@react-hookz/web/esm'

import { createUseGesture, dragAction, pinchAction, moveAction } from '@use-gesture/react'
import { Provider, useStore } from 'jotai'
import { DiagramGesture, setHoveredNode, useHoveredNode } from './state'
import type { NodeSprings } from './springs'
import { nodeSprings } from './springs'
import { scale } from 'khroma'
import { ExternalLink } from './icons'
import { NodeHover } from './NodeHover'

const useGesture = createUseGesture([dragAction, pinchAction])

interface IRect {
  x: number
  y: number
  width: number
  height: number
}

const useSyncedRef = <T extends object>(value: T) => {
  const ref = useRef<Readonly<T>>(value)
  Object.assign(ref.current, value)
  return ref as {
    readonly current: Readonly<T>
  }
}

const NoPadding = [0, 0, 0, 0] satisfies DiagramPaddings

/**
 * Returns NodeId of the DiagramNode that contains the given shape.
 */
function diagramNodeId(konvaNode: Konva.Node): NodeId | null {
  let shape: Konva.Node | null = konvaNode
  while (shape && shape.nodeType !== 'Stage') {
    const name = shape.name()
    if (name !== '') {
      return name as NodeId
    }
    shape = shape.parent
  }
  return null
}

const NodeHoverLayer = () => {
  const [hoveredNode, setHoveredNode] = useHoveredNode()
  const transitions = useTransition(hoveredNode ? [hoveredNode] : [], {
    from: nodeSprings({
      opacity: 0.4
    }) as unknown as NodeSprings,
    enter: nodeSprings(),
    leave: nodeSprings({
      opacity: 0
    }),
    update: nodeSprings(),
    delay: 50,
    expires: true,
    keys(item) {
      return item.id
    }
    // keys: (n: DiagramNode) => n.id,
    // delay(key) {
    //   const isUpdating = nodes.some(n => keyOf(n) === key)
    //   return isUpdating ? 30 : 0
    // },
    // config: (_node, _index, state): SpringConfig => {
    //   // eslint-disable-next-line @typescript-eslint/no-unsafe-enum-comparison
    //   if (state === 'leave') {
    //     return {
    //       precision: 0.005,
    //       duration: 120
    //     }
    //   }
    //   return {
    //     precision: 0.005
    //   }
    // }
  })
  return (
    <Layer>
      {transitions((springs, item, { key, ctrl }) => {
        return (
          <NodeHover
            key={key}
            node={item}
            theme={theme}
            springs={springs}
            ctrl={ctrl}
            // onPointerEnter={e => {
            //   e.cancelBubble = true
            //   setHoveredNode(item)
            // }}
            // onPointerLeave={() => {
            //   setHoveredNode(null)
            // }}
          />
        )
        // return (
        //   <AnimatedGroup
        //     x={springs.x}
        //     y={springs.y}
        //     width={springs.width}
        //     height={springs.height}
        //     offsetX={springs.offsetX}
        //     offsetY={springs.offsetY}
        //     name={item.id}
        //     onPointerEnter={(e) => {
        //       e.cancelBubble = true
        //       setHoveredNode(item)
        //     }}
        //     onPointerLeave={() => {
        //       setHoveredNode(null)
        //     }}
        //   >
        //     {/* <AnimatedRect x={0} y={0} width={springs.width} height={springs.height} fill={fill} listening={false} /> */}
        //     <ExternalLink
        //        fill={'#000'}
        //        x={0}
        //        y={0}
        //        opacity={springs.opacity}
        //        />
        //   </AnimatedGroup>
        // )
      })}
    </Layer>
  )
}

export const Diagram = /* @__PURE__ */ forwardRef<DiagramApi, DiagramProps>(
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
      onNodeContextMenu,
      onStageClick,
      onStageContextMenu,
      width: _width,
      height: _height,
      ...props
    },
    ref
  ) => {
    const immediate = !animate
    const id = diagram.id

    const containerRef = useRef<HTMLDivElement | null>(null)
    const stageRef = useHookableRef<Konva.Stage | null>(null, value => {
      containerRef.current = value?.container() ?? null
      return value
    })

    const width = _width ?? diagram.width
    const height = _height ?? diagram.height

    const toCenterOnRect = (centerTo: IRect) => {
      const [paddingTop, paddingRight, paddingBottom, paddingLeft] = Array.isArray(_padding)
        ? _padding
        : ([_padding, _padding, _padding, _padding] as const)
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
      // console.log(`centerTo: \n${JSON.stringify(centerTo, null, 4)}`)
      // console.log(`viewRect: \n${JSON.stringify(viewRect, null, 4)}`)
      // console.log(`finalPosition: \n${JSON.stringify(finalPosition, null, 4)}`)
      return {
        ...finalPosition,
        scale
      }
    }

    const toFitDiagram = () => toCenterOnRect(diagram.boundingBox)

    const [stageProps, stageSpringApi] = useSpring(() => ({
      from: initialPosition ?? toFitDiagram(),
      immediate
    }))

    const centerOnRect = (centerTo: IRect) => {
      stageSpringApi.stop(true).start({
        to: toCenterOnRect(centerTo),
        immediate
      })
    }

    const centerAndFit = () => {
      stageSpringApi.stop(true).start({
        to: toFitDiagram(),
        delay: 70,
        immediate
      })
    }

    const resetStageZoom = (_immediate?: boolean) => {
      stageSpringApi.stop(true).start({
        to: {
          x: 0,
          y: 0,
          scale: 1
        },
        immediate
      })
    }

    const refs = useSyncedRef({
      diagram,
      width,
      height,
      centerOnRect,
      centerAndFit,
      resetStageZoom
    })

    useImperativeHandle(
      ref,
      () =>
        ({
          stage: () => nonNullable(stageRef.current),
          diagramView: () => refs.current.diagram,
          container: () => nonNullable(stageRef.current?.container()),
          resetStageZoom: (_immediate?: boolean) => {
            refs.current.resetStageZoom(_immediate)
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
        }) satisfies DiagramApi,
      [refs, stageRef]
    )

    useEffect(() => {
      refs.current.centerAndFit()
    }, [id, height, width, _padding])

    useEffect(() => {
      const handler = (e: Event) => e.preventDefault()
      document.addEventListener('gesturestart', handler)
      document.addEventListener('gesturechange', handler)
      document.addEventListener('gestureend', handler)
      return () => {
        document.removeEventListener('gesturestart', handler)
        document.removeEventListener('gesturechange', handler)
        document.removeEventListener('gestureend', handler)
      }
    }, [])

    useGesture(
      {
        onDragEnd: () => {
          DiagramGesture.isDragging = false
        },
        onDrag: state => {
          const {
            pinching,
            active,
            down,
            cancel,
            intentional,
            offset: [x, y]
          } = state
          if (pinching) {
            return cancel()
          }
          if (intentional) {
            DiagramGesture.isDragging = true
            stageSpringApi.start({
              to: {
                x,
                y
              },
              immediate: active && down
            })
          }
        },
        onPinch: ({ memo, first, origin: [ox, oy], movement: [ms], offset: [scale] }) => {
          if (first) {
            const { width, height, x, y } = containerRef.current!.getBoundingClientRect()
            const tx = ox - (x + width / 2)
            const ty = oy - (y + height / 2)
            memo = [stageRef.current!.x(), stageRef.current!.y(), tx, ty]
          }

          const x = memo[0] - (ms - 1) * memo[2]
          const y = memo[1] - (ms - 1) * memo[3]
          stageSpringApi.start({
            to: {
              x,
              y,
              scale
            }
          })

          return memo
        }
      },
      {
        target: containerRef,
        drag: {
          enabled: pannable,
          threshold: 4,
          from: () => [stageProps.x.get(), stageProps.y.get()],
          pointer: {
            buttons: -1,
            keys: false
          }
        },
        pinch: {
          enabled: zoomable,
          modifierKey: null,
          scaleBounds: { min: 0.3, max: 1.2 },
          pinchOnWheel: true
        }
      }
    )

    const sharedProps = {
      animate,
      theme,
      diagram
    }

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
        // onPointerMove={e => {
        //   console.log('onPointerMove')
        // }}
        {...((onStageContextMenu || onNodeContextMenu) && {
          onContextMenu: e => {
            if (KonvaCore.isDragging() || !stageRef.current) {
              return
            }
            if (e.target === stageRef.current || !onNodeContextMenu) {
              e.cancelBubble = true
              onStageContextMenu?.(stageRef.current, e)
              return
            }
            if (onNodeContextMenu) {
              const nodeId = diagramNodeId(e.target)
              const node = nodeId && refs.current.diagram.nodes.find(n => n.id === nodeId)
              if (node) {
                e.cancelBubble = true
                onNodeContextMenu(node, e)
                return
              }
            }
          }
        })}
        // {...(onStageClick && {
        //   onPointerClick: e => {
        //     if (KonvaCore.isDragging() || e.evt.button !== 0 || !stageRef.current) {
        //       return
        //     }
        //     if (e.target === stageRef.current || !onNodeClick) {
        //       e.cancelBubble = true
        //       onStageClick(stageRef.current, e)
        //     }
        //   }
        // })}
        // {...(zoomable && {
        //   onPointerDblClick: e => {
        //     if (KonvaCore.isDragging() || e.evt.button !== 0 || !stageRef.current) {
        //       return
        //     }
        //     if (e.target === stageRef.current || !onNodeClick) {
        //       e.cancelBubble = true
        //       centerAndFit()
        //     }
        //   }
        // })}
        // {...useTouchHandlers(pannable, stageSpringApi)}
        // {...useMouseWheel(zoomable, stageSpringApi)}
        {...props}
      >
        <Layer>
          <Compounds {...sharedProps} onNodeClick={onNodeClick} />
          <Edges {...sharedProps} onEdgeClick={onEdgeClick} />
        </Layer>
        <Layer>
          <Nodes {...sharedProps} onNodeClick={onNodeClick} />
        </Layer>
        <NodeHoverLayer />
      </AnimatedStage>
    )
  }
)
Diagram.displayName = 'Diagram'
