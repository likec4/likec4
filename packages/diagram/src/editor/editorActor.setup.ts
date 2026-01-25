import type * as t from '@likec4/core/types'
import type { NonReducibleUnknown } from 'xstate'
import { fromPromise, setup } from 'xstate'
import type { Types } from '../likec4diagram/types'
import type { HotKeyEvent } from './hotkeyActor'
import { hotkeyActorLogic as hotkey } from './hotkeyActor'

export namespace EditorCalls {
  export type ApplyLatestToManual = (
    params: { input: ApplyLatestToManual.Input },
  ) => Promise<ApplyLatestToManual.Output>
  export namespace ApplyLatestToManual {
    export type Input = { viewId: t.ViewId; current: t.LayoutedView | undefined }
    export type Output = { updated: t.LayoutedView }
  }

  export type ExecuteChange = (
    params: { input: ExecuteChange.Input },
  ) => Promise<ExecuteChange.Output>
  export namespace ExecuteChange {
    export type Input = { viewId: t.ViewId; changes: t.ViewChange[] }
    export type Output = NonReducibleUnknown
  }
}

const applyLatest = fromPromise<EditorCalls.ApplyLatestToManual.Output, EditorCalls.ApplyLatestToManual.Input>(
  () => {
    throw new Error('Not implemented')
  },
)

const executeChange = fromPromise<EditorCalls.ExecuteChange.Output, EditorCalls.ExecuteChange.Input>(
  () => {
    throw new Error('Not implemented')
  },
)

export type EditorActorEvent =
  // Schedule a sync
  | { type: 'sync' }
  // Trigger a view change (apply change to server)
  | { type: 'change'; change: t.ViewChange }
  | { type: 'edit.start'; subject: 'node' | 'edge' }
  | { type: 'edit.finish'; wasChanged?: boolean }
  // triggers applying latest to manual layout
  | { type: 'applyLatestToManual' }
  // view update has been received, consider synced
  | { type: 'synced' }
  // Cancel current editing or pending operations
  | { type: 'cancel' }
  // Reset history, pending changes, and editing state
  | { type: 'reset' }
  | HotKeyEvent

export type HistorySnapshot = {
  view: t.LayoutedView
  change: t.ViewChange.SaveViewSnapshot
  xynodes: Types.Node[]
  xyedges: Types.Edge[]
  synched: boolean
}

export interface EditorActorInput {
  viewId: t.ViewId
}

export interface EditorActorContext {
  viewId: t.ViewId

  pendingChanges: t.ViewChange[]

  history: ReadonlyArray<HistorySnapshot>
  /**
   * The state before editing started
   */
  beforeEditing: HistorySnapshot | null

  /**
   * The subject of the edit
   */
  editing: 'node' | 'edge' | null
}

export type EditorActorEmitedEvent = { type: 'idle' }

export const machine = setup({
  types: {
    context: {} as EditorActorContext,
    events: {} as EditorActorEvent,
    emitted: {} as EditorActorEmitedEvent,
    input: {} as EditorActorInput,
    children: {} as {
      hotkey: 'hotkey'
    },
    tags: {} as 'pending',
  },
  delays: {
    '350ms': 350,
    'waitBeforeSync': 2_000,
  },
  actors: {
    applyLatest,
    executeChange,
    hotkey,
  },
  guards: {
    'has pending': ({ context }) => context.pendingChanges.length > 0,
    'can undo': ({ context }) => context.history.length > 0,
  },
})
