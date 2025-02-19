import { Examples } from '$/examples'
import {
  type ComputedView,
  type DiagramView,
  type ExclusiveUnion,
  type ViewChange,
  type ViewId,
  LikeC4Model,
  nonNullable,
} from '@likec4/core'
import type { LocateParams } from '@likec4/language-server/protocol'
import { rootLogger } from '@likec4/log'
import { deepEqual } from 'fast-equals'
import { keys, prop } from 'remeda'
import {
  assign,
  cancel,
  emit,
  enqueueActions,
  raise,
  setup,
} from 'xstate'
import { WorkspacePersistence } from './persistence'

export type DiagramState = {
  // Never loaded
  state: 'pending'
  view: ComputedView
  diagram: null
  dot: null
  error: null
} | {
  state: 'success'
  view: ComputedView
  diagram: DiagramView
  dot: string
  error: null
} | {
  state: 'error'
  view?: ComputedView | null
  diagram?: DiagramView | null
  dot?: string | null
  error: string
} | {
  state: 'stale'
  view: ComputedView
  diagram: DiagramView | null
  dot: string | null
  error: string | null
}

export type PlaygroundInput = {
  workspaceId: string
  title: string
  activeFilename: string
  files: Record<string, string>
}

export interface PlaygroundContext {
  workspaceId: string
  workspaceTitle: string

  /**
   * Current LikeC4 model.
   */
  likec4model: LikeC4Model.Computed | null

  /**
   * Files in the workspace.
   */
  files: {
    [filename: string]: string
  }

  activeFilename: string

  /**
   * Original files in the workspace.
   * This is used to compare with the current files to detect changes.
   */
  originalFiles: {
    [filename: string]: string
  }

  viewStates: Record<string, DiagramState>

  /**
   * The view that is currently active.
   * If `null`, no view is active and panel is hidden.
   */
  activeViewId: ViewId | null
}

export type PlaygroundEvents =
  // Monaco events
  | { type: 'monaco.onTextChanged'; filename: string; modified: string }
  // LikeC4 Language Server events
  | { type: 'likec4.lsp.onDidChangeModel'; model: LikeC4Model.Computed }
  | { type: 'likec4.lsp.onLayoutDone'; dot: string; diagram: DiagramView }
  | { type: 'likec4.lsp.onLayoutError'; viewId: ViewId; error: string }
  // Workspace events
  | { type: 'workspace.applyViewChanges'; change: ViewChange }
  | { type: 'workspace.openSources'; target: LocateParams }
  | { type: 'workspace.changeActiveView'; viewId: ViewId }
  | { type: 'workspace.changeActiveFile'; filename: string }
  | { type: 'workspace.switch'; workspace: PlaygroundInput }
  | { type: 'workspace.persist' }
  | { type: 'workspace.ready' }

export type PlaygroundEmitted =
  | { type: 'workspace.openSources'; target: LocateParams }
  | { type: 'workspace.applyViewChanges'; viewId: ViewId; change: ViewChange }

const logger = rootLogger.getChild('playground-actor')

export const playgroundMachine = setup({
  types: {
    context: {} as PlaygroundContext,
    events: {} as PlaygroundEvents,
    input: {} as PlaygroundInput,
    emitted: {} as PlaygroundEmitted,
  },
  actors: {},
  actions: {
    'reset workspace': assign(({ context }, params: { workspace: PlaygroundInput }): Partial<PlaygroundContext> => {
      return {
        workspaceId: params.workspace.workspaceId,
        workspaceTitle: params.workspace.title,
        activeFilename: params.workspace.activeFilename,
        files: {
          ...params.workspace.files,
        },
        originalFiles: { ...params.workspace.files },
        likec4model: null,
        viewStates: {},
      }
    }),
    'update LikeC4Model and view states': assign(({ context }, params: { model: LikeC4Model.Computed }) => {
      if (!params.model) {
        return {}
      }

      const oldKeys = new Set([...keys(context.viewStates)] as ViewId[])
      const states = { ...context.viewStates }
      for (const view of params.model.views()) {
        oldKeys.delete(view.id)
        const state = states[view.id]
        if (!state) {
          states[view.id] = {
            state: 'pending',
            view: view.$view,
            diagram: null,
            dot: null,
            error: null,
          }
          continue
        }
        if (state.state === 'success' && deepEqual(state.view, view.$view)) {
          continue
        }
        states[view.id] = {
          ...state,
          state: 'stale',
          view: view.$view,
        }
      }

      // Mark old keys as error
      for (const id of oldKeys) {
        if (states[id]) {
          states[id] = {
            ...states[id],
            error: 'View is not found',
            state: 'error',
          }
        }
      }

      let activeViewId = context.activeViewId
      if (!activeViewId || !states[activeViewId]) {
        activeViewId = states['index'] ? 'index' as ViewId : (keys(states)[0] as ViewId ?? null)
      }

      return {
        likec4model: params.model,
        viewStates: states,
        activeViewId,
      }
    }),

    'update view state': assign((
      { context },
      params: ExclusiveUnion<{
        onSuccess: { viewId: ViewId; diagram: DiagramView; dot: string }
        onError: { viewId: ViewId; error: string }
      }>,
    ) => {
      const current = context.viewStates[params.viewId]
      const computed = current?.view ?? context.likec4model?.findView(params.viewId)?.$view
      let nextState: DiagramState
      if (params.diagram) {
        nextState = {
          state: 'success' as const,
          diagram: params.diagram,
          view: nonNullable(computed, `Computed view for ${params.viewId} not found`),
          dot: params.dot,
          error: null,
        }
      } else {
        nextState = {
          state: 'error' as const,
          diagram: current?.diagram ?? null,
          view: computed ?? null,
          dot: current?.dot ?? null,
          error: params.error,
        }
      }
      return {
        viewStates: {
          ...context.viewStates,
          [params.viewId]: nextState,
        },
      }
    }),

    'change activeViewId': enqueueActions(({ context, enqueue }, params: { viewId: ViewId }) => {
      if (context.activeViewId === params.viewId) {
        return
      }
      const viewState = context.viewStates[params.viewId]
      if (viewState) {
        enqueue.assign({
          activeViewId: params.viewId,
        })
        return
      }
      logger.warn`Viewstate not found: ${params.viewId}`
      // computed view?
      const view = context.likec4model?.findView(params.viewId)?.$view
      if (view) {
        enqueue.assign({
          activeViewId: params.viewId,
          viewStates: {
            ...context.viewStates,
            [params.viewId]: {
              state: 'pending',
              view,
              diagram: null,
              dot: null,
              error: null,
            } satisfies DiagramState,
          },
        })
        return
      }
      logger.error`ComputedView not found: ${params.viewId}`
      // Invalid state
      enqueue.assign({
        activeViewId: params.viewId,
        // viewStates: {
        //   ...context.viewStates,
        //   [params.viewId]: {
        //     state: 'error',
        //     error: 'View not found',
        //   } satisfies DiagramState,
        // },
      })
    }),

    'persist to storage': (({ context }) => {
      if (Examples[context.workspaceId as keyof typeof Examples]) return

      WorkspacePersistence.write({
        workspaceId: context.workspaceId,
        activeFilename: context.activeFilename,
        title: context.workspaceTitle,
        files: context.files,
      })
    }),
  },
}).createMachine({
  id: 'playground',
  initial: 'initializing',
  context: ({ input }) => ({
    workspaceId: input.workspaceId,
    workspaceTitle: input.title,
    activeFilename: input.activeFilename,
    files: { ...input.files },
    originalFiles: { ...input.files },
    likec4model: null,
    viewStates: {},
    activeViewId: null,
  }),
  states: {
    'initializing': {
      on: {
        'workspace.switch': {
          actions: {
            type: 'reset workspace',
            params: prop('event'),
          },
        },
        'workspace.ready': {
          target: 'ready',
        },
        'likec4.lsp.onDidChangeModel': {
          actions: {
            type: 'update LikeC4Model and view states',
            params: prop('event'),
          },
          target: 'ready',
        },
      },
    },
    'ready': {
      on: {
        'workspace.switch': {
          actions: [
            'persist to storage',
            {
              type: 'reset workspace',
              params: prop('event'),
            },
          ],
          target: 'initializing',
        },
        'monaco.onTextChanged': {
          actions: [
            assign({
              files: ({ event, context }) => ({
                ...context.files,
                [context.activeFilename]: event.modified,
              }),
            }),
            cancel('persist'),
            raise({ type: 'workspace.persist' }, { id: 'persist', delay: 2000 }),
          ],
        },
        'workspace.changeActiveFile': {
          actions: [
            'persist to storage',
            assign({
              activeFilename: ({ event }) => event.filename,
            }),
          ],
        },
        'workspace.applyViewChanges': {
          actions: emit(({ context, event }) => ({
            type: 'workspace.applyViewChanges',
            viewId: nonNullable(context.activeViewId, 'Active view is not set'),
            change: event.change,
          })),
        },
        'workspace.changeActiveView': {
          actions: {
            type: 'change activeViewId',
            params: prop('event'),
          },
        },
        'likec4.lsp.onDidChangeModel': {
          actions: {
            type: 'update LikeC4Model and view states',
            params: prop('event'),
          },
        },
        'workspace.openSources': {
          actions: emit(prop('event')),
        },
        'likec4.lsp.onLayoutDone': {
          actions: {
            type: 'update view state',
            params: ({ event }) => ({
              viewId: event.diagram.id,
              diagram: event.diagram,
              dot: event.dot,
            }),
          },
        },
        'likec4.lsp.onLayoutError': {
          actions: {
            type: 'update view state',
            params: ({ event }) => ({
              viewId: event.viewId,
              error: event.error,
            }),
          },
        },
        'workspace.persist': {
          actions: 'persist to storage',
        },
      },
    },
  },
})
export type PlaygroundMachineLogic = typeof playgroundMachine
