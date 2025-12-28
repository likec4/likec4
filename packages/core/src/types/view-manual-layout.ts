import type { Simplify } from 'type-fest'
import type { BBox } from '../geometry'
import type { scalar } from '.'
import type { _stage, _type } from './const'
import type {
  ViewAutoLayout,
  ViewType,
  ViewWithNotation,
} from './view-common'
import type { DiagramEdge, DiagramNode, LayoutedDynamicView } from './view-layouted'

export type LayoutedViewDriftReason =
  | 'not-exists'
  | 'type-changed'
  | 'nodes-added'
  | 'nodes-removed'
  | 'nodes-drift' // exists in both versions, but with layout differences
  | 'edges-added'
  | 'edges-removed'
  | 'edges-drift' // exists in both versions, but with layout differences

export type DiagramNodeDriftReason =
  | 'removed' // exists in snapshot but not in latest
  | 'added' // exists in latest but not in snapshot
  | 'label-changed' // title/description/technology/icon changed
  | 'modelRef-changed'
  | 'parent-changed'
  | 'children-changed'
  | 'became-compound'
  | 'became-leaf'
  | 'shape-changed'

export type DiagramEdgeDriftReason =
  | 'removed' // exists in snapshot but not in latest
  | 'added' // exists in latest but not in snapshot
  | 'label-added'
  | 'label-removed'
  | 'label-changed'
  | 'notes-changed'
  | 'direction-changed'
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
    readonly nodes: ReadonlyArray<DiagramNode>
    readonly edges: ReadonlyArray<DiagramEdge>
    readonly bounds: BBox
    readonly autoLayout: ViewAutoLayout
  }
  & ViewWithNotation
>
