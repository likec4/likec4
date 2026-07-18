import type * as t from '@likec4/core/types'
import {
  type ActorRefFromLogic,
  type StateMachine,
  type StateValue,
  fromPromise,
  setup,
} from 'xstate'
import {
  type inferChildrenRef,
  type inferProvidedActor,
  defineActors,
} from '../../utils/defineActors'
import { hotkey } from './hotkey'
import type {
  EditorActorContext,
  EditorActorEmitedEvent,
  EditorActorEvent,
  EditorActorInput,
  EditorActorStateTag,
} from './types'

export namespace EditorCalls {
  export type ApplyLatestToManual = (
    params: { input: ApplyLatestToManual.Input },
  ) => Promise<ApplyLatestToManual.Output>
  export namespace ApplyLatestToManual {
    export type Input = { viewId: t.ViewId; current: t.LayoutedView | undefined }
    export type Output = { updated: t.LayoutedView }
  }

  export type ApplySemanticLayout = (
    params: { input: ApplySemanticLayout.Input },
  ) => Promise<ApplySemanticLayout.Output>
  export namespace ApplySemanticLayout {
    export type Input = { viewId: t.ViewId }
    export type Output = {}
  }

  export type ExecuteChange = (
    params: { input: ExecuteChange.Input },
  ) => Promise<ExecuteChange.Output>
  export namespace ExecuteChange {
    export type Input = { viewId: t.ViewId; changes: t.ViewChange[] }
    /**
     * Returns the changes that were applied to the view
     */
    export type Output = { requested: t.ViewChange[]; applied: t.ViewChange[] }
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

const applySemanticLayout = fromPromise<EditorCalls.ApplySemanticLayout.Output, EditorCalls.ApplySemanticLayout.Input>(
  () => {
    throw new Error('Not implemented')
  },
)

const actors = defineActors({
  hotkey,
  applyLatest,
  executeChange,
  applySemanticLayout,
})

export const machine = setup({
  types: {
    context: {} as EditorActorContext,
    events: {} as EditorActorEvent,
    emitted: {} as EditorActorEmitedEvent,
    input: {} as EditorActorInput,
    children: {} as {
      hotkey: 'hotkey'
    },
    tags: '' as EditorActorStateTag,
  },
  actors: actors,
  delays: {
    '500ms': 500,
    'wait-after-edit': 1_000,
  },
  guards: {
    'has pending': ({ context }) => context.syncQueue.length > 0,
    'can undo': ({ context }) => context.history !== null,
    'can redo': ({ context }) => context.redo !== null,
  },
})

/**
 * to workaround circular dependency issue between editor and diagram packages
 */
export interface BaseEditorActorLogic<State extends StateValue = any> extends
  StateMachine<
    EditorActorContext,
    EditorActorEvent,
    inferChildrenRef<typeof actors>,
    inferProvidedActor<typeof actors>,
    never,
    never,
    never,
    State,
    EditorActorStateTag,
    EditorActorInput,
    never,
    EditorActorEmitedEvent,
    never,
    never
  >
{
}
export type BaseEditorActorRef = ActorRefFromLogic<BaseEditorActorLogic>
