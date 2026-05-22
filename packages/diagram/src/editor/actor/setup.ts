import type * as t from '@likec4/core/types'
import { type NonReducibleUnknown, fromPromise, setup } from 'xstate'
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

const applySemanticLayout = fromPromise<EditorCalls.ApplySemanticLayout.Output, EditorCalls.ApplySemanticLayout.Input>(
  () => {
    throw new Error('Not implemented')
  },
)

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
  actors: {
    applyLatest,
    executeChange,
    applySemanticLayout,
    hotkey,
  },
  delays: {
    '500ms': 500,
    'wait-after-edit': 1_000,
  },
  guards: {
    'has pending': ({ context }) => context.syncQueue.length > 0 || !!context.processing,
    'can undo': ({ context }) => context.history !== null,
  },
})
