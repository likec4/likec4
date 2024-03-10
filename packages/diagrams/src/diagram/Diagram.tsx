import type { DiagramNode, NodeId } from '@likec4/core'
import { defaultTheme as theme, nonNullable } from '@likec4/core'
import { useHookableRef, useUpdateEffect } from '@react-hookz/web'
import { useSpring } from '@react-spring/konva'
import type Konva from 'konva'
import { clamp, isNil } from 'rambdax'
import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef } from 'react'
import { AnimatedStage, Layer } from '../konva'
import { Edges } from './Edges'
import type { DiagramApi, DiagramPaddings, DiagramProps } from './types'

import { createUseGesture, dragAction, pinchAction } from '@use-gesture/react'
import { Nodes } from './Nodes'
import { DiagramGesture, DiagramStateProvider, useResetHoveredStates } from './state'
import type { IRect } from './types'
import { isNumber } from './utils'

const useGesture = createUseGesture([dragAction, pinchAction])

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

type CenteringOpts = DiagramApi.CenterMethodOptions

const DiagramKonva = /* @__PURE__ */ forwardRef<DiagramApi, DiagramProps>(
  (
    {
      diagram,
      padding = NoPadding,
      pannable = true,
      zoomable = true,
      animate = true,
      initialPosition,
      onEdgeClick: _onEdgeClick,
      onNodeClick: _onNodeClick,
      onNodeContextMenu,
      onStageClick,
      onStageContextMenu,
      width: _width,
      height: _height,
      minZoom = 0.2,
      maxZoom = 1.1,
      ...props
    },
    ref
  ) => {
    const immediate = !animate
    const id = diagram.id

    const handlersRef = useSyncedRef({
      onEdgeClick: _onEdgeClick,
      onNodeClick: _onNodeClick
    })
    const containerRef = useRef<HTMLDivElement | null>(null)
    const stageRef = useHookableRef<Konva.Stage | null>(null, value => {
      containerRef.current = value?.container() ?? null
      if (containerRef.current) {
        containerRef.current.style.touchAction = 'none'
      }
      return value
    })
    const [paddingTop, paddingRight, paddingBottom, paddingLeft] = isNumber(padding)
      ? [padding, padding, padding, padding]
      : padding

    const width = _width ?? diagram.width + paddingLeft + paddingRight
    const height = _height ?? diagram.height + paddingTop + paddingBottom

    const onNodeClick = useCallback(
      (node: DiagramNode, e: Konva.KonvaEventObject<PointerEvent>) => {
        handlersRef.current.onNodeClick?.(node, e)
      },
      [handlersRef]
    )

    const onEdgeClick = useCallback(
      (edge: DiagramEdge, e: Konva.KonvaEventObject<PointerEvent>) => {
        handlersRef.current.onEdgeClick?.(edge, e)
      },
      [handlersRef]
    )

    /**
     * @param centerTo rectangle to center on
     * @param zoomIn if true, zoom can be greater than current
     */
    const toCenterOnRect = (centerTo: IRect, opts?: CenteringOpts) => {
      const keepZoom = opts?.keepZoom ?? false
      const container = containerRef.current
      const _maxZoom = keepZoom === true && !isNil(stageRef.current) ? stageRef.current.scaleX() : maxZoom

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
        scale = clamp(minZoom, _maxZoom, viewScale),
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

    const toFitDiagram = () => toCenterOnRect({ x: 0, y: 0, width: diagram.width, height: diagram.height })

    const [stageProps, stageSpringApi] = useSpring(
      () =>
        initialPosition
          ? {
            from: initialPosition,
            to: toFitDiagram(),
            immediate
          }
          : {
            to: toFitDiagram(),
            immediate
          },
      []
    )

    const centerOnRect = (centerTo: IRect, opts?: CenteringOpts) => {
      stageSpringApi.start({
        to: toCenterOnRect(centerTo, {
          keepZoom: opts?.keepZoom ?? true
        }),
        delay: opts?.delay ?? 0,
        immediate: immediate || (opts?.immediate ?? false)
      })
      return
    }

    const centerAndFit = (opts?: CenteringOpts) => {
      stageSpringApi.start({
        to: toFitDiagram(),
        delay: opts?.delay ?? 0,
        immediate: immediate || (opts?.immediate ?? false)
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
            return stageRef.current
          },
          get diagramView() {
            return refs.current.diagram
          },
          get container() {
            return stageRef.current?.container() ?? null
          },
          resetStageZoom: (_immediate?: boolean) => {
            refs.current.resetStageZoom(_immediate)
          },
          centerOnNode: (node: DiagramNode, opts?: CenteringOpts) =>
            refs.current.centerOnRect(
              {
                x: node.position[0],
                y: node.position[1],
                width: node.width,
                height: node.height
              },
              opts
            ),
          centerOnRect: (rect: IRect, opts?: CenteringOpts) => refs.current.centerOnRect(rect, opts),
          centerAndFit: (opts?: CenteringOpts) => refs.current.centerAndFit(opts)
        }) satisfies DiagramApi,
      [refs, stageRef]
    )

    const resetHoveredStates = useResetHoveredStates()

    useUpdateEffect(() => {
      resetHoveredStates()
      refs.current.centerAndFit({
        delay: 200
      })
    }, [id])

    useUpdateEffect(() => {
      refs.current.centerAndFit({
        keepZoom: true
      })
    }, [height, width])

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
        onDrag: state => {
          const {
            first,
            last,
            down,
            intentional,
            offset: [x, y]
          } = state
          if (!intentional) {
            return
          }
          if (first || last) {
            DiagramGesture.isDragging = first && !last
          }
          stageSpringApi.start({
            to: {
              x,
              y
            },
            delay: 0,
            immediate: immediate || (down && !last)
          })
        },
        onPinch: ({ memo, first, last, origin: [ox, oy], movement: [ms], offset: [scale] }) => {
          if (first) {
            DiagramGesture.isDragging = true
            const stage = nonNullable(stageRef.current)
            const { x, y } = stage.getAbsolutePosition()
            const tx = Math.round(ox - x)
            const ty = Math.round(oy - y)
            memo = [stage.x(), stage.y(), tx, ty]
          }
          if (last) {
            DiagramGesture.isDragging = false
          }
          const x = Math.round(memo[0] - (ms - 1) * memo[2])
          const y = Math.round(memo[1] - (ms - 1) * memo[3])

          stageSpringApi.start({
            to: {
              x,
              y,
              scale
            },
            delay: 0
          })
          return memo
        }
      },
      {
        target: containerRef,
        drag: {
          target: containerRef,
          enabled: pannable,
          threshold: 4,
          from: () => [stageRef.current?.x() ?? 0, stageRef.current?.y() ?? 0],
          pointer: Object.assign(
            {
              keys: false,
              mouse: true,
              capture: true
            },
            !onNodeContextMenu && !onStageContextMenu
              ? {
                buttons: -1
              }
              : undefined
          )
        },
        pinch: {
          eventOptions: {
            passive: true,
            capture: true
          },
          target: containerRef,
          pointer: {
            touch: true
          },
          from: () => [stageRef.current?.scaleX() ?? 1, 0],
          enabled: zoomable,
          scaleBounds: { min: minZoom, max: maxZoom + 0.4 },
          rubberband: 0.045,
          pinchOnWheel: true
        }
      }
    )

    const sharedProps = {
      animate,
      theme,
      diagram
    }

    // center of the stage
    const layerCenterX = diagram.width / 2
    const layerCenterY = diagram.height / 2

    return (
      <AnimatedStage
        _useStrictMode
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
        <Layer
          x={layerCenterX}
          offsetX={layerCenterX}
          y={layerCenterY}
          offsetY={layerCenterY}
          scaleX={1}
          scaleY={1}
        >
          <Nodes {...sharedProps} onNodeClick={_onNodeClick ? onNodeClick : undefined} />
          <Edges {...sharedProps} onEdgeClick={_onEdgeClick ? onEdgeClick : undefined} />
        </Layer>
        <Layer name="top"></Layer>
      </AnimatedStage>
    )
  }
)
DiagramKonva.displayName = 'DiagramKonva'

export const Diagram = /* @__PURE__ */ forwardRef<DiagramApi, DiagramProps>((props, ref) => (
  <DiagramStateProvider>
    <DiagramKonva {...props} ref={ref} />
  </DiagramStateProvider>
))
Diagram.displayName = 'Diagram'
