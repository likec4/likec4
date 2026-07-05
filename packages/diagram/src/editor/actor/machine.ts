import type { ActorRef, SnapshotFrom } from 'xstate'
import { type BaseEditorActorLogic, machine } from './setup'
import { editor } from './state.editor'
import { syncQueue } from './state.sync-queue'
import type {
  EditorActorEmitedEvent,
  EditorActorEvent,
} from './types'

const _editorActorLogic = machine.createMachine({
  id: 'editor',
  context: ({ input }) => ({
    viewId: input.viewId,
    editing: null,
    history: null,
    redo: null,
    pending: null,
    syncQueue: [],
    processing: null,
  }),
  type: 'parallel',
  states: {
    editor,
    syncQueue,
  },
})

export interface EditorActorLogic extends BaseEditorActorLogic {}

export const editorActorLogic: EditorActorLogic = _editorActorLogic as any

export type EditorActorSnapshot = SnapshotFrom<EditorActorLogic>
export interface EditorActorRef extends ActorRef<EditorActorSnapshot, EditorActorEvent, EditorActorEmitedEvent> {}
