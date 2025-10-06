import type { Simplify } from 'type-fest'
import type * as aux from './_aux'
import type { AnyAux } from './_aux'
import type { _stage, _type } from './const'
import type { BBox } from './geometry'
import type {
  ViewAutoLayout,
  ViewType,
  ViewWithNotation,
} from './view-common'
import type { DiagramEdge, DiagramNode, LayoutedDynamicView } from './view-layouted'
// import type { DynamicViewDisplayVariant } from './view-parsed.dynamic'

// export type DiagramNodeDriftReason =
//   | 'not-exists'
//   | 'properties-changed'
//   | 'relationships-changed'
//   | 'shape-changed'

type ViewManualLayoutSnapshotPerType<A extends AnyAux> =
  | {
    readonly [_type]: 'element'
    readonly viewOf?: aux.Fqn<A>
    readonly extends?: aux.StrictViewId<A>
  }
  | {
    readonly [_type]: 'deployment'
  }
  | {
    readonly [_type]: 'dynamic'
    readonly sequenceLayout: LayoutedDynamicView.Sequence.Layout
  }

export type ViewManualLayoutSnapshot<
  A extends AnyAux = AnyAux,
  Type extends ViewType = ViewType,
> = Simplify<
  & ViewManualLayoutSnapshotPerType<A>
  & {
    readonly [_type]: Type
    readonly [_stage]: 'layouted'
    // Object hash of previous layout
    readonly hash: string
    readonly nodes: DiagramNode<A>[]
    readonly edges: DiagramEdge<A>[]
    readonly bounds: BBox
    readonly autoLayout: ViewAutoLayout
  }
  & ViewWithNotation
>

// export type DiagramNodeDriftReason =
//   | 'not-exists'
//   | 'properties-changed'
//   | 'relationships-changed'
//   | 'shape-changed'
