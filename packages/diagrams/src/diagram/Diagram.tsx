import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react'
import { AnimatedStage, KonvaCore, Layer } from '../konva'
import { nonNullable } from '@likec4/core/errors'
import type { DiagramNode } from '@likec4/core/types'
import { useSpring } from '@react-spring/konva'
import type Konva from 'konva'
import { clamp } from 'rambdax'
import { Compounds } from './Compounds'
import { Edges } from './Edges'
import { Nodes } from './Nodes'
import { defaultTheme as theme } from '@likec4/core/colors'
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

const NoPadding: DiagramPaddings = [0, 0, 0, 0]

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
      onStageClick,
      width = diagram.width,
      height = diagram.height,
      ...props
    },
    ref
  ) => {
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
        }) satisfies DiagramApi,
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
        {...useTouchHandlers(pannable, stageSpringApi)}
        {...useMouseWheel(pannable, stageSpringApi)}
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
          <Compounds {...sharedProps} onNodeClick={onNodeClick} />
          <Edges {...sharedProps} onEdgeClick={onEdgeClick} />
        </Layer>
        <Layer>
          <Nodes {...sharedProps} onNodeClick={onNodeClick} />
        </Layer>
      </AnimatedStage>
    )
  }
)
Diagram.displayName = 'LikeC4Diagram'
