import type * as t from '@likec4/core/types'
import type {
  DiagramEdge,
  DiagramNode,
  DynamicViewDisplayVariant,
  LayoutedView,
  LayoutType,
  ViewChange,
  WhereOperator,
} from '@likec4/core/types'
import type { ReactFlowProps } from '@xyflow/react'
import type { MouseEvent as ReactMouseEvent, ReactNode } from 'react'
import type { CamelCasedProperties, SetRequired } from 'type-fest'
import type { DiagramApi } from './hooks/useDiagram'
import type { XYFlowInstance } from './hooks/useXYFlow'
import type { Types } from './likec4diagram/types'

type Any = t.aux.Any
type Unknown = t.aux.UnknownLayouted
type ViewId<A> = t.aux.ViewId<A>
type Fqn<A> = t.aux.Fqn<A>
type RelationId = t.aux.RelationId
type DeploymentFqn<A> = t.aux.DeploymentFqn<A>
type StrictViewId<A> = t.aux.StrictViewId<A>

export type NodeRenderers = Partial<CamelCasedProperties<Types.NodeRenderers>>

export type { WhereOperator }

export type DiagramNodeWithNavigate<A extends Any = Unknown> = SetRequired<DiagramNode<A>, 'navigateTo'>

export type ElementIconRendererProps = {
  node: {
    id: string
    title: string
    icon?: string | null | undefined
  }
  className?: string
}

export type ElementIconRenderer = (props: ElementIconRendererProps) => ReactNode

export type LikeC4ColorScheme = 'light' | 'dark'

export type OverrideReactFlowProps = Pick<
  ReactFlowProps<Types.AnyNode, Types.AnyEdge>,
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

/**
 * Padding around the diagram
 *
 * @example
 * {
 *   top: '8px',
 *   right: '8px',
 *   bottom: '8px',
 *   left: '8px',
 * }
 */
export type ViewPadding = PaddingWithUnit | {
  top?: PaddingWithUnit
  right?: PaddingWithUnit
  bottom?: PaddingWithUnit
  left?: PaddingWithUnit
  x?: PaddingWithUnit
  y?: PaddingWithUnit
}

export interface LikeC4DiagramProperties<A extends Any = Unknown> {
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
   * Show/hide panel with top left controls
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
   *
   * @see {@link ViewPadding}
   *
   * @example
   * ```tsx
   * <LikeC4Diagram
   *   fitViewPadding={{
   *     x: '16px',
   *     y: '16px',
   *   }}
   * />
   *
   * <LikeC4Diagram
   *   fitViewPadding={{
   *     top: '8px',
   *     right: '8px',
   *     bottom: '8px',
   *     left: '8px',
   *   }}
   * />
   * ```
   */
  fitViewPadding?: ViewPadding | undefined

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
   * Enable "Compare with auto layout" action when view was manually modified and out of sync with latest model
   * @default false
   */
  enableCompareWithLatest?: boolean | undefined

  /**
   * Default dynamic view display variant
   * @default 'diagram'
   */
  dynamicViewVariant?: DynamicViewDisplayVariant | undefined

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
   * - `auto` - will be `true` if view has more then 3000 * 2000 pixels
   *
   * @default 'auto'
   */
  reduceGraphics?: 'auto' | boolean | undefined

  /**
   * Render icon for an element, bundled or remote
   * By default, if icon is http:// or https://, it will be rendered as an image
   */
  renderIcon?: ElementIconRenderer | undefined

  /**
   * Override node renderers
   */
  renderNodes?: NodeRenderers | undefined

  /**
   * Dynamic filter, applies both to nodes and edges
   */
  where?: WhereOperator<A> | undefined

  /**
   * Override ReactFlow props
   */
  reactFlowProps?: OverrideReactFlowProps | undefined
}

export type OpenSourceParams<A extends Any = Unknown> =
  | {
    element: Fqn<A>
    property?: string
  }
  | {
    relation: RelationId
  }
  | {
    deployment: DeploymentFqn<A>
    property?: string
  }
  | {
    view: StrictViewId<A>
  }
  | { // Dynamic view step
    view: StrictViewId<A>
    astPath: string
  }

/**
 * "Go to source" action
 */
export type OnOpenSource<A extends Any = Unknown> = (params: OpenSourceParams<A>) => void

export type OnNavigateTo<A extends Any = Unknown> = (
  to: ViewId<A>,
  // These fields present if navigateTo triggered by a node click
  event?: ReactMouseEvent,
  element?: DiagramNodeWithNavigate<A>,
) => void

export type OnNodeClick<A extends Any = Unknown> = (
  node: DiagramNode<A>,
  event: ReactMouseEvent,
) => void

export type OnEdgeClick<A extends Any = Unknown> = (
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

export type OnInitialized = (params: { diagram: DiagramApi; xyflow: XYFlowInstance }) => void

export type OnLayoutTypeChange = (layoutType: LayoutType) => void

export interface LikeC4DiagramEventHandlers<A extends Any = Unknown> {
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

  onOpenSource?: OnOpenSource<A> | null | undefined

  onInitialized?: OnInitialized | null | undefined

  /**
   * Triggered when user changes layout type (e.g. from 'manual' to 'auto')
   * Expected another `view` to be passed to the diagram
   *
   * @param layoutType new layout type
   */
  onLayoutTypeChange?: OnLayoutTypeChange | null | undefined
}
