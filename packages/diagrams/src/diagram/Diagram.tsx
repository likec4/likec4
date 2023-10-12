import type { DiagramNode, NodeId } from '@likec4/core'
import { nonNullable, defaultTheme as theme } from '@likec4/core'
import { useHookableRef, useUpdateEffect } from '@react-hookz/web/esm'
import { easings, useSpring } from '@react-spring/konva'
import type Konva from 'konva'
import { clamp } from 'rambdax'
import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react'
import { AnimatedStage, Layer } from '../konva'
import { Edges } from './Edges'
import type { DiagramApi, DiagramPaddings, DiagramProps } from './types'

import { createUseGesture, dragAction, pinchAction } from '@use-gesture/react'
import { Nodes } from './Nodes'
import { DiagramGesture } from './state'

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
      if (containerRef.current) {
        containerRef.current.style.touchAction = 'none'
      }
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

    const toFitDiagram = () =>
      toCenterOnRect({ x: 0, y: 0, width: diagram.width, height: diagram.height })

    const [stageProps, stageSpringApi] = useSpring(() =>
      initialPosition
        ? {
            from: initialPosition,
            to: toFitDiagram()
          }
        : {
            from: toFitDiagram(),
            immediate
          }
    )

    const centerOnRect = (centerTo: IRect) => {
      stageSpringApi.start({
        to: toCenterOnRect(centerTo),
        immediate
      })
      return
    }

    const centerAndFit = (delay = 70, durationMs?: number) => {
      stageSpringApi.start({
        to: toFitDiagram(),
        delay,
        config: durationMs
          ? {
              duration: durationMs,
              easing: easings.easeInOutCubic
            }
          : {},
        immediate
      })
      return
    }

    const resetStageZoom = (_immediate?: boolean) => {
      stageSpringApi.start({
        to: {
          x: 0,
          y: 0,
          scale: 1
        },
        immediate
      })
      return
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
          get stage() {
            return nonNullable(stageRef.current, 'not mounted')
          },
          get diagramView() {
            return refs.current.diagram
          },
          get container() {
            return nonNullable(stageRef.current?.container(), 'not mounted')
          },
          resetStageZoom: (_immediate?: boolean) => {
            refs.current.resetStageZoom(_immediate)
          },
          centerOnNode: (node: DiagramNode) =>
            refs.current.centerOnRect({
              x: node.position[0],
              y: node.position[1],
              width: node.size.width,
              height: node.size.height
            }),
          centerAndFit: () => refs.current.centerAndFit()
        }) satisfies DiagramApi,
      [refs, id, stageRef]
    )

    useUpdateEffect(() => {
      refs.current.centerAndFit(80, 650)
    }, [id, height, width])

    // Recommended by @use-gesture/react
    useEffect(() => {
      if (!zoomable) {
        return
      }
      const handler = (e: Event) => e.preventDefault()
      document.addEventListener('gesturestart', handler)
      document.addEventListener('gesturechange', handler)
      return () => {
        document.removeEventListener('gesturestart', handler)
        document.removeEventListener('gesturechange', handler)
      }
    }, [zoomable])

    useGesture(
      {
        onDragEnd: () => {
          DiagramGesture.isDragging = false
        },
        onDrag: state => {
          const {
            pinching,
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
              immediate: immediate || down
            })
          }
        },
        onPinch: ({ memo, first, last, origin: [ox, oy], movement: [ms], offset: [scale] }) => {
          if (first) {
            const stage = nonNullable(stageRef.current)
            const { x, y } = stage.getAbsolutePosition()
            const tx = Math.round(ox - x)
            const ty = Math.round(oy - y)
            memo = [stage.x(), stage.y(), tx, ty]
          }
          const x = Math.round(memo[0] - (ms - 1) * memo[2])
          const y = Math.round(memo[1] - (ms - 1) * memo[3])

          stageSpringApi.start({
            to: {
              x,
              y,
              scale
            },
            immediate: immediate || !last || !first
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
          pointer: {
            touch: true
          },
          enabled: zoomable,
          scaleBounds: { min: 0.2, max: 1.15 },
          rubberband: 0.05,
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
        {...((onStageContextMenu || onNodeContextMenu) && {
          onContextMenu: e => {
            if (DiagramGesture.isDragging || !stageRef.current) {
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
        {...(onStageClick && {
          onPointerClick: e => {
            if (DiagramGesture.isDragging || e.evt.button !== 0 || !stageRef.current) {
              return
            }
            if (e.target === stageRef.current) {
              e.cancelBubble = true
              onStageClick(stageRef.current, e)
            }
          }
        })}
        {...(zoomable && {
          onPointerDblClick: e => {
            if (DiagramGesture.isDragging || e.evt.button !== 0 || !stageRef.current) {
              return
            }
            if (e.target === stageRef.current) {
              e.cancelBubble = true
              centerAndFit()
            }
          }
        })}
        {...props}
      >
        <Layer>
          <Nodes {...sharedProps} onNodeClick={onNodeClick} />
          <Edges {...sharedProps} onEdgeClick={onEdgeClick} />
        </Layer>
        <Layer name='top'></Layer>
      </AnimatedStage>
    )
  }
)
Diagram.displayName = 'Diagram'
