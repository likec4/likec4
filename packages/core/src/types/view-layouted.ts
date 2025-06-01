import type { NonEmptyArray } from './_common'
import type * as aux from './aux'
import type { AnyAux, Unknown } from './aux'
import type { BBox, Point, XYPoint } from './geometry'
import type {
  ViewAutoLayout,
  ViewBaseProperties,
  ViewTypeDiscriminator,
  ViewWithHash,
  ViewWithNotation,
} from './view-common'
import type { ComputedEdge, ComputedNode } from './view-computed'

export interface DiagramNode<A extends AnyAux = Unknown> extends ComputedNode<A>, BBox {
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

export interface DiagramEdge<A extends AnyAux = Unknown> extends ComputedEdge<A> {
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

interface AnyLayoutedView<A extends AnyAux, Type extends ViewTypeDiscriminator>
  extends ViewBaseProperties<A, 'layouted', Type>, ViewWithHash, ViewWithNotation
{
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

export interface LayoutedElementView<A extends AnyAux = Unknown> extends AnyLayoutedView<A, 'element'> {
  readonly viewOf?: aux.StrictFqn<A>
  readonly extends?: aux.StrictViewId<A>
}

export interface LayoutedDeploymentView<A extends AnyAux = Unknown> extends AnyLayoutedView<A, 'deployment'> {
}

export interface LayoutedDynamicView<A extends AnyAux = Unknown> extends AnyLayoutedView<A, 'dynamic'> {
}
