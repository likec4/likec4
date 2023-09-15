import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react'
import { AnimatedStage, KonvaCore, Layer } from '../konva'
import { nonNullable } from '@likec4/core'
import type { DiagramNode } from '@likec4/core'
import { useSpring } from '@react-spring/konva'
import type Konva from 'konva'
import { clamp } from 'rambdax'
import { Compounds } from './Compounds'
import { Edges } from './Edges'
import { Nodes } from './Nodes'
import { defaultTheme as theme } from '@likec4/core'
import type { DiagramPaddings, DiagramApi, DiagramProps } from './types'
import { useTouchHandlers } from './useTouchHandlers'
import { useMouseWheel } from './useMouseWheel'

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
    const stageRef = useRef<Konva.Stage>(null)

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

    // useEffect(() => {
    //   const el = stageRef.current?.container()
    //   if (!el) return
    //   if (!pannable && !zoomable) {
    //     el.style.touchAction = 'none'
    //     return
    //   }
    //   el.style.touchAction = `${pannable ? 'pan-x pan-y ' : ''}${zoomable ? 'pinch-zoom' : ''}`
    // }, [pannable, zoomable])

    useEffect(() => {
      refs.current.centerAndFit()
    }, [id, height, width, _padding])

    const sharedProps = {
      animate,
      theme,
      diagram
    }
    const nodeSharedProps = {
      ...sharedProps,
      onNodeClick,
      onNodeContextMenu
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
        {...(onStageContextMenu && {
          onContextMenu: e => {
            if (KonvaCore.isDragging() || !stageRef.current) {
              return
            }
            if (e.target === stageRef.current) {
              e.cancelBubble = true
              onStageContextMenu(stageRef.current, e)
            }
          }
        })}
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
        onPointerDblClick={e => {
          if (KonvaCore.isDragging() || !stageRef.current) {
            return
          }
          if (e.target === stageRef.current || !onNodeClick) {
            e.cancelBubble = true
            centerAndFit()
          }
        }}
        {...useTouchHandlers(pannable, stageSpringApi)}
        {...useMouseWheel(zoomable, stageSpringApi)}
        {...props}
      >
        <Layer>
          <Compounds {...nodeSharedProps} />
          <Edges {...sharedProps} onEdgeClick={onEdgeClick} />
        </Layer>
        <Layer>
          <Nodes {...nodeSharedProps} />
        </Layer>
      </AnimatedStage>
    )
  }
)
Diagram.displayName = 'Diagram'
