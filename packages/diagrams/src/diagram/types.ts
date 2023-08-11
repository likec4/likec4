import type Konva from 'konva'
import type { DiagramEdge, DiagramNode, DiagramView } from '@likec4/core'

export type DiagramViews<T extends string = string> = Record<T, DiagramView>

export type DiagramPaddings = number | [top: number, right: number, bottom: number, left: number]

// prettier-ignore
export type {
  LikeC4Theme,
  LikeC4Theme as DiagramTheme,
  DiagramNode,
  DiagramEdge,
  DiagramLabel,
  DiagramView
} from '@likec4/core'

export type KonvaPointerEvent = Konva.KonvaEventObject<PointerEvent>

export type OnNodeClick = (node: DiagramNode, event: KonvaPointerEvent) => void
export type OnEdgeClick = (node: DiagramEdge, event: KonvaPointerEvent) => void
export type OnStageClick = (stage: Konva.Stage, event: KonvaPointerEvent) => void

export interface DiagramApi {
  stage(): Konva.Stage
  container(): HTMLDivElement
  diagramView(): DiagramView
  /**
   * Reset stage position and zoom
   */
  resetStageZoom(immediate?: boolean): void
  centerOnNode(node: DiagramNode): void
  centerAndFit(): void
}

// prettier-ignore
export interface DiagramProps extends Pick<React.HTMLAttributes<HTMLDivElement>, 'className' | 'role' | 'style' | 'tabIndex' | 'title'> {
  diagram: DiagramView
  /**
   * If true, the diagram will be animated when nodes are added or removed
   * @default true
   */
  animate?: boolean
  /**
   * If true, the diagram will be pannable
   * @default true
   */
  pannable?: boolean
  /**
   * If true, the diagram will be zoomable
   * @default true
   */
  zoomable?: boolean

  width?: number
  height?: number
  /**
   * The padding inside the diagram canvas
   */
  padding?: DiagramPaddings | undefined

  /**
   * Internal use
   * When render to React portal
   */
  initialPosition?: {
    x: number
    y: number
    scale: number
  } | undefined

  onNodeClick?: OnNodeClick | undefined
  onStageClick?: OnStageClick | undefined
  onEdgeClick?: OnEdgeClick | undefined
}
