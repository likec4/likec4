import type { NonEmptyArray } from './_common'
import type * as aux from './aux'
import type { AnyAux } from './aux'
import type { _stage, _type } from './const'
import type { BBox, Point, XYPoint } from './geometry'
import type {
  BaseViewProperties,
  ViewAutoLayout,
  ViewWithHash,
  ViewWithNotation,
} from './view-common'
import type { ComputedEdge, ComputedNode } from './view-computed'

export interface DiagramNode<A extends AnyAux = AnyAux> extends ComputedNode<A>, BBox {
  x: number
  y: number
  width: number
  height: number
  /**
   * Absolute position, top left
   * @deprecated Use `x` and `y` instead
   */
  position: Point
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
}

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
}
