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
exports.makeDiagramApi = makeDiagramApi;
var utils_1 = require("@likec4/core/utils");
var utils_2 = require("./utils");
function makeDiagramApi(actorRef) {
    return {
        ref: actorRef,
        get actor() {
            return actorRef.current;
        },
        overlays: function () {
            return (0, utils_1.nonNullable)(actorRef.current.getSnapshot().children.overlays, 'Overlays actor not found');
        },
        send: function (event) { return actorRef.current.send(event); },
        navigateTo: function (viewId, fromNode, focusOnElement) {
            actorRef.current.send(__assign(__assign({ type: 'navigate.to', viewId: viewId }, (fromNode && { fromNode: fromNode })), (focusOnElement && { focusOnElement: focusOnElement })));
        },
        navigate: function (direction) {
            actorRef.current.send({ type: "navigate.".concat(direction) });
        },
        fitDiagram: function (duration) {
            if (duration === void 0) { duration = 350; }
            actorRef.current.send({ type: 'xyflow.fitDiagram', duration: duration });
        },
        openRelationshipsBrowser: function (fqn) {
            actorRef.current.send({ type: 'open.relationshipsBrowser', fqn: fqn });
        },
        openSource: function (params) {
            actorRef.current.send(__assign({ type: 'open.source' }, params));
        },
        openElementDetails: function (fqn, fromNode) {
            actorRef.current.send({ type: 'open.elementDetails', fqn: fqn, fromNode: fromNode });
        },
        openRelationshipDetails: function () {
            var params = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                params[_i] = arguments[_i];
            }
            if (params.length === 1) {
                actorRef.current.send({ type: 'open.relationshipDetails', params: { edgeId: params[0] } });
            }
            else {
                actorRef.current.send({ type: 'open.relationshipDetails', params: { source: params[0], target: params[1] } });
            }
        },
        updateNodeData: function (nodeId, data) {
            actorRef.current.send({ type: 'update.nodeData', nodeId: nodeId, data: data });
        },
        updateEdgeData: function (edgeId, data) {
            actorRef.current.send({ type: 'update.edgeData', edgeId: edgeId, data: data });
        },
        startEditing: function (subject) {
            var editorActor = (0, utils_2.typedSystem)(actorRef.current.system).editorActorRef;
            (0, utils_1.invariant)(editorActor, 'No editor actor found in diagram actor system');
            editorActor.send({ type: 'edit.start', subject: subject });
        },
        stopEditing: function (wasChanged) {
            if (wasChanged === void 0) { wasChanged = false; }
            var editorActor = (0, utils_2.typedSystem)(actorRef.current.system).editorActorRef;
            (0, utils_1.invariant)(editorActor, 'No editor actor found in diagram actor system');
            editorActor.send({ type: 'edit.finish', wasChanged: wasChanged });
        },
        undoEditing: function () {
            var editorActor = (0, utils_2.typedSystem)(actorRef.current.system).editorActorRef;
            (0, utils_1.invariant)(editorActor, 'No editor actor found in diagram actor system');
            var hasUndo = editorActor.getSnapshot().context.history.length > 0;
            if (hasUndo) {
                editorActor.send({ type: 'undo' });
            }
            return hasUndo;
        },
        align: function (mode) {
            actorRef.current.send({ type: 'layout.align', mode: mode });
        },
        resetEdgeControlPoints: function () {
            actorRef.current.send({ type: 'layout.resetEdgeControlPoints' });
        },
        focusNode: function (nodeId) {
            actorRef.current.send({ type: 'focus.node', nodeId: nodeId });
        },
        focusOnElement: function (elementFqn) {
            var context = actorRef.current.getSnapshot().context;
            var node = (0, utils_2.findNodeByModelFqn)(context.xynodes, elementFqn);
            if (node) {
                actorRef.current.send({ type: 'focus.node', nodeId: node.id, autoUnfocus: true });
            }
        },
        /**
         * @warning Do not use in render phase
         */
        get currentView() {
            return actorRef.current.getSnapshot().context.view;
        },
        /**
         * @warning Do not use in render phase
         */
        getContext: function () { return actorRef.current.getSnapshot().context; },
        /**
         * @warning Do not use in render phase
         */
        findDiagramNode: function (xynodeId) {
            return (0, utils_2.findDiagramNode)(actorRef.current.getSnapshot().context, xynodeId);
        },
        findEdge: function (xyedgeId) {
            var _a;
            return (_a = actorRef.current.getSnapshot().context.xyedges.find(function (e) { return e.data.id === xyedgeId; })) !== null && _a !== void 0 ? _a : null;
        },
        /**
         * @warning Do not use in render phase
         */
        findDiagramEdge: function (xyedgeId) {
            return (0, utils_2.findDiagramEdge)(actorRef.current.getSnapshot().context, xyedgeId);
        },
        startWalkthrough: function () {
            actorRef.current.send({ type: 'walkthrough.start' });
        },
        walkthroughStep: function (direction) {
            if (direction === void 0) { direction = 'next'; }
            actorRef.current.send({ type: 'walkthrough.step', direction: direction });
        },
        stopWalkthrough: function () {
            actorRef.current.send({ type: 'walkthrough.end' });
        },
        toggleFeature: function (feature, forceValue) {
            actorRef.current.send(__assign({ type: 'toggle.feature', feature: feature }, (forceValue !== undefined && { forceValue: forceValue })));
        },
        highlightNotation: function (notation, kind) {
            actorRef.current.send(__assign({ type: 'notations.highlight', notation: notation }, (kind && { kind: kind })));
        },
        unhighlightNotation: function () {
            actorRef.current.send({ type: 'notations.unhighlight' });
        },
        openSearch: function (searchValue) {
            actorRef.current.send(__assign({ type: 'open.search' }, (searchValue && { search: searchValue })));
        },
        triggerChange: function (change) {
            actorRef.current.send({ type: 'trigger.change', change: change });
        },
        switchDynamicViewVariant: function (variant) {
            actorRef.current.send({ type: 'switch.dynamicViewVariant', variant: variant });
        },
        highlightNode: function (nodeId) {
            actorRef.current.send({ type: 'highlight.node', nodeId: nodeId });
        },
        highlightEdge: function (edgeId) {
            actorRef.current.send({ type: 'highlight.edge', edgeId: edgeId });
        },
        unhighlightAll: function () {
            actorRef.current.send({ type: 'unhighlight.all' });
        },
        centerViewportOnNode: function (nodeId) {
            actorRef.current.send({ type: 'xyflow.centerViewport', nodeId: nodeId });
        },
        centerViewportOnEdge: function (edgeId) {
            actorRef.current.send({ type: 'xyflow.centerViewport', edgeId: edgeId });
        },
    };
}
