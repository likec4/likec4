import type {
  ActorRef,
  SnapshotFrom,
} from 'xstate'
import { editor } from './actor.editor'
import { layouter } from './actor.layouter'
import {
  type EmittedEvents,
  type Events,
  machine,
} from './actor.types'

const _adhocEditorLogic = machine.createMachine({
  id: 'adhoc-editor',
  context: () => ({
    view: null,
    error: undefined,
    rules: [],
  }),
  type: 'parallel',
  states: {
    layouter,
    editor,
  },
})

type Infer = typeof _adhocEditorLogic
export interface AdhocEditorLogic extends Infer {}

export const adhocEditorLogic: AdhocEditorLogic = _adhocEditorLogic as any

export type AdhocEditorSnapshot = SnapshotFrom<AdhocEditorLogic>
export interface AdhocEditorActorRef extends ActorRef<AdhocEditorSnapshot, Events, EmittedEvents> {
}
