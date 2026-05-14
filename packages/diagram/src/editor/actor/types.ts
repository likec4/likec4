import type * as t from '@likec4/core/types'
import type { Types } from '../../likec4diagram/types'
import type { HotKeyEvent } from './hotkey'

export type EditorActorEvent =
  // Add change to queue
  | { type: 'change.view'; change: t.ViewChange }
  | { type: 'change.semantic-layout' }
  | { type: 'change.latest-to-manual' }
  | { type: 'change.sync-snapshot' }
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

export const isViewChange = (change: SyncOp): change is t.ViewChange => typeof change !== 'string'

export interface EditorActorContext {
  viewId: t.ViewId

  history: LinkedSnapshot | null

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
}

export type EditorActorEmitedEvent = { type: 'idle' }

export type EditorActorStateTag = 'pending' | 'busy' | 'ai-semantic-layout'
