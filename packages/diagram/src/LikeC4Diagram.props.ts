import type {
  DiagramEdge,
  DiagramNode,
  DiagramView,
  Fqn,
  RelationID,
  ViewChange,
  ViewID,
  WhereOperator
} from '@likec4/core'
import type { MouseEvent as ReactMouseEvent, ReactNode } from 'react'
import type { XYFlowEdge, XYFlowNode } from './xyflow/types'
import type { XYBackground } from './xyflow/XYFlowBackground'

export type { WhereOperator }

export type DiagramNodeWithNavigate = Omit<DiagramNode, 'navigateTo'> & {
  navigateTo: ViewID
}

type ElementIconNodeProps = {
  id: string
  title: string
  icon?: string | undefined
}

export type ElementIconRenderer = (props: {
  node: ElementIconNodeProps
}) => ReactNode

export type OnNavigateTo = {
  (
    to: ViewID,
    // These fields present if navigateTo triggered by a node click
    event?: ReactMouseEvent,
    element?: DiagramNodeWithNavigate
  ): void
}
export type OnNodeClick = (
  node: DiagramNode,
  event: ReactMouseEvent
) => void
export type OnEdgeClick = (
  edge: DiagramEdge,
  event: ReactMouseEvent
) => void

/**
 * On pane/canvas click (not on any node or edge)
 */
export type OnCanvasClick = (event: ReactMouseEvent) => void

export type ChangeEvent = {
  change: ViewChange
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
   * Show back/forward navigation buttons
   * @default false
   */
  showNavigationButtons?: undefined | boolean

  /**
   * Display notations of the view
   * @default true
   */
  showNotations?: boolean | undefined

  /**
   * If double click on a node should enable focus mode, i.e. highlight incoming/outgoing edges
   * @default true
   */
  enableFocusMode?: boolean | undefined

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

  /**
   * Render custom icon for a node
   * By default, if icon is http:// or https://, it will be rendered as an image
   */
  renderIcon?: ElementIconRenderer | undefined

  where?: WhereOperator<string, string> | undefined
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

  onBurgerMenuClick?: null | undefined | (() => void)
  onOpenSourceView?: null | undefined | (() => void)
  onOpenSourceElement?: null | undefined | ((fqn: Fqn) => void)
  onOpenSourceRelation?: null | undefined | ((id: RelationID) => void)
}
