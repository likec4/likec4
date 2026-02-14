"use strict";
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProjectsOverviewXY = void 0;
var css_1 = require("@likec4/styles/css");
var fast_equals_1 = require("fast-equals");
var react_1 = require("react");
var BaseXYFlow_1 = require("../base/BaseXYFlow");
var useCallbackRef_1 = require("../hooks/useCallbackRef");
var context_1 = require("./context");
var custom_1 = require("./custom");
var hooks_1 = require("./hooks");
var nodeTypes = {
    project: custom_1.ProjectNode,
};
var edgeTypes = {
    relationship: custom_1.RelationshipEdge,
};
var selector = function (state) { return ({
    isActive: state.hasTag('active'),
    nodes: state.context.xynodes,
    edges: state.context.xyedges,
}); };
var selectorEq = function (a, b) {
    return a.isActive === b.isActive &&
        (0, fast_equals_1.shallowEqual)(a.nodes, b.nodes) &&
        (0, fast_equals_1.shallowEqual)(a.edges, b.edges);
};
exports.ProjectsOverviewXY = (0, react_1.memo)(function (_a) {
    var _b = _a.background, background = _b === void 0 ? 'dots' : _b, props = __rest(_a, ["background"]);
    var actorRef = (0, context_1.useProjectsOverviewActor)();
    var _c = (0, hooks_1.useProjectsOverviewState)(selector, selectorEq), isActive = _c.isActive, nodes = _c.nodes, edges = _c.edges;
    var xystore = (0, hooks_1.useProjectsOverviewXYStoreApi)();
    return (<BaseXYFlow_1.BaseXYFlow nodes={nodes} edges={edges} className={(0, css_1.cx)(isActive ? 'initialized' : 'not-initialized', 'projects-overview')} nodeTypes={nodeTypes} edgeTypes={edgeTypes} 
    // Fitview is handled in onInit
    fitView={false} onNodeClick={(0, useCallbackRef_1.useCallbackRef)(function (_e, node) {
            _e.stopPropagation();
            actorRef.send({ type: 'xyflow.click.node', node: node });
        })} onEdgeClick={(0, useCallbackRef_1.useCallbackRef)(function (_e, edge) {
            _e.stopPropagation();
            actorRef.send({ type: 'xyflow.click.edge', edge: edge });
        })} onPaneClick={(0, useCallbackRef_1.useCallbackRef)(function (_e) {
            _e.stopPropagation();
            actorRef.send({ type: 'xyflow.click.pane' });
        })} onDoubleClick={(0, useCallbackRef_1.useCallbackRef)(function (_e) {
            _e.stopPropagation();
            actorRef.send({ type: 'xyflow.click.double' });
        })} onNodesChange={(0, useCallbackRef_1.useCallbackRef)(function (changes) {
            actorRef.send({ type: 'xyflow.applyNodeChanges', changes: changes });
        })} onEdgesChange={(0, useCallbackRef_1.useCallbackRef)(function (changes) {
            actorRef.send({ type: 'xyflow.applyEdgeChanges', changes: changes });
        })} onEdgeMouseEnter={(0, useCallbackRef_1.useCallbackRef)(function (event, edge) {
            actorRef.send({ type: 'xyflow.mouse.enter.edge', edge: edge, event: event });
        })} onEdgeMouseLeave={(0, useCallbackRef_1.useCallbackRef)(function (event, edge) {
            actorRef.send({ type: 'xyflow.mouse.leave.edge', edge: edge, event: event });
        })} onNodeMouseEnter={(0, useCallbackRef_1.useCallbackRef)(function (event, node) {
            actorRef.send({ type: 'xyflow.mouse.enter.node', node: node });
        })} onNodeMouseLeave={(0, useCallbackRef_1.useCallbackRef)(function (event, node) {
            actorRef.send({ type: 'xyflow.mouse.leave.node', node: node });
        })} onInit={(0, useCallbackRef_1.useCallbackRef)(function (xyflow) {
            actorRef.send({ type: 'xyflow.init', xyflow: xyflow, xystore: xystore });
        })} nodesDraggable={false} nodesSelectable pannable zoomable background={background} {...props}/>);
});
exports.ProjectsOverviewXY.displayName = 'ProjectsOverviewXY';
