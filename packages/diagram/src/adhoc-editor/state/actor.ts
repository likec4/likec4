import type {
  ActorRef,
  SnapshotFrom,
  StateMachine,
} from 'xstate'
import { editor } from './actor.editor'
import { layouter } from './actor.layouter'
import {
  type Context,
  type EmittedEvents,
  type Events,
  createContext,
  machine,
} from './actor.types'

const _adhocEditorLogic = machine.createMachine({
  id: 'adhoc-editor',
  context: createContext,
  type: 'parallel',
  states: {
    layouter,
    editor,
  },
})

export interface AdhocEditorLogic extends
  StateMachine<
    Context,
    Events,
    any,
    any,
    any,
    any,
    any,
    {
      layouter: keyof typeof layouter['states']
      editor: keyof typeof editor['states']
    },
    any,
    any,
    EmittedEvents,
    any,
    any,
    any
  >
{
}

export const adhocEditorLogic: AdhocEditorLogic = _adhocEditorLogic as any

export type AdhocEditorSnapshot = SnapshotFrom<AdhocEditorLogic>
export interface AdhocEditorActorRef extends ActorRef<AdhocEditorSnapshot, Events, EmittedEvents> {
}
