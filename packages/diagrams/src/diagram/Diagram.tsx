import type { DiagramEdge, DiagramNode, DiagramView, ViewID } from '@likec4/core/types'
import { useSyncedRef } from '@react-hookz/web/esm'
import invariant from 'tiny-invariant'
import Konva from 'konva'
import { clamp, partition } from 'rambdax'
import { useCallback, useEffect, useRef } from 'react'
import { Layer, Stage } from 'react-konva'
import { CompoundShape, EdgeShape, RectangleShape } from './shapes'
import { defaultKonvaTheme } from './theme'
import type { DiagramPaddings } from './types'

interface IRect {
  x: number
  y: number
  width: number
  height: number
}

export interface DiagramProps {
  className?: string
  interactive?: boolean
  pannable?: boolean
  zoomable?: boolean
  zoomBy?: number
  diagram: DiagramView
  width?: number
  height?: number
  padding?: DiagramPaddings
  onNodeClick?: (node: DiagramNode) => void
  onEdgeClick?: (edge: DiagramEdge) => void
}

const isCompound = (node: DiagramNode) => node.children.length > 0
const filterCompounds = partition(isCompound)

export function Diagram({
  diagram,
  className,
  zoomBy = 1.06,
  interactive = true,
  pannable = interactive,
  zoomable = interactive,
  width = diagram.width,
  height = diagram.height,
  padding = 0,
  onNodeClick,
  onEdgeClick
}: DiagramProps): JSX.Element {
  const id = diagram.id
  const theme = defaultKonvaTheme

  const lastRenderViewIdRef = useRef<ViewID | null>(null)

  const diagramRef = useRef(diagram)
  diagramRef.current = diagram

  const paddings = Array.isArray(padding) ? padding : [padding, padding, padding, padding] as const
  const paddingRef = useSyncedRef(paddings)

  const stageRef = useRef<Konva.Stage>(null)
  const stageTweenRef = useRef<Konva.Tween | null>(null)

  const stopTween = useCallback(() => {
    if (stageTweenRef.current) {
      stageTweenRef.current.pause().destroy()
      stageTweenRef.current = null
    }
  }, [])

  const handleDragMove = useCallback((_e: Konva.KonvaEventObject<DragEvent>) => {
    stopTween()
  }, [])

  const handleWheelZoom = useCallback((e: Konva.KonvaEventObject<WheelEvent>) => {
    const stage = stageRef.current
    invariant(stage, 'stageRef.current is null')
    const pointer = stage.getPointerPosition()
    if (!pointer) {
      return
    }

    // stop default scrolling
    e.evt.preventDefault()
    e.cancelBubble = true

    stopTween()

    const oldScale = stage.scaleX()

    const mousePointTo = {
      x: (pointer.x - stage.x()) / oldScale,
      y: (pointer.y - stage.y()) / oldScale,
    }

    // how to scale? Zoom in? Or zoom out?
    let direction = e.evt.deltaY > 0 ? 1 : -1

    // when we zoom on trackpad, e.evt.ctrlKey is true
    // in that case lets revert direction
    if (e.evt.ctrlKey) {
      direction = -direction
    }

    let newScale = direction > 0 ? oldScale * zoomBy : oldScale / zoomBy

    newScale = clamp(0.1, 1.6, newScale)

    stage.scale({ x: newScale, y: newScale })

    const newPos = {
      x: pointer.x - mousePointTo.x * newScale,
      y: pointer.y - mousePointTo.y * newScale,
    }
    stage.position(newPos)
  }, [zoomBy])

  const centerOnRect = useCallback((rect: IRect, animate = false) => {
    const stage = stageRef.current
    invariant(stage, 'stageRef.current is null')
    const container = stage.container()

    const [paddingTop, paddingRight, paddingBottom, paddingLeft] = paddingRef.current

    stopTween()
    const
      // Add padding to make a larger rect - this is what we want to fill
      centerTo = {
        x: rect.x - paddingLeft,
        y: rect.y - paddingTop,
        width: rect.width + paddingLeft + paddingRight,
        height: rect.height + paddingTop + paddingBottom
      },
      // Get the space we can see in the web page = size of div containing stage
      // or stage size, whichever is the smaller
      viewRect = {
        width: Math.min(container.clientWidth, stage.width()),
        // width: container.clientWidth,
        height: Math.min(container.clientHeight, stage.height())
        // height: container.clientHeight
      },
      // Get the ratios of target shape v's view space widths and heights
      // decide on best scale to fit longest side of shape into view
      viewScale = Math.min(
        viewRect.width / centerTo.width,
        viewRect.height / centerTo.height,
      ),
      scale = clamp(
        0.2,
        Math.max(1.1, stage.scaleX()),
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

    if (animate) {
      stageTweenRef.current = new Konva.Tween({
        node: stage,
        ...finalPosition,
        scaleX: scale,
        scaleY: scale,
        duration: 0.75,
        // eslint-disable-next-line @typescript-eslint/unbound-method
        easing: Konva.Easings.StrongEaseOut,
      }).play()
    } else {
      stage.setAttrs({
        ...finalPosition,
        scaleX: scale,
        scaleY: scale,
      })
    }
  }, [])

  const centerAndFit = useCallback((animate = false) => {
    const nodes = diagramRef.current.nodes
    if (nodes.length === 0) return
    const boundingRect = [Infinity, Infinity, -Infinity, -Infinity] as [
      minX: number,
      minY: number,
      maxX: number,
      maxY: number
    ]
    for (const node of nodes) {
      const { position: [x, y], size: { width, height } } = node
      boundingRect[0] = Math.min(boundingRect[0], x)
      boundingRect[1] = Math.min(boundingRect[1], y)
      boundingRect[2] = Math.max(boundingRect[2], x + width)
      boundingRect[3] = Math.max(boundingRect[3], y + height)
    }
    centerOnRect({
      x: boundingRect[0],
      y: boundingRect[1],
      width: boundingRect[2] - boundingRect[0],
      height: boundingRect[3] - boundingRect[1]
    }, animate)
  }, [])

  const [
    compounds,
    nodes
  ] = filterCompounds(diagram.nodes)

  useEffect(() => {
    return () => {
      stopTween()
    }
  }, [])

  useEffect(() => {
    const lastRenderViewId = lastRenderViewIdRef.current
    if (stageRef.current) {
      centerAndFit(interactive && lastRenderViewId !== null && lastRenderViewId !== id)
      lastRenderViewIdRef.current = id
    }
  }, [id, width, height, ...paddings])

  const animate = interactive && lastRenderViewIdRef.current !== null

  return <Stage
    ref={stageRef}
    _useStrictMode
    width={Math.max(width, 10)}
    height={Math.max(height, 10)}
    draggable={pannable}
    className={className}
    onDragMove={pannable ? handleDragMove : undefined}
    onWheel={zoomable ? handleWheelZoom : undefined}
  >
    <Layer>
      {compounds.map(node =>
        <CompoundShape
          key={node.id}
          animate={animate}
          node={node}
          theme={theme}
          onNodeClick={onNodeClick}
        />)}
    </Layer>
    <Layer>
      {diagram.edges.map(edge =>
        <EdgeShape
          key={edge.id}
          edge={edge}
          theme={theme}
          onEdgeClick={onEdgeClick}
        />
      )}
    </Layer>
    <Layer>
      {nodes.map(node =>
        <RectangleShape
          key={node.id}
          animate={animate}
          node={node}
          theme={theme}
          onNodeClick={onNodeClick}
        />)}
    </Layer>
  </Stage>
}
