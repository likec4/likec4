"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.navigationPanelActorLogic = void 0;
var remeda_1 = require("remeda");
var xstate_1 = require("xstate");
var _actorLogic = (0, xstate_1.setup)({
    types: {
        context: {},
        events: {},
        tags: '',
        input: {},
        emitted: {},
    },
    delays: {
        'open timeout': 500,
        'close timeout': 350,
    },
    actions: {
        'update activatedBy': (0, xstate_1.assign)({
            activatedBy: function (_a) {
                var context = _a.context, event = _a.event;
                switch (true) {
                    case event.type.includes('click'):
                        return 'click';
                    case event.type.includes('mouseEnter'):
                        return 'hover';
                    default:
                        return context.activatedBy;
                }
            },
        }),
        'keep dropdown open': (0, xstate_1.assign)({
            activatedBy: 'click',
        }),
        'update selected folder': (0, xstate_1.assign)(function (_a) {
            var event = _a.event;
            if (event.type === 'breadcrumbs.click.root') {
                return { selectedFolder: '' }; // reset to root
            }
            (0, xstate_1.assertEvent)(event, ['breadcrumbs.click.folder', 'select.folder']);
            return { selectedFolder: event.folderPath };
        }),
        'reset selected folder': (0, xstate_1.assign)({
            selectedFolder: function (_a) {
                var _b, _c;
                var context = _a.context;
                return (_c = (_b = context.viewModel) === null || _b === void 0 ? void 0 : _b.folder.path) !== null && _c !== void 0 ? _c : '';
            },
        }),
        'update inputs': (0, xstate_1.assign)(function (_a) {
            var _b, _c, _d, _e, _f;
            var context = _a.context, event = _a.event;
            (0, xstate_1.assertEvent)(event, 'update.inputs');
            var viewChanged = ((_b = event.inputs.viewModel) === null || _b === void 0 ? void 0 : _b.id) !== ((_c = context.viewModel) === null || _c === void 0 ? void 0 : _c.id);
            var selectedFolder = context.selectedFolder;
            if (!((_d = event.inputs.viewModel) === null || _d === void 0 ? void 0 : _d.folder.path.startsWith(selectedFolder))) {
                selectedFolder = (_f = (_e = event.inputs.viewModel) === null || _e === void 0 ? void 0 : _e.folder.path) !== null && _f !== void 0 ? _f : '';
            }
            return {
                view: event.inputs.view,
                viewModel: event.inputs.viewModel,
                selectedFolder: selectedFolder,
                // allow dropdown to close on mouse leave if view changed
                activatedBy: viewChanged ? 'hover' : context.activatedBy,
            };
        }),
        'reset search query': (0, xstate_1.assign)({
            searchQuery: '',
        }),
        'update search query': (0, xstate_1.assign)(function (_a) {
            var _b;
            var event = _a.event;
            (0, xstate_1.assertEvent)(event, 'searchQuery.change');
            return { searchQuery: (_b = event.value) !== null && _b !== void 0 ? _b : '' };
        }),
        'emit navigateTo': (0, xstate_1.emit)(function (_a) {
            var event = _a.event;
            (0, xstate_1.assertEvent)(event, 'select.view');
            return {
                type: 'navigateTo',
                viewId: event.viewId,
            };
        }),
    },
    guards: {
        'was opened on hover': function (_a) {
            var context = _a.context;
            return context.activatedBy === 'hover';
        },
        'has search query': function (_a) {
            var context = _a.context;
            return !(0, remeda_1.isEmpty)(context.searchQuery);
        },
        'search query is empty': function (_a) {
            var context = _a.context;
            return (0, remeda_1.isEmpty)(context.searchQuery);
        },
    },
}).createMachine({
    id: 'breadcrumbs',
    context: function (_a) {
        var input = _a.input;
        return (__assign(__assign({}, input), { breadcrumbs: [], activatedBy: 'hover', selectedFolder: '', searchQuery: '', folderColumns: [] }));
    },
    initial: 'idle',
    entry: [
        'update activatedBy',
        'reset selected folder',
    ],
    on: {
        'update.inputs': {
            actions: 'update inputs',
        },
        'searchQuery.change': {
            actions: [
                'update search query',
                (0, xstate_1.raise)({ type: 'searchQuery.changed' }),
            ],
        },
    },
    states: {
        idle: {
            id: 'idle',
            on: {
                'breadcrumbs.mouseEnter.*': {
                    target: 'pending',
                    actions: 'update activatedBy',
                },
                'breadcrumbs.click.*': {
                    target: 'active',
                    actions: 'update activatedBy',
                },
            },
        },
        // Breadcrumbs are hovered, but dropdown is not opened yet
        pending: {
            on: {
                'breadcrumbs.mouseEnter.*': {
                    actions: 'update activatedBy',
                },
                'breadcrumbs.mouseLeave.*': {
                    target: 'idle',
                },
                'breadcrumbs.click.*': {
                    target: 'active',
                    actions: 'update activatedBy',
                },
            },
            after: {
                'open timeout': {
                    target: 'active',
                },
            },
        },
        active: {
            tags: ['active'],
            initial: 'decide',
            on: {
                'dropdown.dismiss': {
                    target: '#idle',
                },
                'breadcrumbs.mouseLeave': {
                    guard: 'was opened on hover',
                    target: '.closing',
                },
                'dropdown.mouseLeave': {
                    guard: 'was opened on hover',
                    target: '.closing',
                },
                'searchQuery.changed': {
                    target: '.decide',
                },
            },
            states: {
                // Decide next state based on the search query
                decide: {
                    always: [
                        {
                            guard: 'has search query',
                            target: 'search',
                        },
                        {
                            target: 'opened',
                        },
                    ],
                },
                opened: {
                    on: {
                        'searchQuery.changed': {
                            guard: 'has search query',
                            actions: 'keep dropdown open',
                            target: 'search',
                        },
                        'breadcrumbs.click.viewtitle': {
                            actions: 'reset selected folder',
                        },
                        'breadcrumbs.click.*': {
                            actions: 'update selected folder',
                        },
                        'select.folder': {
                            actions: [
                                'keep dropdown open',
                                'update selected folder',
                            ],
                        },
                        'select.view': {
                            actions: [
                                'emit navigateTo',
                            ],
                        },
                    },
                },
                search: {
                    on: {
                        'breadcrumbs.click.viewtitle': {
                            actions: [
                                'reset search query',
                                'reset selected folder',
                            ],
                            target: 'opened',
                        },
                        'breadcrumbs.click.*': {
                            actions: [
                                'reset search query',
                                'update selected folder',
                            ],
                            target: 'opened',
                        },
                        'select.view': {
                            actions: [
                                'emit navigateTo',
                            ],
                        },
                    },
                },
                closing: {
                    on: {
                        'breadcrumbs.mouseEnter.*': {
                            target: 'decide',
                        },
                        'dropdown.mouseEnter': {
                            target: 'decide',
                        },
                    },
                    after: {
                        'close timeout': {
                            target: '#idle',
                        },
                    },
                },
            },
        },
    },
});
exports.navigationPanelActorLogic = _actorLogic;
