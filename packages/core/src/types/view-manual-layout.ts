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

export type LayoutedViewDriftReason =
  | 'not-exists'
  | 'type-changed'
  | 'nodes-mismatch'
  | 'edges-mismatch'

export type DiagramNodeDriftReason =
  | 'missing' // exists in snapshot but not in view, and visa versa
  | 'label-changed' // title/description/technology/icon changed
  | 'modelRef-changed'
  | 'parent-changed'
  | 'children-changed'
  | 'became-compound'
  | 'became-leaf'
  | 'shape-changed'

export type DiagramEdgeDriftReason =
  | 'missing' // exists in snapshot but not in view, and visa versa
  | 'label-changed' // title/description/technology changed
  | 'direction-changed' // has different source/target
  | 'source-changed'
  | 'target-changed'

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
