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
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.navigating = void 0;
var geometry_1 = require("@likec4/core/geometry");
var utils_1 = require("@likec4/core/utils");
var remeda_1 = require("remeda");
var xstate_1 = require("xstate");
var roundDpr_1 = require("../../utils/roundDpr");
var xyflow_1 = require("../../utils/xyflow");
var convert_to_xyflow_1 = require("../convert-to-xyflow");
var assign_1 = require("./assign");
var machine_actions_1 = require("./machine.actions");
var machine_setup_1 = require("./machine.setup");
var utils_2 = require("./utils");
/**
 * If the user navigates back or forward using the browser's back/forward buttons,
 * update the navigation history and return to the previous or next view.
 */
var handleBrowserForwardBackward = function () {
    return machine_setup_1.machine.assign(function (_a) {
        var context = _a.context, event = _a.event;
        (0, xstate_1.assertEvent)(event, 'update.view');
        var lastOnNavigate = context.lastOnNavigate, _b = context.navigationHistory, currentIndex = _b.currentIndex, history = _b.history;
        var stepCurrent = history[currentIndex];
        if (!stepCurrent || stepCurrent.viewId === event.view.id || !!lastOnNavigate) {
            return {};
        }
        var stepBack = currentIndex > 0 ? history.at(currentIndex - 1) : null;
        if (stepBack && stepBack.viewId === event.view.id) {
            return {
                navigationHistory: {
                    currentIndex: currentIndex - 1,
                    history: history,
                },
                lastOnNavigate: null,
            };
        }
        var stepForward = currentIndex < history.length - 1 ? history.at(currentIndex + 1) : null;
        if (stepForward && stepForward.viewId === event.view.id) {
            return {
                navigationHistory: {
                    currentIndex: currentIndex + 1,
                    history: history,
                },
                lastOnNavigate: null,
            };
        }
        if (event.view._type === 'element' && event.view.viewOf) {
            var toRef_1 = event.view.viewOf;
            var existingNode = context.xynodes.find(function (n) { return (0, utils_2.nodeRef)(n) === toRef_1; });
            if (existingNode) {
                return {
                    lastOnNavigate: {
                        fromView: context.view.id,
                        toView: event.view.id,
                        fromNode: existingNode.id,
                    },
                };
            }
        }
        return {};
    });
};
/**
 * State for handling navigation to a different view.
 * Closes overlays and search, stops sync layout and fit diagram actions,
 * then processes the view update and transitions back to idle state.
 */
exports.navigating = machine_setup_1.machine.createStateConfig({
    id: machine_setup_1.targetState.navigating.slice(1),
    always: __assign(__assign({}, machine_setup_1.to.idle), { actions: [
            (0, machine_actions_1.cancelFitDiagram)(),
            handleBrowserForwardBackward(),
            (0, machine_actions_1.disableCompareWithLatest)(),
            (0, xstate_1.enqueueActions)(function (_a) {
                var _b, _c, _d, _e;
                var enqueue = _a.enqueue, context = _a.context, event = _a.event;
                (0, xstate_1.assertEvent)(event, 'update.view');
                var xyflow = context.xyflow, xystore = context.xystore, _f = context.navigationHistory, currentIndex = _f.currentIndex, history = _f.history;
                var eventWithXYData = 'xynodes' in event ? event : __assign(__assign({}, event), (0, convert_to_xyflow_1.convertToXYFlow)({
                    currentViewId: context.view.id,
                    dynamicViewVariant: context.dynamicViewVariant,
                    view: event.view,
                    where: context.where,
                }));
                (0, utils_1.invariant)(xyflow, 'xyflow is not initialized');
                var currentViewport = xyflow.getViewport();
                // Make 60% zoom step towards the target viewport if zooming out,
                // and 30% if zooming in, to make the transition smoother
                var calcZoomTowardsNextViewport = function (nextViewport) {
                    var zoom = currentViewport.zoom;
                    var diff = nextViewport.zoom - zoom;
                    if (Math.abs(diff) < 0.01) {
                        return nextViewport.zoom;
                    }
                    var coef = diff < 0 ? 0.6 : 0.3;
                    return Math.trunc(10000 * (zoom + diff * coef)) / 10000;
                };
                // Move towards the next viewport and raise set viewport if needed
                var moveTowardsNextViewport = function (nextViewport) {
                    var zoom = calcZoomTowardsNextViewport(nextViewport);
                    if (zoom !== nextViewport.zoom) {
                        xyflow.setViewport({
                            x: (0, roundDpr_1.roundDpr)(nextViewport.x * (1 + currentViewport.zoom - zoom)),
                            y: (0, roundDpr_1.roundDpr)(nextViewport.y * (1 + currentViewport.zoom - zoom)),
                            zoom: zoom,
                        });
                        enqueue((0, machine_actions_1.raiseSetViewport)({
                            delay: 100,
                            viewport: nextViewport,
                        }));
                    }
                    else {
                        xyflow.setViewport(nextViewport, { duration: 0 });
                    }
                };
                var fromHistory = history[currentIndex];
                if (fromHistory && fromHistory.viewId === eventWithXYData.view.id) {
                    var wasFocused = fromHistory.focusedNode, wasActiveWalkthrough = fromHistory.activeWalkthrough, viewportBefore = fromHistory.viewportBefore;
                    var nextCtx = __assign(__assign({}, (0, assign_1.mergeXYNodesEdges)(context, eventWithXYData)), { dynamicViewVariant: (_b = fromHistory.dynamicViewVariant) !== null && _b !== void 0 ? _b : context.dynamicViewVariant, viewportChangedManually: (_c = viewportBefore === null || viewportBefore === void 0 ? void 0 : viewportBefore.wasChangedManually) !== null && _c !== void 0 ? _c : fromHistory.viewportChangedManually, viewport: (_d = viewportBefore === null || viewportBefore === void 0 ? void 0 : viewportBefore.value) !== null && _d !== void 0 ? _d : fromHistory.viewport, viewportBefore: null });
                    enqueue.assign(nextCtx);
                    moveTowardsNextViewport(nextCtx.viewport);
                    if (wasFocused) {
                        enqueue.raise({
                            type: 'focus.node',
                            nodeId: wasFocused,
                        }, { delay: 150 });
                        return;
                    }
                    if (wasActiveWalkthrough) {
                        enqueue.raise({
                            type: 'walkthrough.start',
                            stepId: wasActiveWalkthrough,
                        }, { delay: 150 });
                        return;
                    }
                    return;
                }
                var nextBounds = (0, utils_2.viewBounds)(context, eventWithXYData.view);
                var nextViewport = (0, utils_2.calcViewportForBounds)(context, nextBounds);
                var _g = (0, utils_2.findCorrespondingNode)(context, eventWithXYData), fromNode = _g.fromNode, toNode = _g.toNode;
                if (fromNode && toNode) {
                    var elFrom = xyflow.getInternalNode(fromNode.id);
                    var fromPoint = xyflow.flowToScreenPosition({
                        x: elFrom.internals.positionAbsolute.x,
                        y: elFrom.internals.positionAbsolute.y,
                    });
                    var toPoint = xyflow.flowToScreenPosition({
                        x: toNode.data.x,
                        y: toNode.data.y,
                    });
                    xystore.getState().panBy({
                        x: Math.round(fromPoint.x - toPoint.x),
                        y: Math.round(fromPoint.y - toPoint.y),
                    }).catch(function (err) {
                        console.error('Error during xyflow.panBy', { err: err });
                    });
                    enqueue((0, machine_actions_1.raiseSetViewport)({
                        delay: 100,
                        viewport: nextViewport,
                    }));
                }
                else {
                    var zoom = calcZoomTowardsNextViewport(nextViewport);
                    if (zoom !== nextViewport.zoom) {
                        var _h = context.xystore.getState(), width = _h.width, height = _h.height;
                        var nextCenter = geometry_1.BBox.center(nextBounds);
                        var paddings = (0, xyflow_1.parsePaddings)(context.fitViewPadding, width, height);
                        // Center next bounds in the viewport
                        xyflow.setViewport({
                            x: (0, roundDpr_1.roundDpr)((width - paddings.x) / 2
                                - nextCenter.x * zoom
                                + paddings.left),
                            y: (0, roundDpr_1.roundDpr)((height - paddings.y) / 2
                                - nextCenter.y * zoom
                                + paddings.top),
                            zoom: zoom,
                        });
                        enqueue((0, machine_actions_1.raiseSetViewport)({
                            delay: 100,
                            viewport: nextViewport,
                        }));
                    }
                    else {
                        xyflow.setViewport(nextViewport, { duration: 0 });
                    }
                }
                var updatedHistory = currentIndex < history.length - 1 ? history.slice(0, currentIndex + 1) : __spreadArray([], history, true);
                if (updatedHistory.length > 20) {
                    updatedHistory.shift();
                }
                updatedHistory.push({
                    viewId: event.view.id,
                    viewport: __assign({}, nextViewport),
                    viewportChangedManually: false,
                });
                // Check if we need to focus on a specific element after navigation (from search)
                var focusOnElement = (_e = context.lastOnNavigate) === null || _e === void 0 ? void 0 : _e.focusOnElement;
                var nodeToFocus = (0, remeda_1.isTruthy)(focusOnElement)
                    ? (0, utils_2.findNodeByModelFqn)(eventWithXYData.xynodes, focusOnElement)
                    : null;
                enqueue.assign(__assign(__assign({}, (0, assign_1.mergeXYNodesEdges)(context, eventWithXYData)), { viewportChangedManually: false, lastOnNavigate: null, navigationHistory: {
                        currentIndex: updatedHistory.length - 1,
                        history: updatedHistory,
                    } }));
                if (nodeToFocus) {
                    // Focus on the searched element with auto-unfocus enabled
                    enqueue.raise({
                        type: 'focus.node',
                        nodeId: nodeToFocus.id,
                        autoUnfocus: true,
                    }, { delay: 250 });
                }
            }),
        ] }),
});
