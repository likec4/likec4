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
import type { XYBackground } from './xyflow/XYFlowBackground'

export type { WhereOperator }

export type DiagramNodeWithNavigate<ID extends string = ViewID> = Omit<DiagramNode, 'navigateTo'> & {
  navigateTo: ID
}

type ElementIconNodeProps = {
  id: string
  title: string
  icon?: string | undefined
}

export type ElementIconRenderer = (props: {
  node: ElementIconNodeProps
}) => ReactNode

export type OnNavigateTo<ID extends string = ViewID> = (
  to: ID,
  // These fields present if navigateTo triggered by a node click
  event?: ReactMouseEvent,
  element?: DiagramNodeWithNavigate<ID>
) => void

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
export type OnChange = (event: ChangeEvent) => void

export type LikeC4ColorScheme = 'light' | 'dark'

export interface LikeC4DiagramProperties {
  view: DiagramView

  className?: string | undefined

  /**
   * Show/hide ReactFlow controls menu
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

  /**
   * @default false if readonly
   */
  nodesSelectable?: boolean | undefined

  /**
   * @default false if readonly
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
   * Display webview with diagram title / description
   * @default true
   */
  showDiagramTitle?: boolean | undefined

  /**
   * Show back/forward navigation buttons
   * @default true if `onNavigateTo` is set
   */
  showNavigationButtons?: undefined | boolean

  /**
   * Display notations of the view
   * @default true
   */
  showNotations?: boolean | undefined

  /**
   * Display dropdown with details on relationship's label click
   * @default true
   */
  showRelationshipDetails?: boolean | undefined

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
   * Render icon for an element, bundled or remote
   * By default, if icon is http:// or https://, it will be rendered as an image
   */
  renderIcon?: ElementIconRenderer | undefined

  /**
   * Dynamic filter, applies both to nodes and edges
   */
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

  // if set, will render a burger menu icon in the top left corner
  onBurgerMenuClick?: null | undefined | (() => void)

  // if set, will render a source code icon in the top left corner
  onOpenSourceView?: null | undefined | (() => void)

  // if set, will render an icon in properties webview for each element
  onOpenSourceElement?: null | undefined | ((fqn: Fqn) => void)

  // if set, will be called on edge click
  onOpenSourceRelation?: null | undefined | ((id: RelationID) => void)
}
