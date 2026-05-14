import type { ActorRef, SnapshotFrom, StateMachine } from 'xstate'
import { machine } from './setup'
import { editor } from './state.editor'
import { syncQueue } from './state.sync-queue'
import type { EditorActorEvent } from './types'
import type { EditorActorContext, EditorActorEmitedEvent, EditorActorInput, EditorActorStateTag } from './types'

const _editorActorLogic = machine.createMachine({
  id: 'editor',
  context: ({ input }) => ({
    viewId: input.viewId,
    editing: null,
    history: null,
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

// type InferredDiagramMachine = typeof _diagramMachine
// export interface DiagramMachineLogic extends InferredDiagramMachine {}
export interface EditorActorLogic extends
  StateMachine<
    EditorActorContext,
    EditorActorEvent,
    any,
    any,
    any,
    any,
    any,
    {
      editor: 'idle' | 'moving'
      syncQueue: 'idle' | 'pending' | 'suspended' | 'process'
    },
    EditorActorStateTag,
    EditorActorInput,
    any,
    EditorActorEmitedEvent,
    any,
    any
  >
{
}
export const editorActorLogic: EditorActorLogic = _editorActorLogic as any

export type EditorActorSnapshot = SnapshotFrom<EditorActorLogic>
export interface EditorActorRef extends ActorRef<EditorActorSnapshot, EditorActorEvent, EditorActorEmitedEvent> {}
