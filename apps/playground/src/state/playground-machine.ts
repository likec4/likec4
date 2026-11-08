import { type Api, api } from '$/api'
import {
  type aux,
  type ComputedView,
  type DiagramView,
  type DiffId,
  type DiffSummary,
  type ExclusiveUnion,
  type Fqn,
  type LayoutedLikeC4ModelData,
  type ViewChange,
  type ViewId,
  nonNullable,
} from '@likec4/core'
import type { CompareViewMode } from '@likec4/core/compute-view'
import { LikeC4Model } from '@likec4/core/model'
import type {
  ApplyEditsResult,
  Locate as LocateRequest,
  ModelEditPreview,
  ModelEditRecord,
  ModelEditRequest,
  ModelEditResult,
  RemainingError,
  RemovalImpactReport,
} from '@likec4/language-server/protocol'
import { loggable, rootLogger } from '@likec4/log'
import { deepEqual, shallowEqual } from 'fast-equals'
import { keys, prop } from 'remeda'
import type { Location } from 'vscode-languageserver-types'
import {
  assign,
  cancel,
  emit,
  enqueueActions,
  fromPromise,
  raise,
  setup,
} from 'xstate'
import { selectWorkspacePersistence } from './persistence'
import type { ShareOptions } from './shareOptions'
import type { LocalWorkspace, ShareHistoryItem, WithInput } from './types'

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

/**
 * Compare view of the active view and the active diff
 */
export type CompareViewState = {
  viewId: ViewId
  diffId: DiffId
  diagram: DiagramView | null
  error: string | null
}

/**
 * Safe delete dry run: report and impact diagram
 */
export type RemovalImpactState = {
  fqn: Fqn
  state: 'pending' | 'ready' | 'error'
  report: RemovalImpactReport | null
  diagram: DiagramView | null
  error: string | null
}

/**
 * Model edit under review: the changes of each file, applied after approval
 */
export type EditReviewState = {
  request: ModelEditRequest
  state: 'loading' | 'review' | 'applying' | 'error'
  preview: ModelEditPreview | null
  error: string | null
}

/**
 * The latest applied edit, can be rolled back
 */
export type LastEditState = {
  edit: ModelEditRecord
  remaining: RemainingError[]
  state: 'applied' | 'rolling-back' | 'rolled-back'
  error: string | null
}

export type PlaygroundInput = LocalWorkspace

export interface PlaygroundContext {
  workspaceId: string
  workspaceTitle: string
  shareHistory: Array<ShareHistoryItem>

  /**
   * Current LikeC4 model.
   */
  likec4model: LikeC4Model<aux.UnknownComputed> | null

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

  diagnosticErrors: string[]

  /**
   * Model diffs of the workspace
   */
  diffs: DiffSummary[]
  /**
   * Selected diff, `null` shows the model as is
   */
  activeDiffId: DiffId | null
  compareMode: CompareViewMode
  compareView: CompareViewState | null

  removalImpact: RemovalImpactState | null

  editReview: EditReviewState | null
  lastEdit: LastEditState | null

  shareRequest: null | {
    layoutedLikeC4Data: LayoutedLikeC4ModelData | null
    options: ShareOptions
    success?: Api.Share.Response
    error?: string | null
  }
}

export type PlaygroundEvents =
  // Monaco events
  | { type: 'monaco.onTextChanged'; filename: string; modified: string }
  // LikeC4 Language Server events
  | { type: 'likec4.lsp.onLayoutedModel'; model: LayoutedLikeC4ModelData }
  | { type: 'likec4.lsp.onLayoutedModelError'; error: string }
  | { type: 'likec4.lsp.onDidChangeModel'; model: LikeC4Model.Computed }
  | { type: 'likec4.lsp.onLayoutDone'; dot: string; diagram: DiagramView }
  | { type: 'likec4.lsp.onLayoutError'; viewId: ViewId; error: string }
  | { type: 'likec4.lsp.onDiagnostic'; errors: string[] }
  | { type: 'likec4.lsp.onDiffs'; diffs: DiffSummary[] }
  | { type: 'likec4.lsp.onCompareView'; viewId: ViewId; diffId: DiffId; diagram: DiagramView | null; error?: string }
  | {
    type: 'likec4.lsp.onRemovalImpact'
    fqn: Fqn
    report: RemovalImpactReport | null
    diagram: DiagramView | null
    error?: string
  }
  | {
    type: 'likec4.lsp.onEditPreview'
    request: ModelEditRequest
    preview: ModelEditPreview | null
    error?: string
  }
  | { type: 'likec4.lsp.onEditApplied'; request: ModelEditRequest; result: ModelEditResult }
  | { type: 'likec4.lsp.onRollbackDone'; result: ApplyEditsResult }
  // Model diff events
  | { type: 'diff.select'; diffId: DiffId | null }
  | { type: 'diff.changeMode'; mode: CompareViewMode }
  | { type: 'impact.open'; fqn: Fqn }
  | { type: 'impact.close' }
  // Model edit events: review, approve (apply), roll back
  | { type: 'edit.review'; request: ModelEditRequest }
  | {
    type: 'edit.approve'
    /**
     * The approver confirms that the owners of the overlapping diffs agreed
     */
    acceptOverlaps: boolean
  }
  | { type: 'edit.cancel' }
  | { type: 'edit.rollback' }
  | { type: 'edit.dismiss' }
  // Workspace events
  | { type: 'workspace.revealLocation'; location: Location }
  | { type: 'workspace.applyViewChanges'; change: ViewChange }
  | { type: 'workspace.openSources'; target: LocateRequest.Params }
  | { type: 'workspace.changeActiveView'; viewId: ViewId }
  | { type: 'workspace.changeActiveFile'; filename: string }
  | { type: 'workspace.addFile'; filename: string; content: string }
  | { type: 'workspace.switch'; workspace: PlaygroundInput }
  | { type: 'workspace.share'; options: ShareOptions }
  | { type: 'workspace.persist' }
  | { type: 'workspace.ready' }

export type PlaygroundEmitted =
  | { type: 'workspace.request-layouted-data' }
  | { type: 'workspace.openSources'; target: LocateRequest.Params }
  | { type: 'workspace.revealLocation'; location: Location }
  | { type: 'workspace.applyViewChanges'; viewId: ViewId; change: ViewChange }
  | { type: 'workspace.request-removal-impact'; fqn: Fqn }
  | { type: 'workspace.preview-edit'; request: ModelEditRequest }
  | { type: 'workspace.apply-edit'; request: ModelEditRequest; token: string }
  | { type: 'workspace.rollback-edit'; editId: number }

const logger = rootLogger.getChild('playground-actor')

export const playgroundMachine = setup({
  types: {
    context: {} as PlaygroundContext,
    events: {} as PlaygroundEvents,
    input: {} as PlaygroundInput,
    emitted: {} as PlaygroundEmitted,
    tags: '' as 'sharing',
  },
  actors: {
    'call-share-api': fromPromise(async ({ input }: WithInput<Api.Share.Payload>) => {
      return await api.share.create({
        json: input,
      })
    }),
  },
  actions: {
    'reset workspace': assign(({ context }, params: { workspace: PlaygroundInput }): Partial<PlaygroundContext> => {
      if (context.workspaceId === params.workspace.workspaceId) {
        return {}
      }
      return {
        workspaceId: params.workspace.workspaceId,
        workspaceTitle: params.workspace.title,
        activeFilename: params.workspace.activeFilename,
        files: {
          ...params.workspace.files,
        },
        originalFiles: { ...params.workspace.files },
        likec4model: null,
        shareRequest: null,
        diagnosticErrors: [],
        shareHistory: [
          ...params.workspace.shareHistory ?? [],
        ],
        viewStates: {},
        diffs: [],
        activeDiffId: null,
        compareView: null,
        removalImpact: null,
        editReview: null,
        lastEdit: null,
      }
    }),

    'update diffs': assign(({ context }, params: { diffs: DiffSummary[] }): Partial<PlaygroundContext> => {
      const activeDiffId = params.diffs.some(d => d.id === context.activeDiffId) ? context.activeDiffId : null
      return {
        diffs: deepEqual(context.diffs, params.diffs) ? context.diffs : params.diffs,
        activeDiffId,
        compareView: activeDiffId ? context.compareView : null,
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

    'update share request on success': assign(({ context }, params: { response: Api.Share.Response }) => {
      return {
        shareRequest: {
          ...context.shareRequest!,
          success: params.response,
        },
        shareHistory: [
          ...context.shareHistory,
          params.response,
        ],
      }
    }),

    'persist to storage': ({ context }) => {
      selectWorkspacePersistence(context.workspaceId).write({
        workspaceId: context.workspaceId,
        activeFilename: context.activeFilename,
        title: context.workspaceTitle,
        files: context.files,
        shareHistory: context.shareHistory,
      })
    },
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
    shareHistory: [...input.shareHistory ?? []],
    likec4model: null,
    shareRequest: null,
    viewStates: {},
    activeViewId: null,
    diagnosticErrors: [],
    diffs: [],
    activeDiffId: null,
    compareMode: 'changes',
    compareView: null,
    removalImpact: null,
    editReview: null,
    lastEdit: null,
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
      id: 'ready',
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
          // Edits from the language server (safe delete, apply diff) change files that are not active
          guard: ({ event, context }) => event.filename in context.files,
          actions: [
            assign({
              files: ({ event, context }) => ({
                ...context.files,
                [event.filename]: event.modified,
              }),
            }),
            cancel('persist'),
            raise({ type: 'workspace.persist' }, { id: 'persist', delay: 1000 }),
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
        'workspace.addFile': {
          actions: [
            'persist to storage',
            assign({
              files: ({ event, context }) => ({
                ...context.files,
                [event.filename]: event.content,
              }),
              originalFiles: ({ event, context }) => ({
                ...context.originalFiles,
                [event.filename]: event.content,
              }),
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
        'likec4.lsp.onDiagnostic': {
          actions: assign({
            diagnosticErrors: ({ context, event }) =>
              shallowEqual(context.diagnosticErrors, event.errors) ? context.diagnosticErrors : event.errors,
          }),
        },
        'workspace.persist': {
          actions: 'persist to storage',
        },
        'workspace.revealLocation': {
          actions: emit(prop('event')),
        },
        'likec4.lsp.onDiffs': {
          actions: {
            type: 'update diffs',
            params: prop('event'),
          },
        },
        'likec4.lsp.onCompareView': {
          actions: assign({
            compareView: ({ event }) => ({
              viewId: event.viewId,
              diffId: event.diffId,
              diagram: event.diagram,
              error: event.error ?? null,
            }),
          }),
        },
        'diff.select': {
          actions: assign(({ event }) => ({
            activeDiffId: event.diffId,
            removalImpact: null,
            ...(event.diffId === null && { compareView: null }),
          })),
        },
        'diff.changeMode': {
          actions: assign({
            compareMode: ({ event }) => event.mode,
          }),
        },
        'impact.open': {
          actions: [
            assign({
              removalImpact: ({ event }) => ({
                fqn: event.fqn,
                state: 'pending' as const,
                report: null,
                diagram: null,
                error: null,
              }),
            }),
            emit(({ event }) => ({
              type: 'workspace.request-removal-impact' as const,
              fqn: event.fqn,
            })),
          ],
        },
        'likec4.lsp.onRemovalImpact': {
          // Ignore reports of elements that are no longer under review
          guard: ({ context, event }) => context.removalImpact?.fqn === event.fqn,
          actions: assign({
            removalImpact: ({ context, event }) => ({
              ...nonNullable(context.removalImpact),
              state: event.error ? 'error' as const : 'ready' as const,
              report: event.report,
              diagram: event.diagram,
              error: event.error ?? null,
            }),
          }),
        },
        'impact.close': {
          actions: assign({
            removalImpact: null,
          }),
        },
        'edit.review': {
          actions: [
            assign({
              editReview: ({ event }) => ({
                request: event.request,
                state: 'loading' as const,
                preview: null,
                error: null,
              }),
            }),
            emit(({ event }) => ({
              type: 'workspace.preview-edit' as const,
              request: event.request,
            })),
          ],
        },
        'likec4.lsp.onEditPreview': {
          // Ignore previews of requests that are no longer under review
          guard: ({ context, event }) => deepEqual(context.editReview?.request, event.request),
          actions: assign({
            editReview: ({ context, event }) => ({
              ...nonNullable(context.editReview),
              state: event.preview ? 'review' as const : 'error' as const,
              preview: event.preview,
              error: event.error ?? null,
            }),
          }),
        },
        'edit.approve': {
          guard: ({ context }) => context.editReview?.state === 'review' && !!context.editReview.preview,
          actions: [
            emit(({ context, event }) => {
              const { request, preview } = nonNullable(context.editReview)
              return {
                type: 'workspace.apply-edit' as const,
                request: request.type === 'apply-diff' ? { ...request, acceptOverlaps: event.acceptOverlaps } : request,
                token: nonNullable(preview).token,
              }
            }),
            assign({
              editReview: ({ context }) => ({ ...nonNullable(context.editReview), state: 'applying' as const }),
            }),
          ],
        },
        'edit.cancel': {
          actions: assign({
            editReview: null,
          }),
        },
        'likec4.lsp.onEditApplied': {
          actions: assign(({ context, event }): Partial<PlaygroundContext> => {
            const { result, request } = event
            if (!result.applied || !result.edit) {
              return {
                editReview: context.editReview && {
                  ...context.editReview,
                  state: 'error',
                  error: result.error ?? 'The edit was not applied',
                },
              }
            }
            return {
              editReview: null,
              // The removed element no longer exists
              ...(request.type === 'safe-delete' && { removalImpact: null }),
              lastEdit: { edit: result.edit, remaining: result.remaining, state: 'applied', error: null },
            }
          }),
        },
        'edit.rollback': {
          guard: ({ context }) => context.lastEdit?.state === 'applied',
          actions: [
            emit(({ context }) => ({
              type: 'workspace.rollback-edit' as const,
              editId: nonNullable(context.lastEdit).edit.id,
            })),
            assign({
              lastEdit: ({ context }) => ({ ...nonNullable(context.lastEdit), state: 'rolling-back' as const }),
            }),
          ],
        },
        'likec4.lsp.onRollbackDone': {
          actions: assign({
            lastEdit: ({ context, event }) =>
              context.lastEdit && {
                ...context.lastEdit,
                state: event.result.applied ? 'rolled-back' : 'applied',
                error: event.result.applied ? null : event.result.error ?? 'Roll back failed',
              },
          }),
        },
        'edit.dismiss': {
          actions: assign({
            lastEdit: null,
          }),
        },
        'workspace.share': {
          actions: assign({
            shareRequest: ({ event }) => ({
              layoutedLikeC4Data: null,
              options: event.options,
            }),
          }),
          target: 'sharing',
        },
      },
    },
    'sharing': {
      tags: 'sharing',
      initial: 'wait-layouted-data',
      states: {
        'wait-layouted-data': {
          entry: emit({ type: 'workspace.request-layouted-data' }),
          on: {
            'likec4.lsp.onLayoutedModel': {
              guard: ({ context }) => !!context.shareRequest,
              actions: assign({
                shareRequest: ({ context, event }) => ({
                  layoutedLikeC4Data: event.model,
                  options: context.shareRequest!.options,
                }),
              }),
              target: 'call-api',
            },
            'likec4.lsp.onLayoutedModelError': {
              actions: assign({
                shareRequest: ({ context, event }) => ({
                  ...context.shareRequest!,
                  error: event.error,
                }),
              }),
              target: '#ready',
            },
          },
        },
        'call-api': {
          entry: assign({
            shareRequest: ({ context }) => ({
              ...context.shareRequest!,
              error: null,
            }),
          }),
          invoke: {
            src: 'call-share-api',
            input: ({ context }) => ({
              localWorkspace: {
                workspaceId: context.workspaceId,
                title: context.workspaceTitle,
                activeFilename: context.activeFilename,
                files: context.files,
              },
              model: context.shareRequest!.layoutedLikeC4Data!,
              shareOptions: context.shareRequest!.options,
            }),
            onDone: {
              target: '#ready',
              actions: [
                {
                  type: 'update share request on success',
                  params: ({ event }) => ({
                    response: event.output,
                  }),
                },
                'persist to storage',
              ],
            },
            onError: {
              target: '#ready',
              actions: assign({
                shareRequest: ({ context, event }) => ({
                  ...context.shareRequest!,
                  error: loggable(event.error),
                }),
              }),
            },
          },
        },
      },
    },
  },
})
export type PlaygroundMachineLogic = typeof playgroundMachine
