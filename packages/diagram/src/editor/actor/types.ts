import type * as t from '@likec4/core/types'
import type { Types } from '../../likec4diagram/types'
import type { HotKeyEvent } from './hotkey'

export type EditorActorEvent =
  // Add change to queue
  | { type: 'change.view'; change: t.ViewChange }
  | { type: 'change.semantic-layout' }
  | { type: 'change.latest-to-manual' }
  | { type: 'change.sync-snapshot' }
  | { type: 'delete.nodes-edges'; nodeIds: t.NodeId[]; edgeIds: t.EdgeId[] }
  // view update has been received, consider synced
  | { type: 'view.synched' }
  | { type: 'cancel' }
  // Edit events
  | { type: 'edit.move.start'; subject: 'node' | 'edge' }
  | { type: 'edit.move.end' }
  | { type: 'edit.move.cancel' } // Cancel current editing
  | HotKeyEvent

export type Snapshot = {
  view: t.LayoutedView
  change: t.ViewChange.SaveViewSnapshot
  xynodes: Types.Node[]
  xyedges: Types.Edge[]
}

export type LinkedSnapshot = {
  head: Snapshot
  tail: LinkedSnapshot | null
}

export interface EditorActorInput {
  viewId: t.ViewId
}

export type SyncOp =
  | t.ViewChange
  | 'sync-snapshot'
  | 'apply-semantic-layout'
  | 'apply-latest-to-manual'

export const isViewChange = (change: SyncOp | null): change is t.ViewChange =>
  change !== null && typeof change !== 'string'

export interface EditorActorContext {
  viewId: t.ViewId

  // Undo history
  history: LinkedSnapshot | null

  // Redo history
  redo: LinkedSnapshot | null

  editing: null | {
    /**
     * The subject of the edit
     */
    subject: 'node' | 'edge'
    /**
     * The state before editing started
     */
    before: Snapshot
  }

  syncQueue: Array<SyncOp>
  processing: Exclude<SyncOp, 'sync-snapshot'> | null

  /**
   * True if the layout was edited locally after the last sync snapshot was taken.
   * External view updates received meanwhile are stale and must not override local edits.
   */
  unsynced: boolean
}

export type EditorActorEmitedEvent = { type: 'idle' }

/**
 * - `busy`: syncing changes with the backend
 * - `locked`: whole layout is being replaced (apply latest, semantic layout), editing is not allowed
 */
export type EditorActorStateTag = 'pending' | 'busy' | 'locked' | 'ai-semantic-layout'
