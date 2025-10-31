import type * as aux from './_aux'
import type { AnyAux } from './_aux'
import type { NonEmptyArray, NonEmptyReadonlyArray } from './_common'
import type { _layout, _stage, _type } from './const'
import type { BBox, Point, XYPoint } from './geometry'
import type {
  BaseViewProperties,
  ViewAutoLayout,
  ViewWithHash,
  ViewWithNotation,
} from './view-common'
import type { ComputedEdge, ComputedNode } from './view-computed'
import type { DynamicViewDisplayVariant } from './view-parsed.dynamic'

export type DiagramNodeDriftReason =
  | 'not-exists' // exists in snapshot but not in view, and visa versa
  | 'label-changed' // title/description/technology changed
  | 'relationships-changed' // has different inEdges/outEdges
  | 'parent-changed'
  | 'children-changed'
  | 'become-compound'
  | 'become-leaf'
  | 'shape-changed'
  | 'size-changed'
  | 'position-changed'

export interface DiagramNode<A extends AnyAux = AnyAux> extends ComputedNode<A>, BBox {
  /**
   * Absolute X coordinate
   */
  x: number
  /**
   * Absolute Y coordinate
   */
  y: number
  width: number
  height: number
  /**
   * Bounding box of label
   * (Absolute coordinates)
   */
  labelBBox: BBox

  /**
   * List of reasons causing node drift
   */
  drifts?: NonEmptyReadonlyArray<DiagramNodeDriftReason> | null
}

export interface DiagramEdge<A extends AnyAux = AnyAux> extends ComputedEdge<A> {
  /**
   * Bezier points
   * (Absolute coordinates)
   */
  points: NonEmptyArray<Point>
  /**
   * Control points to adjust the edge
   * (Absolute coordinates)
   */
  controlPoints?: NonEmptyArray<XYPoint>
  /**
   * Bounding box of label
   * (Absolute coordinates)
   */
  labelBBox?: BBox | null
  /**
   * Graphviz edge POS
   *
   * TODO: temporary solution, should be moved out
   * @deprecated
   */
  dotpos?: string
  // label: scalar.HtmlOrString | null
  // description?: scalar.HtmlOrString | null
  // technology?: scalar.HtmlOrString | null
  // notation?: scalar.HtmlOrString | null
  // notes?: scalar.HtmlOrString | null
}

/**
 * Type of the layout
 * - `auto`: auto-layouted from the current sources
 * - `manual`: read from the manually layouted snapshot
 */
export type LayoutType = 'auto' | 'manual'

export type LayoutedViewDriftReason =
  | 'not-exists'
  | 'type-changed'
  | 'includes-more-nodes'
  | 'includes-more-edges'
  | 'nodes-mismatch'
  | 'edges-mismatch'

interface BaseLayoutedViewProperties<A extends AnyAux> extends BaseViewProperties<A>, ViewWithHash, ViewWithNotation {
  readonly [_stage]: 'layouted'
  /**
   * If undefined, view does not have any manual layouts, and is auto-layouted
   */
  readonly [_layout]?: LayoutType
  readonly autoLayout: ViewAutoLayout
  readonly nodes: DiagramNode<A>[]
  readonly edges: DiagramEdge<A>[]
  readonly bounds: BBox

  /**
   * If diagram has manual layout
   * But was changed and layout should be recalculated
   * @deprecated manual layout v2 uses {@link drifts}
   */
  readonly hasLayoutDrift?: boolean

  /**
   * List of reasons causing layout drift
   * If undefined, there is no layout drift or view is auto-layouted
   * May be empty array if {@link _layout} is 'manual', but view did not change
   */
  readonly drifts?: ReadonlyArray<LayoutedViewDriftReason>
}

export interface LayoutedElementView<A extends AnyAux = AnyAux> extends BaseLayoutedViewProperties<A> {
  readonly [_type]: 'element'
  readonly viewOf?: aux.Fqn<A>
  readonly extends?: aux.StrictViewId<A>
}

export interface LayoutedDeploymentView<A extends AnyAux = AnyAux> extends BaseLayoutedViewProperties<A> {
  readonly [_type]: 'deployment'
}

export interface LayoutedDynamicView<A extends AnyAux = AnyAux> extends BaseLayoutedViewProperties<A> {
  readonly [_type]: 'dynamic'
  /**
   * Default variant of this dynamic view
   * - `diagram`: display as a regular likec4 view (default if not specified)
   * - `sequence`: display as a sequence diagram
   */
  readonly variant: DynamicViewDisplayVariant

  /**
   * Sequence layout of this dynamic view
   */
  readonly sequenceLayout: LayoutedDynamicView.Sequence.Layout
}

export namespace LayoutedDynamicView {
  export namespace Sequence {
    export interface ActorPort {
      readonly id: string // edge.id + '_' + type
      readonly cx: number // center x
      readonly cy: number // center y
      readonly height: number
      readonly type: 'target' | 'source'
      readonly position: 'left' | 'right' | 'top' | 'bottom'
    }

    export interface Actor {
      readonly id: aux.NodeId
      readonly x: number
      readonly y: number
      readonly width: number
      readonly height: number
      readonly ports: ReadonlyArray<ActorPort>
    }

    export interface Compound {
      readonly id: aux.NodeId
      /**
       * Original node id, since multiple compound nodes can be built from one node
       */
      readonly origin: aux.NodeId
      readonly x: number
      readonly y: number
      readonly width: number
      readonly height: number
      readonly depth: number
    }

    export interface ParallelArea {
      readonly parallelPrefix: string
      readonly x: number
      readonly y: number
      readonly width: number
      readonly height: number
    }

    export interface Step {
      readonly id: aux.EdgeId
      readonly labelBBox?: { width: number; height: number } | undefined
      readonly sourceHandle: string
      readonly targetHandle: string
    }

    export interface Layout {
      readonly actors: ReadonlyArray<Actor>
      /**
       * Steps in the sequence diagram (filtered edges with compound nodes)
       */
      readonly steps: ReadonlyArray<Step>
      readonly compounds: ReadonlyArray<Compound>
      readonly parallelAreas: ReadonlyArray<ParallelArea>
      readonly bounds: BBox
    }
  }
}
