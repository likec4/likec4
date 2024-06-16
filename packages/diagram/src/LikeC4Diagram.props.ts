import type {
  BorderStyle,
  DiagramEdge,
  DiagramNode,
  DiagramView,
  ElementShape,
  Fqn,
  NonEmptyArray,
  ThemeColor,
  ViewID
} from '@likec4/core'
import type { MouseEvent as ReactMouseEvent } from 'react'
import type { SetRequired, Simplify } from 'type-fest'
import type { XYFlowEdge, XYFlowNode } from './xyflow/types'
import type { XYBackground, XYBackgroundProps } from './xyflow/XYFlowBackground'

export type DiagramNodeWithNavigate = Simplify<SetRequired<DiagramNode, 'navigateTo'>>

export type OnNavigateTo = {
  (
    to: ViewID,
    event: ReactMouseEvent,
    element: DiagramNodeWithNavigate,
    xynode: XYFlowNode
  ): void
}
export type OnNodeClick = (
  event: {
    element: DiagramNode
    xynode: XYFlowNode
    event: ReactMouseEvent
  }
) => void
export type OnEdgeClick = (
  event: {
    relation: DiagramEdge
    xyedge: XYFlowEdge
    event: ReactMouseEvent
  }
) => void

/**
 * On pane/canvas click (not on any node or edge)
 */
export type OnCanvasClick = (event: ReactMouseEvent) => void

export namespace Changes {
  export interface ChangeElementStyle {
    op: 'change-element-style'
    style: {
      border?: BorderStyle
      opacity?: number
      shape?: ElementShape
      color?: ThemeColor
    }
    targets: NonEmptyArray<Fqn>
  }
}

export type Change = Changes.ChangeElementStyle

export type ChangeEvent = {
  changes: NonEmptyArray<Change>
}
export type OnChange = {
  (event: ChangeEvent): void
}
export type LikeC4ColorScheme = 'light' | 'dark'

export interface LikeC4DiagramProperties {
  view: DiagramView

  className?: string | undefined

  /**
   * Controls color scheme used for styling the flow
   * By default inherits from system or surrounding MantineProvider
   *
   * @example 'light' | 'dark'
   */
  // colorScheme?: LikeC4ColorScheme | undefined

  /**
   * Show/hide controls menu
   * @default false
   */
  controls?: boolean | undefined
  /**
   * Enable/disable panning
   * @default true
   */
  pannable?: boolean | undefined
  /**
   * Enable/disable zooming
   * @default true
   */
  zoomable?: boolean | undefined
  /**
   * Disable any editing (dragging still can be enabled with `nodesDraggable`)
   * @default true
   */
  readonly?: boolean | undefined
  /**
   * If set, initial viewport will show all nodes & edges
   * @default true
   */
  fitView?: boolean | undefined
  /**
   * Seems like this is percentage of the view size
   * @default 0
   */
  fitViewPadding?: number | undefined
  nodesSelectable?: boolean | undefined

  /**
   * @default false
   */
  nodesDraggable?: boolean | undefined

  initialWidth?: number | undefined
  initialHeight?: number | undefined

  /**
   * Keep aspect ratio of the diagram
   * @default false
   */
  keepAspectRatio?: boolean | undefined

  /**
   * Background pattern
   * @default 'dots'
   */
  background?: 'transparent' | 'solid' | XYBackground | undefined

  /**
   * Display hovercards with element links
   * @default true
   */
  showElementLinks?: boolean | undefined

  /**
   * Display panel with diagram title / description
   * @default true
   */
  showDiagramTitle?: boolean | undefined

  /**
   * If Walkthrough for dynamic views should be enabled
   * @default false
   */
  enableDynamicViewWalkthrough?: boolean | undefined

  /**
   * Experimental feature to enable edge editing
   * @default false
   */
  experimentalEdgeEditing?: boolean | undefined
}

export interface LikeC4DiagramEventHandlers {
  onChange?: OnChange | null | undefined
  onNavigateTo?: OnNavigateTo | null | undefined
  onNodeClick?: OnNodeClick | null | undefined
  onNodeContextMenu?: OnNodeClick | null | undefined
  onCanvasContextMenu?: OnCanvasClick | null | undefined
  onEdgeClick?: OnEdgeClick | null | undefined
  onEdgeContextMenu?: OnEdgeClick | null | undefined
  onCanvasClick?: OnCanvasClick | null | undefined
  onCanvasDblClick?: OnCanvasClick | null | undefined
}
