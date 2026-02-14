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
exports.projectOverviewLogic = exports.restoreViewport = exports.fitDiagram = exports.onMouseEnterOrLeave = void 0;
var core_1 = require("@likec4/core");
var react_1 = require("@xyflow/react");
var motion_1 = require("motion");
var remeda_1 = require("remeda");
var xstate_1 = require("xstate");
var actions_1 = require("xstate/actions");
var base_1 = require("../base");
var Base_1 = require("../base/Base");
var layouted_to_xyflow_1 = require("./layouted-to-xyflow");
var persistence_1 = require("./persistence");
var machine = (0, xstate_1.setup)({
    types: {
        context: {},
        tags: '',
        input: {},
        events: {},
        emitted: {},
    },
    guards: {
        isReady: function (_a) {
            var context = _a.context;
            return context.initialized.xydata
                && context.initialized.xyflow && !!context.xystore && !!context.xyflow;
        },
        'click: selected node': function (_a) {
            var event = _a.event;
            return event.type === 'xyflow.click.node' && event.node.selected === true;
        },
    },
});
// Extracted actions
var updateView = function () {
    return machine.assign(function (_a) {
        var event = _a.event;
        (0, xstate_1.assertEvent)(event, 'update.view');
        var _b = (0, layouted_to_xyflow_1.layoutedProjectsViewToXYFlow)(event.view), xynodes = _b.xynodes, xyedges = _b.xyedges;
        return {
            view: event.view,
            xynodes: xynodes,
            xyedges: xyedges,
        };
    });
};
var xyflowApplyNodeChanges = function () {
    return machine.assign(function (_a) {
        var context = _a.context, event = _a.event;
        (0, xstate_1.assertEvent)(event, 'xyflow.applyNodeChanges');
        return {
            xynodes: (0, react_1.applyNodeChanges)(event.changes, context.xynodes),
        };
    });
};
var xyflowApplyEdgeChanges = function () {
    return machine.assign(function (_a) {
        var context = _a.context, event = _a.event;
        (0, xstate_1.assertEvent)(event, 'xyflow.applyEdgeChanges');
        return {
            xyedges: (0, react_1.applyEdgeChanges)(event.changes, context.xyedges),
        };
    });
};
// Mouse event handlers with parameters
var onMouseEnterOrLeave = function () {
    return machine.assign(function (_a) {
        var context = _a.context, event = _a.event;
        (0, xstate_1.assertEvent)(event, [
            'xyflow.mouse.enter.edge',
            'xyflow.mouse.leave.edge',
            'xyflow.mouse.enter.node',
            'xyflow.mouse.leave.node',
        ]);
        var isEnter = event.type.startsWith('xyflow.mouse.enter');
        switch (event.type) {
            case 'xyflow.mouse.enter.edge':
            case 'xyflow.mouse.leave.edge': {
                var edgeId_1 = event.edge.id;
                return {
                    xyedges: context.xyedges.map(function (e) {
                        if (e.id === edgeId_1) {
                            return Base_1.Base.setHovered(e, isEnter);
                        }
                        return e;
                    }),
                };
            }
            case 'xyflow.mouse.enter.node':
            case 'xyflow.mouse.leave.node': {
                var nodeId_1 = event.node.id;
                return {
                    xynodes: context.xynodes.map(function (n) {
                        if (n.id === nodeId_1) {
                            return Base_1.Base.setHovered(n, isEnter);
                        }
                        return n;
                    }),
                };
            }
            default:
                (0, core_1.nonexhaustive)(event);
        }
    });
};
exports.onMouseEnterOrLeave = onMouseEnterOrLeave;
var saveViewport = function () {
    return machine.createAction(function (_a) {
        var context = _a.context;
        var xyflow = context.xyflow;
        if (xyflow) {
            persistence_1.ProjectsOverviewViewportPersistence.write(xyflow.getViewport());
        }
    });
};
var handleClick = function () {
    return machine.enqueueActions(function (_a) {
        var event = _a.event, enqueue = _a.enqueue;
        if (event.type === 'xyflow.click.double') {
            enqueue((0, exports.fitDiagram)());
            return;
        }
    });
};
var fitDiagram = function (params) {
    return machine.enqueueActions(function (_a) {
        var _b, _c;
        var context = _a.context, event = _a.event;
        var bounds = context.view.bounds, duration;
        if (params) {
            bounds = (_b = params.bounds) !== null && _b !== void 0 ? _b : context.view.bounds;
            duration = params.duration;
        }
        else if (event.type === 'xyflow.fitDiagram') {
            bounds = (_c = event.bounds) !== null && _c !== void 0 ? _c : context.view.bounds;
            duration = event.duration;
        }
        // Default values
        duration !== null && duration !== void 0 ? duration : (duration = 450);
        var _d = (0, core_1.nonNullable)(context.xystore).getState(), width = _d.width, height = _d.height, panZoom = _d.panZoom, transform = _d.transform;
        var maxZoom = Math.max(1, transform[2]);
        var viewport = (0, react_1.getViewportForBounds)(bounds, width, height, base_1.MinZoom, maxZoom, context.fitViewPadding);
        viewport.x = Math.round(viewport.x);
        viewport.y = Math.round(viewport.y);
        var animationProps = duration > 0 ? { duration: duration, interpolate: 'smooth' } : undefined;
        panZoom === null || panZoom === void 0 ? void 0 : panZoom.setViewport(viewport, animationProps).catch(function (err) {
            console.error('Error during fitDiagram panZoom setViewport', { err: err });
        });
        persistence_1.ProjectsOverviewViewportPersistence.write(null);
    });
};
exports.fitDiagram = fitDiagram;
var restoreViewport = function () {
    return machine.enqueueActions(function (_a) {
        var context = _a.context, enqueue = _a.enqueue;
        var viewport = persistence_1.ProjectsOverviewViewportPersistence.read();
        if (viewport) {
            var xyflow = (0, core_1.nonNullable)(context.xyflow);
            xyflow.setViewport(viewport, {
                duration: 0,
            });
            return;
        }
        enqueue((0, exports.fitDiagram)({ duration: 0 }));
    });
};
exports.restoreViewport = restoreViewport;
var dispose = function () {
    return machine.assign({
        xyflow: null,
        xystore: null,
        initialized: {
            xyflow: false,
            xydata: false,
        },
        xyedges: [],
        xynodes: [],
    });
};
var assignNavigateTo = function () {
    return machine.assign(function (_a) {
        var event = _a.event, context = _a.context;
        var navigateTo;
        switch (event.type) {
            case 'xyflow.click.node': {
                navigateTo = event.node;
                break;
            }
            case 'navigate.to': {
                navigateTo = (0, core_1.nonNullable)(context.xynodes.find(function (n) { return n.id === event.fromNode; }), "Node ".concat(event.fromNode, " not found"));
                break;
            }
            default: {
                console.warn("Unexpected event ".concat(event.type, " in assignNavigateTo"));
                return {};
            }
        }
        return {
            navigateTo: navigateTo,
        };
    });
};
var _projectOverviewLogic = machine.createMachine({
    id: 'projects-overview',
    context: function (_a) {
        var input = _a.input;
        return (__assign(__assign({}, input), { initialized: {
                xydata: false,
                xyflow: false,
            }, xyflow: null, xystore: null, xynodes: [], xyedges: [] }));
    },
    initial: 'init',
    on: {
        'close': {
            target: '.closed',
        },
    },
    states: {
        init: {
            on: {
                'update.view': {
                    actions: [
                        updateView(),
                        (0, actions_1.assign)(function (_a) {
                            var context = _a.context;
                            return ({
                                initialized: __assign(__assign({}, context.initialized), { xydata: true }),
                            });
                        }),
                    ],
                    target: 'isReady',
                },
                'xyflow.init': {
                    actions: [
                        (0, actions_1.assign)(function (_a) {
                            var context = _a.context, event = _a.event;
                            return ({
                                initialized: __assign(__assign({}, context.initialized), { xyflow: true }),
                                xyflow: event.xyflow,
                                xystore: event.xystore,
                            });
                        }),
                    ],
                    target: 'isReady',
                },
            },
        },
        isReady: {
            always: [{
                    guard: 'isReady',
                    target: 'active',
                }, {
                    target: 'init',
                }],
        },
        active: {
            tags: 'active',
            entry: [
                (0, exports.restoreViewport)(),
            ],
            on: {
                'navigate.to': {
                    actions: assignNavigateTo(),
                    target: 'navigate',
                },
                'xyflow.applyNodeChanges': {
                    actions: xyflowApplyNodeChanges(),
                },
                'xyflow.applyEdgeChanges': {
                    actions: xyflowApplyEdgeChanges(),
                },
                'xyflow.mouse.*': {
                    actions: (0, exports.onMouseEnterOrLeave)(),
                },
                'xyflow.click.*': [
                    {
                        guard: 'click: selected node',
                        actions: assignNavigateTo(),
                        target: 'navigate',
                    },
                    {
                        actions: handleClick(),
                    },
                ],
                'xyflow.fitDiagram': {
                    actions: (0, exports.fitDiagram)(),
                },
                'update.view': {
                    actions: updateView(),
                },
            },
        },
        navigate: {
            tags: 'active',
            entry: [
                saveViewport(),
                (0, actions_1.assign)({
                    xyedges: [],
                }),
                function (_a) {
                    var _b = _a.context, navigateTo = _b.navigateTo, xyflow = _b.xyflow, xystore = _b.xystore, self = _a.self;
                    (0, core_1.invariant)(xyflow && navigateTo, 'Invalid state, xyflow is undefined');
                    var _c = (0, core_1.nonNullable)(xystore).getState(), width = _c.width, domNode = _c.domNode;
                    var nextZoom = (0, remeda_1.clamp)(Math.min((width * 7 / 9) / (navigateTo.data.width)), { min: base_1.MinZoom, max: 2.5 });
                    var next = {
                        x: Math.round(-nextZoom * (navigateTo.position.x) + (width - nextZoom * navigateTo.data.width) / 2),
                        y: Math.round(-nextZoom * (navigateTo.position.y)) + 50,
                    };
                    var current = xyflow.getViewport();
                    var otherNodes = domNode.querySelectorAll(".react-flow__node-project:not([data-id=\"".concat(navigateTo.id, "\"]) > *"));
                    var otherNodesAnimation = (0, motion_1.animate)(otherNodes, {
                        opacity: 0,
                        scale: .9,
                    }, {
                        visualDuration: .25,
                        delay: (0, motion_1.stagger)(.08, { from: 'center' }),
                    });
                    // Target node
                    var v = (0, motion_1.motionValue)(1);
                    var transform = (0, motion_1.mapValue)(v, [1, 0], [
                        "translate(".concat(current.x, "px, ").concat(current.y, "px) scale(").concat(current.zoom, ")"),
                        "translate(".concat(next.x, "px, ").concat(next.y, "px) scale(").concat(nextZoom, ")"),
                    ]);
                    var cancelViewportAnimation = (0, motion_1.styleEffect)(domNode.querySelector('.xyflow__viewport'), { transform: transform });
                    var cancelOpacityAnimation = (0, motion_1.styleEffect)(domNode.querySelector(".react-flow__node-project:is([data-id=\"".concat(navigateTo.id, "\"]) > *")), { opacity: v });
                    var targetAnimation = (0, motion_1.animate)(v, 0, {
                        delay: otherNodes.length > 3 ? .25 : 0,
                        type: 'spring',
                        stiffness: 350,
                        damping: 40,
                        mass: 1.5,
                        visualDuration: .55,
                    });
                    Promise.race([
                        targetAnimation.finished,
                        sleep(750),
                    ]).then(function () {
                        cancelViewportAnimation();
                        cancelOpacityAnimation();
                        targetAnimation.stop();
                        otherNodesAnimation.stop();
                        self.send({
                            type: 'emit.navigate.to',
                            projectId: navigateTo.data.projectId,
                        });
                    });
                },
            ],
            on: {
                'emit.navigate.to': {
                    actions: (0, actions_1.emit)(function (_a) {
                        var event = _a.event;
                        return (__assign(__assign({}, event), { type: 'navigate.to' }));
                    }),
                },
            },
        },
        closed: {
            id: 'closed',
            type: 'final',
            entry: dispose(),
        },
    },
});
exports.projectOverviewLogic = _projectOverviewLogic;
function sleep(ms) {
    return new Promise(function (resolve) { return setTimeout(resolve, ms); });
}
