/* eslint-disable @typescript-eslint/prefer-ts-expect-error */
/* eslint-disable @typescript-eslint/ban-ts-comment */
import type { DiagramEdge, DiagramNode, DiagramView } from '@likec4/core/types'
import { useFirstMountState } from '@react-hookz/web/esm'
import { animated, useSpring, useTransition, type AnimatedComponent } from '@react-spring/konva'
import type Konva from 'konva'
import { clamp } from 'rambdax'
import { createElement, useCallback, useEffect, useMemo, useRef, type ReactElement } from 'react'
import { Layer, Stage } from 'react-konva'
import { CompoundShape, EdgeShape, nodeShape } from './shapes'
import { DefaultDiagramTheme } from './theme'
import type { DiagramPaddings } from './types'

const AStage: AnimatedComponent<typeof Stage> = animated(Stage)
AStage.displayName = 'AnimatedStage'

interface IRect {
  x: number
  y: number
  width: number
  height: number
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
  const {
    pannable = interactive,
    zoomable = interactive,
    animate = interactive,
  } = props

  const id = diagram.id
  const theme = DefaultDiagramTheme

  const isFirstRender = useFirstMountState()

  const width = Math.max(props.width ?? diagram.width, 16)
  const height = Math.max(props.height ?? diagram.height, 16)

  const stageRef = useRef<Konva.Stage>(null)

  const centerOnRect = (rect: IRect) => {
    const [paddingTop, paddingRight, paddingBottom, paddingLeft] = Array.isArray(padding) ? padding : [padding, padding, padding, padding] as const
    // const stage = stageRef.current
    // const container = stage?.container()

    // Get the space we can see in the web page = size of div containing stage
    // or stage size, whichever is the smaller
    const viewRect = {
      width,
      height
    }
    // if (stage && container) {
    //   viewRect.width = Math.min(container.clientWidth, stage.width())
    //   viewRect.height = Math.min(container.clientHeight, stage.height())
    // }

    const
      // Add padding to make a larger rect - this is what we want to fill
      centerTo = {
        x: rect.x - paddingLeft,
        y: rect.y - paddingTop,
        width: rect.width + paddingLeft + paddingRight,
        height: rect.height + paddingTop + paddingBottom
      },
      // Get the ratios of target shape v's view space widths and heights
      // decide on best scale to fit longest side of shape into view
      viewScale = Math.min(
        viewRect.width / centerTo.width,
        viewRect.height / centerTo.height,
      ),
      scale = clamp(
        0.2,
        1.05,
        viewScale
      ),
      // calculate the final adjustments needed to make
      // the shape centered in the view
      centeringAjustment = {
        x: (viewRect.width - centerTo.width * scale) / 2,
        y: (viewRect.height - centerTo.height * scale) / 2
      },
      // and the final position is...
      finalPosition = {
        x: Math.ceil(centeringAjustment.x + (-centerTo.x * scale)),
        y: Math.ceil(centeringAjustment.y + (-centerTo.y * scale))
      }
    return {
      ...finalPosition,
      scaleX: scale,
      scaleY: scale,
    }
  }

  const [stageProps, stageSpringApi] = useSpring({
    to: {
      ...centerOnRect({
        x: 0,
        y: 0,
        width: diagram.width,
        height: diagram.height,
      })
    },
    immediate: isFirstRender || !animate,
  }, [id, width, height, diagram.width, diagram.height])

  const panning = useMemo(() => {
    if (!pannable) {
      return {
        draggable: false,
      }
    }
    return {
      draggable: true,
      onDragStart: (_e: Konva.KonvaEventObject<DragEvent>) => {
        stageSpringApi.stop(true)
      },
      onDragEnd: ({ target }: Konva.KonvaEventObject<DragEvent>) => {
        if (target === stageRef.current) {
          stageSpringApi.set({
            x: target.x(),
            y: target.y(),
          })
        }
      }
    }
  }, [pannable, stageSpringApi])

  const handleWheelZoom = useCallback((e: Konva.KonvaEventObject<WheelEvent>) => {
    const stage = stageRef.current
    const pointer = stage?.getPointerPosition()
    if (!stage || !pointer) {
      return
    }

    if (Math.abs(e.evt.deltaY) < 10) {
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
      y: (pointer.y - stage.y()) / oldScale,
    }

    // when we zoom on trackpad, e.evt.ctrlKey is true
    // in that case lets revert direction
    if (e.evt.ctrlKey) {
      direction = -direction
    }

    let newScale = direction > 0 ? oldScale * zoomStep : oldScale / zoomStep

    newScale = clamp(0.1, 1.6, newScale)

    stageSpringApi.start({
      scaleX: newScale,
      scaleY: newScale,
      x: pointer.x - mousePointTo.x * newScale,
      y: pointer.y - mousePointTo.y * newScale,
    })
  }, [stageSpringApi])

  // useEffect(() => {
  //   stageSpringApi.stop(true).start({
  //     to: {
  //       ...centerOnRect({
  //         x: 0,
  //         y: 0,
  //         width: diagram.width,
  //         height: diagram.height,
  //       })
  //     },
  //     immediate: !animate,
  //   })
  // }, [id, width, height, diagram.width, diagram.height])

  const compoundTransitions = useTransition(diagram.nodes.filter(isCompound), {
    from: {
      opacity: 0.1,
      scaleX: 0.8,
      scaleY: 0.8,
    },
    enter: {
      opacity: 1,
      scaleX: 1,
      scaleY: 1,
    },
    leave: {
      opacity: 0,
      scaleX: 0.7,
      scaleY: 0.7,
    },
    immediate: isFirstRender || !animate,
    config(item, index, state) {
      return {
        duration: state === 'leave' ? 120 : 200,
      }
    },
    keys: node => node.id,
  })

  const edgeTransitions = useTransition(diagram.edges, {
    from: {
      opacity: 0,
    },
    enter: {
      opacity: 0.75,
    },
    leave: {
      opacity: 0,
    },
    immediate: isFirstRender || !animate,
    delay: animate ? 100 : 0,
    config: {
      duration: 100,
    },
    keys: edge => edge.id,
  })

  const nodeTransitions = useTransition(diagram.nodes.filter(isNotCompound), {
    from: {
      opacity: 0.1,
      scaleX: 0.7,
      scaleY: 0.7,
    },
    enter: {
      opacity: 1,
      scaleX: 1,
      scaleY: 1,
    },
    leave: {
      opacity: 0,
      scaleX: 0.4,
      scaleY: 0.4,
    },
    immediate: isFirstRender || !animate,
    config(item, index, state) {
      return {
        duration: state === 'leave' ? 120 : 250,
      }
    },
    keys: node => (node.parent ?? '') + '-' + node.id,
  })

  // @ts-ignore
  return <AStage
    ref={stageRef}
    className={className}
    onWheel={zoomable && handleWheelZoom}
    width={width}
    height={height}
    {...panning}
    {...stageProps}
  >
    <Layer>
      {compoundTransitions((springs, node) =>
        <CompoundShape
          key={node.id}
          animate={animate}
          node={node}
          theme={theme}
          springs={springs}
          onNodeClick={onNodeClick}
        />)}
    </Layer>
    <Layer>
      {edgeTransitions((springs, edge) => (
        <EdgeShape
          key={edge.id}
          edge={edge}
          theme={theme}
          springs={springs}
          onEdgeClick={onEdgeClick}
        />
      ))}
    </Layer>
    <Layer>
      {nodeTransitions((springs, node) =>
        createElement(nodeShape(node), {
          key: (node.parent ?? '') + '-' + node.id + '-' + node.shape,
          animate,
          node,
          theme,
          springs,
          onNodeClick,
        })
      )}
    </Layer>
  </AStage>

}
