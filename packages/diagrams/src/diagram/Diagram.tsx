/* eslint-disable @typescript-eslint/prefer-ts-expect-error */
/* eslint-disable @typescript-eslint/ban-ts-comment */
import { useCallback, useMemo, useRef, useEffect, forwardRef, useImperativeHandle } from 'react'
import type { DiagramEdge, DiagramNode, DiagramView } from '@likec4/core'
import { invariant } from '@likec4/core'
import { clamp, isNil } from 'rambdax'
import { AnimatedStage, Layer, KonvaCore } from '../konva'
import type Konva from 'konva'
import { useSpring, useTransition } from '@react-spring/konva'
import { CompoundShape, EdgeShape, nodeShape } from './shapes'
import { nodeListeners } from './shapes/nodeEvents'
import { interpolateNodeSprings } from './shapes/nodeSprings'
import type { OnDragEvent, OnNodeClick, OnPointerEvent, OnStageClick } from './shapes/types'
import { mouseDefault, mousePointer } from './shapes/utils'
import { DefaultDiagramTheme } from './theme'
import type { DiagramPaddings } from './types'

interface IRect {
  x: number
  y: number
  width: number
  height: number
}

function defaultNodeSprings(node: DiagramNode) {
  return {
    opacity: 1,
    scale: 1,
    x: node.position[0],
    y: node.position[1],
    width: node.size.width,
    height: node.size.height
  }
}
type NodeState = ReturnType<typeof defaultNodeSprings>

function nodeSprings(overrides?: { opacity?: number; scale?: number }) {
  if (isNil(overrides)) {
    return defaultNodeSprings as unknown as NodeState
  }
  const nodesprings = (node: DiagramNode) => ({
    ...defaultNodeSprings(node),
    ...overrides
  })
  return nodesprings as unknown as NodeState
}

type Point = {
  x: number
  y: number
}

function getDistance(p1: Point, p2: Point) {
  return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2))
}

function getCenter(p1: Point, p2: Point): Point {
  return {
    x: (p1.x + p2.x) / 2,
    y: (p1.y + p2.y) / 2
  }
}

export interface DiagramApi {
  stage: Konva.Stage
  toDataURL(config?: { pixelRatio?: number; mimeType?: string; quality?: number }): string
  /**
   * Reset stage position and zoom
   */
  resetStageZoom(immediate?: boolean): void
  centerOnNode(node: DiagramNode): void
  centerAndFit(): void
}

export interface DiagramProps
  extends Pick<
    React.HTMLAttributes<HTMLDivElement>,
    'className' | 'role' | 'style' | 'tabIndex' | 'title'
  > {
  diagram: DiagramView
  interactive?: boolean
  animate?: boolean
  pannable?: boolean
  zoomable?: boolean

  initialStagePosition?: {
    x: number
    y: number
    scale: number
  }
  width?: number
  height?: number
  padding?: DiagramPaddings | undefined
  onNodeClick?: OnNodeClick | undefined
  onStageClick?: OnStageClick | undefined
  onEdgeClick?: ((edge: DiagramEdge) => void) | undefined
}

function isCompound(node: DiagramNode) {
  return node.children.length > 0
}
function isNotCompound(node: DiagramNode) {
  return node.children.length == 0
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const notImplemented: any = () => {
  throw new Error('Not implemented')
}

export const Diagram = /* @__PURE__ */ forwardRef<DiagramApi, DiagramProps>(
  (
    {
      diagram,
      interactive = true,
      padding = 0,
      initialStagePosition,
      onNodeClick,
      onEdgeClick,
      onStageClick,
      ...diagramprops
    },
    ref
  ) => {
    const {
      pannable = interactive,
      zoomable = interactive,
      animate = interactive,
      width = diagram.width,
      height = diagram.height,
      ...rest
    } = diagramprops

    const id = diagram.id
    const theme = DefaultDiagramTheme

    const stageRef = useRef<Konva.Stage>(null)

    const centerOnRect = (centerTo: IRect) => {
      const [paddingTop, paddingRight, paddingBottom, paddingLeft] = Array.isArray(padding)
        ? padding
        : ([padding, padding, padding, padding] as const)
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

    const centerAndFitDiagram = () => {
      return centerOnRect(diagram.boundingBox)
    }

    const [stageProps, stageSpringApi] = useSpring(() => ({
      from: initialStagePosition ?? centerAndFitDiagram()
    }))

    const diagramApiRef = useRef<DiagramApi>({
      stage: null as unknown as Konva.Stage,
      toDataURL: notImplemented,
      centerOnNode: notImplemented,
      resetStageZoom: notImplemented,
      centerAndFit: centerAndFitDiagram
    })
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    diagramApiRef.current.stage = stageRef.current!
    diagramApiRef.current.centerAndFit = () => {
      stageSpringApi.stop(true).start({
        to: centerAndFitDiagram()
      })
    }
    diagramApiRef.current.toDataURL = config => {
      const stage = stageRef.current
      invariant(stage, 'Stage not initialized')
      return stage.toDataURL({
        mimeType: 'image/png',
        // @ts-expect-error Konva types are wrong
        imageSmoothingEnabled: false,
        ...config
      })
    }
    diagramApiRef.current.resetStageZoom = (immediate = !animate) => {
      stageSpringApi.stop(true).start({
        to: {
          x: 0,
          y: 0,
          scale: 1
        },
        immediate
      })
    }

    useImperativeHandle(ref, () => diagramApiRef.current, [diagramApiRef.current])

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
      diagramApiRef.current.centerAndFit()
    }, [id, width, height, diagram.width, diagram.height])

    const panning = useMemo(() => {
      if (!pannable) {
        return {
          draggable: false
        }
      }
      let lastCenter: Point | null = null
      let lastDist = 0
      return {
        draggable: true,
        dragDistance: 5,
        onTouchMove: (e: Konva.KonvaEventObject<TouchEvent>) => {
          const touch1 = e.evt.touches[0]
          const touch2 = e.evt.touches[1]
          const stage = e.target.getStage()
          if (!touch1 || !touch2 || !stage) {
            return
          }
          e.evt.preventDefault()

          // if the stage was under Konva's drag&drop
          // we need to stop it, and implement our own pan logic with two pointers
          if (stage.isDragging()) {
            stage.stopDrag()
          }

          const p1 = {
            x: touch1.clientX,
            y: touch1.clientY
          }
          const p2 = {
            x: touch2.clientX,
            y: touch2.clientY
          }

          if (!lastCenter) {
            lastCenter = getCenter(p1, p2)
            return
          }
          const newCenter = getCenter(p1, p2)
          const dist = getDistance(p1, p2)

          if (!dist) {
            return
          }

          if (!lastDist) {
            lastDist = dist
          }

          const currentScale = stageProps.scale.get()
          // local coordinates of center point
          const pointTo = {
            // x: (newCenter.x - stage.x()) / stageScale,
            x: (newCenter.x - stageProps.x.get()) / currentScale,
            // y: (newCenter.y - stage.y()) / stageScale,
            y: (newCenter.y - stageProps.y.get()) / currentScale
          }

          const scale = clamp(0.1, 2, currentScale * (dist / lastDist))

          // calculate new position of the stage
          const dx = newCenter.x - lastCenter.x
          const dy = newCenter.y - lastCenter.y

          const newPos = {
            x: Math.round(newCenter.x - pointTo.x * scale + dx),
            y: Math.round(newCenter.y - pointTo.y * scale + dy)
          }

          stageSpringApi.set({
            x: newPos.x,
            y: newPos.y,
            scale: scale
          })

          lastDist = dist
          lastCenter = newCenter
        },
        onTouchEnd: (_e: Konva.KonvaEventObject<TouchEvent>) => {
          lastCenter = null
          lastDist = 0
        },
        onDragStart: (e: OnDragEvent) => {
          if (e.target === stageRef.current) {
            e.cancelBubble = true
            // stageSpringApi.pause(['x', 'y'])
          }
        },
        onDragMove: (e: OnDragEvent) => {
          if (e.target === stageRef.current) {
            stageSpringApi.set({
              x: e.target.x(),
              y: e.target.y()
            })
          }
        },
        onDragEnd: (e: OnDragEvent) => {
          if (e.target === stageRef.current) {
            e.cancelBubble = true
            stageSpringApi.start({
              to: {
                x: e.target.x(),
                y: e.target.y()
              },
              immediate: true
            })
            lastCenter = null
            lastDist = 0
          }
        }
      }
    }, [pannable, stageSpringApi])

    const handleWheelZoom = useCallback(
      (e: Konva.KonvaEventObject<WheelEvent>) => {
        const pointer = e.target.getStage()?.getPointerPosition()
        if (!pointer || Math.abs(e.evt.deltaY) < 3) {
          return
        }
        e.cancelBubble = true
        e.evt.preventDefault()

        const zoomStep = 1 + clamp(0.01, 0.3, Math.abs(e.evt.deltaY) / 100)

        let direction = e.evt.deltaY > 0 ? 1 : -1

        const oldScale = stageProps.scale.get()
        const stageX = stageProps.x.get()
        const stageY = stageProps.y.get()

        const mousePointTo = {
          x: (pointer.x - stageX) / oldScale,
          y: (pointer.y - stageY) / oldScale
        }

        // when we zoom on trackpad, e.evt.ctrlKey is true
        // in that case lets revert direction
        if (e.evt.ctrlKey) {
          direction = -direction
        }

        let newScale = direction > 0 ? oldScale * zoomStep : oldScale / zoomStep

        newScale = clamp(0.1, 2, newScale)

        stageSpringApi.start({
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
      config: (node, item, state) => {
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
      exitBeforeEnter: true,
      expires: true,
      immediate: !animate,
      config: {
        duration: 150
      },
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
      config: (node, item, state) => {
        if (state === 'leave') {
          return {
            duration: 130
          }
        }
        return {}
      }
    })
    return (
      // @ts-ignore
      <AnimatedStage
        ref={stageRef}
        onWheel={zoomable ? handleWheelZoom : undefined}
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
        onPointerDblClick={e => {
          if (KonvaCore.isDragging() || !stageRef.current) {
            return
          }
          if (e.target === stageRef.current || !onNodeClick) {
            e.cancelBubble = true
            stageSpringApi.start({
              to: centerAndFitDiagram()
            })
          }
        }}
        {...panning}
        {...rest}
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
                  onEdgeClick(edge)
                }
              })}
              {...(onEdgeClick || interactive
                ? {
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
                  }
                : undefined)}
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
