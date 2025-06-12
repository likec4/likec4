import type {
  Any,
  DiagramEdge,
  DiagramNode,
  LayoutedView,
  ViewChange,
  WhereOperator,
} from '@likec4/core/types'
import type * as aux from '@likec4/core/types/aux'
import type { ReactFlowProps as XYFlowProps } from '@xyflow/react'
import type { MouseEvent as ReactMouseEvent, ReactNode } from 'react'
import type { SetRequired } from 'type-fest'
import type { ControlsCustomLayout } from './context/ControlsCustomLayout'
import type { CustomNodes } from './custom/customNodes'

export type { CustomNodes, WhereOperator }

export type DiagramNodeWithNavigate<A extends Any> = SetRequired<DiagramNode<A>, 'navigateTo'>

type ElementIconRendererProps = {
  node: {
    id: string
    title: string
    icon?: string | null | undefined
  }
  className?: string
}

export type ElementIconRenderer = (props: ElementIconRendererProps) => ReactNode

export type OnNavigateTo<A extends Any> = (
  to: aux.ViewId<A>,
  // These fields present if navigateTo triggered by a node click
  event?: ReactMouseEvent,
  element?: DiagramNodeWithNavigate<A>,
) => void

export type OnNodeClick<A extends Any> = (
  node: DiagramNode<A>,
  event: ReactMouseEvent,
) => void

export type OnEdgeClick<A extends Any> = (
  edge: DiagramEdge<A>,
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

export type PaddingUnit = 'px' | '%'
export type PaddingWithUnit = `${number}${PaddingUnit}` | number

export interface LikeC4DiagramProperties<A extends aux.Any> {
  view: LayoutedView<A>

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
   * Padding around the diagram
   * @default '8px'
   */
  fitViewPadding?: PaddingWithUnit | undefined

  /**
   * @default false if readonly
   */
  nodesSelectable?: boolean | undefined

  /**
   * @default false if readonly
   */
  nodesDraggable?: boolean | undefined

  /**
   * Initial width of the diagram
   * (supposed to be used during SSR)
   */
  initialWidth?: number | undefined
  /**
   * Initial height of the diagram
   * (supposed to be used during SSR)
   */
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
   * Display notations in the bottom right corner
   * (Active if only notations are present)
   *
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
   * Display element tags in the bottom left corner
   * @default false
   */
  enableElementTags?: boolean | undefined

  /**
   * Experimental feature to enable edge editing
   * @default false
   */
  experimentalEdgeEditing?: boolean | undefined

  /**
   * Improve performance by hiding certain elements and reducing visual effects (disable mix-blend, shadows, animations)
   * Enable it if you have a large or static view
   *
   * @default 'auto' - will be `true` if view has more then 3000 * 2000 pixels
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
   * Override node renderers
   */
  renderNodes?: CustomNodes | undefined

  /**
   * Dynamic filter, applies both to nodes and edges
   */
  where?: WhereOperator<A> | undefined

  /**
   * Override ReactFlow props
   */
  reactFlowProps?: OverrideReactFlowProps | undefined
}

export type OpenSourceParams<A extends aux.Any = aux.Any> =
  | {
    element: aux.Fqn<A>
    property?: string
  }
  | {
    relation: aux.RelationId
  }
  | {
    deployment: aux.DeploymentFqn<A>
    property?: string
  }
  | {
    view: aux.StrictViewId<A>
  }

export interface LikeC4DiagramEventHandlers<A extends aux.Any> {
  onChange?: OnChange | null | undefined
  onNavigateTo?: OnNavigateTo<A> | null | undefined
  onNodeClick?: OnNodeClick<A> | null | undefined
  onNodeContextMenu?: OnNodeClick<A> | null | undefined
  onCanvasContextMenu?: OnCanvasClick | null | undefined
  onEdgeClick?: OnEdgeClick<A> | null | undefined
  onEdgeContextMenu?: OnEdgeClick<A> | null | undefined
  onCanvasClick?: OnCanvasClick | null | undefined
  onCanvasDblClick?: OnCanvasClick | null | undefined

  // if set, will render a burger menu icon in the top left corner
  onBurgerMenuClick?: null | undefined | (() => void)

  onOpenSource?: null | undefined | ((params: OpenSourceParams<A>) => void)
}
