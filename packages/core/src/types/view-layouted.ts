import type * as aux from './_aux'
import type { AnyAux } from './_aux'
import type { NonEmptyArray } from './_common'
import type { _stage, _type } from './const'
import type { BBox, Point, XYPoint } from './geometry'
import type {
  BaseViewProperties,
  ViewAutoLayout,
  ViewWithHash,
  ViewWithNotation,
} from './view-common'
import type { ComputedEdge, ComputedNode } from './view-computed'
import type { ViewManualLayoutSnapshot } from './view-manual-layout'
import type { DynamicViewDisplayVariant } from './view-parsed.dynamic'

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

export type LayoutedViewDriftReason =
  | 'not-exists'
  | 'type-changed'
  | 'includes-more-nodes'
  | 'includes-more-edges'
  | 'nodes-drift'
  | 'edges-drift'

interface BaseLayoutedViewProperties<A extends AnyAux> extends BaseViewProperties<A>, ViewWithHash, ViewWithNotation {
  readonly [_stage]: 'layouted'
  readonly autoLayout: ViewAutoLayout
  readonly nodes: DiagramNode<A>[]
  readonly edges: DiagramEdge<A>[]
  readonly bounds: BBox

  /**
   * If diagram has manual layout
   * But was changed and layout should be recalculated
   */
  hasLayoutDrift?: boolean

  drifts?: LayoutedViewDriftReason[]
}

export interface LayoutedElementView<A extends AnyAux = AnyAux> extends BaseLayoutedViewProperties<A> {
  readonly [_type]: 'element'
  readonly viewOf?: aux.Fqn<A>
  readonly extends?: aux.StrictViewId<A>

  /**
   * If the view is changed manually this field contains the layout data.
   */
  readonly manualLayout?: ViewManualLayoutSnapshot<'element'>
}

export interface LayoutedDeploymentView<A extends AnyAux = AnyAux> extends BaseLayoutedViewProperties<A> {
  readonly [_type]: 'deployment'

  /**
   * If the view is changed manually this field contains the layout data.
   */
  readonly manualLayout?: ViewManualLayoutSnapshot<'deployment'>
}

export interface LayoutedDynamicView<A extends AnyAux = AnyAux> extends BaseLayoutedViewProperties<A> {
  readonly [_type]: 'dynamic'
  /**
   * How to display the dynamic view
   * - `diagram`: display as a regular likec4 view
   * - `sequence`: display as a sequence diagram
   */
  readonly variant: DynamicViewDisplayVariant

  /**
   * Sequence layout of this dynamic view
   */
  readonly sequenceLayout: LayoutedDynamicView.Sequence.Layout

  /**
   * If the view is changed manually this field contains the layout data.
   */
  readonly manualLayout?: ViewManualLayoutSnapshot<'dynamic'>
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
