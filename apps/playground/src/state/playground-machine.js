import { api } from '$/api';
import { nonNullable, } from '@likec4/core';
import { loggable, rootLogger } from '@likec4/log';
import { deepEqual, shallowEqual } from 'fast-equals';
import { keys, prop } from 'remeda';
import { assign, cancel, emit, enqueueActions, fromPromise, raise, setup, } from 'xstate';
import { selectWorkspacePersistence } from './persistence';
const logger = rootLogger.getChild('playground-actor');
export const playgroundMachine = setup({
    types: {
        context: {},
        events: {},
        input: {},
        emitted: {},
        tags: '',
    },
    actors: {
        'call-share-api': fromPromise(async ({ input }) => {
            return await api.share.create({
                json: input,
            });
        }),
    },
    actions: {
        'reset workspace': assign(({ context }, params) => {
            if (context.workspaceId === params.workspace.workspaceId) {
                return {};
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
            };
        }),
        'update LikeC4Model and view states': assign(({ context }, params) => {
            if (!params.model) {
                return {};
            }
            const oldKeys = new Set([...keys(context.viewStates)]);
            const states = { ...context.viewStates };
            for (const view of params.model.views()) {
                oldKeys.delete(view.id);
                const state = states[view.id];
                if (!state) {
                    states[view.id] = {
                        state: 'pending',
                        view: view.$view,
                        diagram: null,
                        dot: null,
                        error: null,
                    };
                    continue;
                }
                if (state.state === 'success' && deepEqual(state.view, view.$view)) {
                    continue;
                }
                states[view.id] = {
                    ...state,
                    state: 'stale',
                    view: view.$view,
                };
            }
            // Mark old keys as error
            for (const id of oldKeys) {
                if (states[id]) {
                    states[id] = {
                        ...states[id],
                        error: 'View is not found',
                        state: 'error',
                    };
                }
            }
            let activeViewId = context.activeViewId;
            if (!activeViewId || !states[activeViewId]) {
                activeViewId = states['index'] ? 'index' : (keys(states)[0] ?? null);
            }
            return {
                likec4model: params.model,
                viewStates: states,
                activeViewId,
            };
        }),
        'update view state': assign(({ context }, params) => {
            const current = context.viewStates[params.viewId];
            const computed = current?.view ?? context.likec4model?.findView(params.viewId)?.$view;
            let nextState;
            if (params.diagram) {
                nextState = {
                    state: 'success',
                    diagram: params.diagram,
                    view: nonNullable(computed, `Computed view for ${params.viewId} not found`),
                    dot: params.dot,
                    error: null,
                };
            }
            else {
                nextState = {
                    state: 'error',
                    diagram: current?.diagram ?? null,
                    view: computed ?? null,
                    dot: current?.dot ?? null,
                    error: params.error,
                };
            }
            return {
                viewStates: {
                    ...context.viewStates,
                    [params.viewId]: nextState,
                },
            };
        }),
        'change activeViewId': enqueueActions(({ context, enqueue }, params) => {
            if (context.activeViewId === params.viewId) {
                return;
            }
            const viewState = context.viewStates[params.viewId];
            if (viewState) {
                enqueue.assign({
                    activeViewId: params.viewId,
                });
                return;
            }
            logger.warn `Viewstate not found: ${params.viewId}`;
            // computed view?
            const view = context.likec4model?.findView(params.viewId)?.$view;
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
                        },
                    },
                });
                return;
            }
            logger.error `ComputedView not found: ${params.viewId}`;
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
            });
        }),
        'update share request on success': assign(({ context }, params) => {
            return {
                shareRequest: {
                    ...context.shareRequest,
                    success: params.response,
                },
                shareHistory: [
                    ...context.shareHistory,
                    params.response,
                ],
            };
        }),
        'persist to storage': (({ context }) => {
            selectWorkspacePersistence(context.workspaceId).write({
                workspaceId: context.workspaceId,
                activeFilename: context.activeFilename,
                title: context.workspaceTitle,
                files: context.files,
                shareHistory: context.shareHistory,
            });
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
        shareHistory: [...input.shareHistory ?? []],
        likec4model: null,
        shareRequest: null,
        viewStates: {},
        activeViewId: null,
        diagnosticErrors: [],
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
                    actions: [
                        assign({
                            files: ({ event, context }) => ({
                                ...context.files,
                                [context.activeFilename]: event.modified,
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
                        diagnosticErrors: ({ context, event }) => shallowEqual(context.diagnosticErrors, event.errors) ? context.diagnosticErrors : event.errors,
                    }),
                },
                'workspace.persist': {
                    actions: 'persist to storage',
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
                                    options: context.shareRequest.options,
                                }),
                            }),
                            target: 'call-api',
                        },
                        'likec4.lsp.onLayoutedModelError': {
                            actions: assign({
                                shareRequest: ({ context, event }) => ({
                                    ...context.shareRequest,
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
                            ...context.shareRequest,
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
                            model: context.shareRequest.layoutedLikeC4Data,
                            shareOptions: context.shareRequest.options,
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
                                    ...context.shareRequest,
                                    error: loggable(event.error),
                                }),
                            }),
                        },
                    },
                },
            },
        },
    },
});
