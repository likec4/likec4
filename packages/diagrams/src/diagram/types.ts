import type { DiagramEdge, DiagramNode, DiagramView } from '@likec4/core'
import type Konva from 'konva'
import type { HTMLAttributes } from 'react'

export type DiagramViews<T extends string = string> = {
  [key in T]: DiagramView
}

export type DiagramPaddings =
  | number
  | readonly [top: number, right: number, bottom: number, left: number]

export interface IRect {
  x: number
  y: number
  width: number
  height: number
}

// prettier-ignore
export type {
  DiagramEdge,
  DiagramLabel,
  DiagramNode,
  DiagramView,
  LikeC4Theme,
  LikeC4Theme as DiagramTheme
} from '@likec4/core'

export type KonvaPointerEvent = Konva.KonvaEventObject<PointerEvent>

export type OnNodeClick = (node: DiagramNode, event: KonvaPointerEvent) => void
export type OnEdgeClick = (node: DiagramEdge, event: KonvaPointerEvent) => void
export type OnStageClick = (stage: Konva.Stage, event: KonvaPointerEvent) => void

export interface DiagramApi {
  readonly stage: Konva.Stage | null
  readonly container: HTMLDivElement | null
  readonly diagramView: DiagramView
  /**
   * Reset stage position and zoom
   */
  resetStageZoom(immediate?: boolean): void
  centerOnNode(node: DiagramNode, opts?: DiagramApi.CenterMethodOptions): void
  centerOnRect(rect: IRect, opts?: DiagramApi.CenterMethodOptions): void
  centerAndFit(opts?: DiagramApi.CenterMethodOptions): void
}

export namespace DiagramApi {
  export interface CenterMethodOptions {
    delay?: number
    /**
     * If true, the diagram will be centered immediately
     * @default false
     */
    immediate?: boolean
    /**
     * If true, the diagram will keep its current zoom level (max level)
     * @default false
     */
    keepZoom?: boolean
  }
}

export type DiagramInitialPosition = {
  x: number
  y: number
  scale: number
}

// prettier-ignore
export interface DiagramProps
  extends Pick<HTMLAttributes<HTMLDivElement>, 'className' | 'role' | 'style' | 'tabIndex' | 'title'>
{
  diagram: DiagramView
  /**
   * If true, the diagram will be animated when nodes are added or removed
   * @default true
   */
  animate?: boolean | undefined
  /**
   * If true, the diagram will be pannable
   * @default true
   */
  pannable?: boolean | undefined
  /**
   * If true, the diagram will be zoomable
   * @default true
   */
  zoomable?: boolean | undefined

  /**
   * @default 0.1
   */
  minZoom?: number | undefined
  /**
   * @default 1.1
   */
  maxZoom?: number | undefined

  width?: number | undefined
  height?: number | undefined
  /**
   * The padding inside the diagram canvas
   */
  padding?: DiagramPaddings | undefined

  /**
   * Internal use
   * When render to React portal
   */
  initialPosition?: DiagramInitialPosition | undefined

  onNodeClick?: OnNodeClick | undefined
  onNodeContextMenu?: OnNodeClick | undefined
  onStageClick?: OnStageClick | undefined
  onStageContextMenu?: OnStageClick | undefined
  onEdgeClick?: OnEdgeClick | undefined
}
