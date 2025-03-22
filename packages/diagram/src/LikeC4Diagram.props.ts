import type {
  DiagramEdge,
  DiagramNode,
  DiagramView,
  Fqn,
  RelationId,
  ViewChange,
  ViewId,
  WhereOperator,
} from '@likec4/core'
import type { ReactFlowProps as XYFlowProps } from '@xyflow/react'
import type { MouseEvent as ReactMouseEvent, ReactNode } from 'react'
import type { ControlsCustomLayout } from './context/ControlsCustomLayout'

export type { WhereOperator }

export type DiagramNodeWithNavigate<ID = ViewId> = Omit<DiagramNode, 'navigateTo'> & {
  navigateTo: ID
}

type ElementIconRendererProps = {
  node: {
    id: string
    title: string
    icon?: string | null | undefined
  }
}

export type ElementIconRenderer = (props: ElementIconRendererProps) => ReactNode

export type OnNavigateTo<ID = ViewId> = (
  to: ID,
  // These fields present if navigateTo triggered by a node click
  event?: ReactMouseEvent,
  element?: DiagramNodeWithNavigate<ID>,
) => void

export type OnNodeClick = (
  node: DiagramNode,
  event: ReactMouseEvent,
) => void

export type OnEdgeClick = (
  edge: DiagramEdge,
  event: ReactMouseEvent,
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

export type OverrideReactFlowProps = Pick<
  XYFlowProps,
  | 'paneClickDistance'
  | 'nodeClickDistance'
  | 'selectionKeyCode'
  | 'panActivationKeyCode'
  | 'multiSelectionKeyCode'
  | 'zoomActivationKeyCode'
  | 'snapToGrid'
  | 'snapGrid'
  | 'onlyRenderVisibleElements'
  | 'nodesDraggable'
  | 'nodesFocusable'
  | 'elementsSelectable'
  | 'selectNodesOnDrag'
  | 'panOnDrag'
  | 'preventScrolling'
  | 'zoomOnScroll'
  | 'zoomOnPinch'
  | 'panOnScroll'
  | 'panOnScrollSpeed'
  | 'panOnScrollMode'
  | 'zoomOnDoubleClick'
  | 'nodeDragThreshold'
>

export interface LikeC4DiagramProperties {
  view: DiagramView

  className?: string | undefined

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
   * Show/hide panel with top left controls,
   *
   * @default true if not readonly
   */
  controls?: boolean | undefined
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
   * Background pattern
   * @default 'dots'
   */
  background?: 'transparent' | 'solid' | 'dots' | 'lines' | 'cross' | undefined

  /**
   * Display webview with diagram title / description
   * @default true
   */
  showDiagramTitle?: boolean | undefined

  /**
   * Show back/forward history navigation buttons
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
   * @default false
   */
  enableRelationshipDetails?: boolean | undefined

  /**
   * If double click on a node should enable focus mode, i.e. highlight incoming/outgoing edges
   * @default false
   */
  enableFocusMode?: boolean | undefined

  /**
   * Enable search popup for elements and views
   * @default true
   */
  enableSearch?: boolean | undefined

  /**
   * Enable modal with element details
   * @default false
   */
  enableElementDetails?: boolean | undefined

  /**
   * Experimental feature to browse relationships
   *
   * @default false
   */
  enableRelationshipBrowser?: boolean | undefined

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
   * Improve performance by hiding certain elements and reducing visual effects (disable mix-blend, shadows, animations)
   *
   * @default 'auto' - will be set to true if view has more then 3000 * 2000 pixels
   */
  reduceGraphics?: 'auto' | boolean | undefined

  /**
   * Render icon for an element, bundled or remote
   * By default, if icon is http:// or https://, it will be rendered as an image
   */
  renderIcon?: ElementIconRenderer | undefined

  /**
   * Customize layout of the controls on the top left
   */
  renderControls?: ControlsCustomLayout | undefined

  /**
   * Dynamic filter, applies both to nodes and edges
   */
  where?: WhereOperator<string, string> | undefined

  /**
   * Override ReactFlow props
   */
  reactFlowProps?: OverrideReactFlowProps | undefined
}

export type OpenSourceParams =
  | {
    element: Fqn
    property?: string
  }
  | {
    relation: RelationId
  }
  | {
    deployment: Fqn
    property?: string
  }
  | {
    view: ViewId
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

  onOpenSource?: null | undefined | ((params: OpenSourceParams) => void)
}
