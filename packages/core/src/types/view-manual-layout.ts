import type { Simplify } from 'type-fest'
import type { scalar } from '.'
import type { _stage, _type } from './const'
import type { BBox } from './geometry'
import type {
  ViewAutoLayout,
  ViewType,
  ViewWithNotation,
} from './view-common'
import type { DiagramEdge, DiagramNode, LayoutedDynamicView } from './view-layouted'
// import type { DynamicViewDisplayVariant } from './view-parsed.dynamic'

export type DiagramNodeDriftReason =
  | 'not-exists' // exists in snapshot but not in view, and visa versa
  | 'properties-changed'
  | 'relationships-changed'
  | 'shape-changed'

type ViewManualLayoutSnapshotPerType =
  | {
    readonly [_type]: 'element'
    readonly viewOf?: scalar.Fqn
    readonly extends?: scalar.ViewId
  }
  | {
    readonly [_type]: 'deployment'
  }
  | {
    readonly [_type]: 'dynamic'
    readonly sequenceLayout: LayoutedDynamicView.Sequence.Layout
  }

export type ViewManualLayoutSnapshot<
  Type extends ViewType = ViewType,
> = Simplify<
  & ViewManualLayoutSnapshotPerType
  & {
    readonly id: scalar.ViewId
    readonly title: string | null
    readonly description: scalar.MarkdownOrString | null
    readonly [_type]: Type
    readonly [_stage]: 'layouted'
    // Object hash of previous layout
    readonly hash: string
    readonly nodes: DiagramNode[]
    readonly edges: DiagramEdge[]
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
