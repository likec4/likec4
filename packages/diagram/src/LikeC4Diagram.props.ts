import type { DiagramEdge, DiagramNode, DiagramView, ElementShape, Fqn, NonEmptyArray, ThemeColor } from '@likec4/core'
import type { SetRequired, Simplify } from 'type-fest'
import type { XYFlowEdge, XYFlowNode } from './xyflow/types'
import type { XYBackgroundProps } from './xyflow/XYFlowBackground'

export type DiagramNodeWithNavigate = Simplify<SetRequired<DiagramNode, 'navigateTo'>>

export type OnNavigateTo = (
  event: {
    element: DiagramNodeWithNavigate
    xynode: XYFlowNode
    event: React.MouseEvent
  }
) => void
export type OnNodeClick = (
  event: {
    element: DiagramNode
    xynode: XYFlowNode
    event: React.MouseEvent
  }
) => void
export type OnEdgeClick = (
  event: {
    relation: DiagramEdge
    xyedge: XYFlowEdge
    event: React.MouseEvent
  }
) => void

/**
 * On pane/canvas click (not on any node or edge)
 */
export type OnCanvasClick = (event: React.MouseEvent) => void

export namespace Changes {
  export interface ChangeColor {
    op: 'change-color'
    color: ThemeColor
    targets: NonEmptyArray<Fqn>
  }

  export interface ChangeShape {
    op: 'change-shape'
    shape: ElementShape
    targets: NonEmptyArray<Fqn>
  }
}

export type Change =
  | Changes.ChangeColor
  | Changes.ChangeShape

export type ChangeEvent = {
  changes: NonEmptyArray<Change>
}
export type OnChange = (event: ChangeEvent) => void
export type LikeC4ColorMode = 'light' | 'dark'

export interface LikeC4DiagramProperties {
  view: DiagramView

  className?: string | undefined

  /**
   * Controls color scheme used for styling the flow
   * By default inherits from system or surrounding MantineProvider
   *
   * @example 'light' | 'dark'
   */
  colorMode?: LikeC4ColorMode | undefined

  /**
   * Show/hide controls menu
   * @default true
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
   * @default false
   */
  readonly?: boolean | undefined
  /**
   * If set, initial viewport will show all nodes & edges
   * @default true
   */
  fitView?: boolean | undefined
  /**
   * Seems like this is percentage of the view size
   * @default 0.05
   */
  fitViewPadding?: number | undefined
  nodesSelectable?: boolean | undefined
  nodesDraggable?: boolean | undefined

  /**
   * Background pattern
   * @default 'dots'
   */
  background?: 'transparent' | 'solid' | XYBackgroundProps | undefined

  /**
   * Disable element hovercards, such as links and properties
   * @default false
   */
  disableHovercards?: boolean | undefined
}

export interface LikeC4DiagramEventHandlers {
  onChange?: OnChange | undefined
  onNavigateTo?: OnNavigateTo | undefined
  onNodeClick?: OnNodeClick | undefined
  onNodeContextMenu?: OnNodeClick | undefined
  onCanvasContextMenu?: OnCanvasClick | undefined
  onEdgeClick?: OnEdgeClick | undefined
  onEdgeContextMenu?: OnEdgeClick | undefined
  onCanvasClick?: OnCanvasClick | undefined
  onCanvasDblClick?: OnCanvasClick | undefined
}
