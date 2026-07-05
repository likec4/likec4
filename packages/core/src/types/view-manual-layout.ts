import type { Simplify } from 'type-fest'
import type { BBox } from '../geometry/bbox'
import type { IsAnyOrNever } from './_common'
import type { _stage, _type } from './const'
import type * as scalar from './scalar'
import type {
  ViewAutoLayout,
  ViewType,
  ViewWithNotation,
} from './view-common'
import type { DynamicViewFlowData } from './view-dynamic-flow'
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
  | 'label-changed' // title/description/technology/icon/iconStyle changed
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

type ViewManualLayoutSnapshotPerType = Simplify<
  & {
    readonly id: scalar.ViewId
    readonly title: string | null
    readonly description: scalar.MarkdownOrString | null
    readonly [_stage]: 'layouted'
    // Object hash of previous layout
    readonly hash: string
    readonly nodes: ReadonlyArray<DiagramNode>
    readonly edges: ReadonlyArray<DiagramEdge>
    readonly bounds: BBox
    readonly autoLayout: ViewAutoLayout
  }
  & ViewWithNotation
  & (
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
      readonly flow?: DynamicViewFlowData
      readonly sequenceLayout: LayoutedDynamicView.Sequence.Layout
    }
  )
>

/**
 * Snapshot of a view's manual layout.
 *
 * When Type is `any`, returns the union of all possible snapshot types.
 * When Type is a specific view type, returns the corresponding snapshot type.
 */
// export type ViewManualLayoutSnapshot = ViewManualLayoutSnapshotPerType
export type ViewManualLayoutSnapshot<Type extends ViewType = ViewType> =
  // dprint-ignore
  IsAnyOrNever<Type> extends true
    ? never
    : Type extends infer T extends string
      ? Extract<ViewManualLayoutSnapshotPerType, { [_type]: T }>
      : ViewManualLayoutSnapshotPerType
