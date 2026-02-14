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
exports.LikeC4DiagramXYFlow = LikeC4DiagramXYFlow;
var core_1 = require("@likec4/core");
var css_1 = require("@likec4/styles/css");
var hooks_1 = require("@mantine/hooks");
var web_1 = require("@react-hookz/web");
var remeda_1 = require("remeda");
var memoNode_1 = require("../base-primitives/memoNode");
var BaseXYFlow_1 = require("../base/BaseXYFlow");
var context_1 = require("../context");
var RootContainerContext_1 = require("../context/RootContainerContext");
var hooks_2 = require("../hooks");
var useDiagram_1 = require("../hooks/useDiagram");
var useUpdateEffect_1 = require("../hooks/useUpdateEffect");
var custom_1 = require("./custom");
var machine_setup_1 = require("./state/machine.setup");
var utils_1 = require("./state/utils");
var useLayoutConstraints_1 = require("./useLayoutConstraints");
var edgeTypes = {
    relationship: custom_1.BuiltinEdges.RelationshipEdge,
    'seq-step': custom_1.BuiltinEdges.SequenceStepEdge,
};
var builtinNodes = {
    element: (0, memoNode_1.memoNode)(custom_1.BuiltinNodes.ElementNode),
    deployment: (0, memoNode_1.memoNode)(custom_1.BuiltinNodes.DeploymentNode),
    'compound-element': (0, memoNode_1.memoNode)(custom_1.BuiltinNodes.CompoundElementNode),
    'compound-deployment': (0, memoNode_1.memoNode)(custom_1.BuiltinNodes.CompoundDeploymentNode),
    'view-group': (0, memoNode_1.memoNode)(custom_1.BuiltinNodes.ViewGroupNode),
    'seq-actor': (0, memoNode_1.memoNode)(custom_1.BuiltinNodes.SequenceActorNode),
    'seq-parallel': (0, memoNode_1.memoNode)(custom_1.BuiltinNodes.SequenceParallelArea),
};
function prepareNodeTypes(nodeTypes) {
    var _a, _b, _c, _d, _e, _f, _g;
    if (!nodeTypes || (0, remeda_1.isEmpty)(nodeTypes)) {
        return builtinNodes;
    }
    return {
        element: (_a = nodeTypes.element) !== null && _a !== void 0 ? _a : builtinNodes.element,
        deployment: (_b = nodeTypes.deployment) !== null && _b !== void 0 ? _b : builtinNodes.deployment,
        'compound-element': (_c = nodeTypes.compoundElement) !== null && _c !== void 0 ? _c : builtinNodes['compound-element'],
        'compound-deployment': (_d = nodeTypes.compoundDeployment) !== null && _d !== void 0 ? _d : builtinNodes['compound-deployment'],
        'view-group': (_e = nodeTypes.viewGroup) !== null && _e !== void 0 ? _e : builtinNodes['view-group'],
        'seq-actor': (_f = nodeTypes.seqActor) !== null && _f !== void 0 ? _f : builtinNodes['seq-actor'],
        'seq-parallel': (_g = nodeTypes.seqParallel) !== null && _g !== void 0 ? _g : builtinNodes['seq-parallel'],
    };
}
var viewportToTopLeft = function (ctx) {
    var bounds = (0, utils_1.viewBounds)(ctx);
    return {
        x: -bounds.x,
        y: -bounds.y,
        zoom: 1,
    };
};
var selectXYProps = (0, hooks_2.selectDiagramActor)(function (_a) {
    var _b;
    var ctx = _a.context, children = _a.children;
    var enableReadOnly = (0, machine_setup_1.deriveToggledFeatures)(ctx).enableReadOnly;
    var isNotEditingEdge = enableReadOnly || ((_b = children.editor) === null || _b === void 0 ? void 0 : _b.getSnapshot().context.editing) !== 'edge';
    var nodesDraggable = !enableReadOnly && ctx.nodesDraggable;
    // if dynamic view display mode is sequence, disable nodes draggable
    if ((ctx.dynamicViewVariant === 'sequence' && ctx.view._type === 'dynamic')) {
        nodesDraggable = false;
    }
    return (__assign({ enableReadOnly: enableReadOnly, initialized: ctx.initialized.xydata && ctx.initialized.xyflow, nodes: ctx.xynodes, edges: ctx.xyedges, pannable: ctx.pannable, zoomable: ctx.zoomable, nodesDraggable: nodesDraggable, nodesSelectable: ctx.nodesSelectable && isNotEditingEdge, fitViewPadding: ctx.fitViewPadding, enableFitView: ctx.features.enableFitView }, (!ctx.features.enableFitView && {
        viewport: viewportToTopLeft(ctx),
    })));
});
function LikeC4DiagramXYFlow(_a) {
    var _b = _a.background, background = _b === void 0 ? 'dots' : _b, _c = _a.reactFlowProps, reactFlowProps = _c === void 0 ? {} : _c, children = _a.children, renderNodes = _a.renderNodes;
    var diagram = (0, useDiagram_1.useDiagram)();
    var _d = (0, hooks_2.useDiagramSnapshot)(selectXYProps), enableReadOnly = _d.enableReadOnly, initialized = _d.initialized, nodes = _d.nodes, edges = _d.edges, enableFitView = _d.enableFitView, nodesDraggable = _d.nodesDraggable, nodesSelectable = _d.nodesSelectable, props = __rest(_d, ["enableReadOnly", "initialized", "nodes", "edges", "enableFitView", "nodesDraggable", "nodesSelectable"]);
    var _e = (0, context_1.useDiagramEventHandlers)(), onNodeContextMenu = _e.onNodeContextMenu, onCanvasContextMenu = _e.onCanvasContextMenu, onEdgeContextMenu = _e.onEdgeContextMenu, onNodeClick = _e.onNodeClick, onEdgeClick = _e.onEdgeClick, onCanvasClick = _e.onCanvasClick, onCanvasDblClick = _e.onCanvasDblClick;
    var isReducedGraphics = (0, RootContainerContext_1.useIsReducedGraphics)(), layoutConstraints = (0, useLayoutConstraints_1.useLayoutConstraints)(), $isPanning = (0, RootContainerContext_1.usePanningAtom)(), isPanning = (0, hooks_1.useTimeout)(function () {
        $isPanning.set(true);
    }, isReducedGraphics ? 200 : 800), notPanning = (0, hooks_1.useDebouncedCallback)(function () {
        isPanning.clear();
        $isPanning.set(false);
    }, 200), onMove = (0, hooks_2.useCallbackRef)(function (event) {
        if (!event) {
            isPanning.clear();
            return;
        }
        if (!$isPanning.get()) {
            isPanning.start();
        }
        else {
            notPanning();
        }
    }), onMoveEnd = (0, hooks_2.useCallbackRef)(function (event, viewport) {
        if (event) {
            notPanning();
        }
        diagram.send({
            type: 'xyflow.viewportMoved',
            viewport: viewport,
            manually: !!event,
        });
    }), onViewportResize = (0, hooks_2.useCallbackRef)(function () {
        diagram.send({ type: 'xyflow.resized' });
    }), nodeTypes = (0, web_1.useCustomCompareMemo)(function () { return prepareNodeTypes(renderNodes); }, [renderNodes], useUpdateEffect_1.depsShallowEqual);
    (0, hooks_2.useUpdateEffect)(function () {
        console.warn('renderNodes changed - this might degrade performance');
    }, [nodeTypes]);
    return (<BaseXYFlow_1.BaseXYFlow nodes={nodes} edges={edges} className={(0, css_1.cx)(initialized ? 'initialized' : 'not-initialized')} nodeTypes={nodeTypes} edgeTypes={edgeTypes} onNodesChange={(0, hooks_2.useCallbackRef)(function (changes) {
            diagram.send({ type: 'xyflow.applyChanges', nodes: changes });
        })} onEdgesChange={(0, hooks_2.useCallbackRef)(function (changes) {
            diagram.send({ type: 'xyflow.applyChanges', edges: changes });
        })} background={initialized ? background : 'transparent'} 
    // Fitview is handled in onInit
    fitView={false} onNodeClick={(0, hooks_2.useCallbackRef)(function (e, node) {
            e.stopPropagation();
            diagram.send({ type: 'xyflow.nodeClick', node: node });
            onNodeClick === null || onNodeClick === void 0 ? void 0 : onNodeClick(diagram.findDiagramNode(node.id), e);
        })} onEdgeClick={(0, hooks_2.useCallbackRef)(function (e, edge) {
            e.stopPropagation();
            diagram.send({ type: 'xyflow.edgeClick', edge: edge });
            onEdgeClick === null || onEdgeClick === void 0 ? void 0 : onEdgeClick(diagram.findDiagramEdge(edge.id), e);
        })} onEdgeDoubleClick={(0, hooks_2.useCallbackRef)(function (e, edge) {
            e.stopPropagation();
            diagram.send({ type: 'xyflow.edgeDoubleClick', edge: edge });
        })} onPaneClick={(0, hooks_2.useCallbackRef)(function (e) {
            e.stopPropagation();
            diagram.send({ type: 'xyflow.paneClick' });
            onCanvasClick === null || onCanvasClick === void 0 ? void 0 : onCanvasClick(e);
        })} onDoubleClick={(0, hooks_2.useCallbackRef)(function (e) {
            e.stopPropagation();
            e.preventDefault();
            diagram.send({ type: 'xyflow.paneDblClick' });
            onCanvasDblClick === null || onCanvasDblClick === void 0 ? void 0 : onCanvasDblClick(e);
        })} onNodeMouseEnter={(0, hooks_2.useCallbackRef)(function (event, node) {
            event.stopPropagation();
            diagram.send({ type: 'xyflow.nodeMouseEnter', node: node });
        })} onNodeMouseLeave={(0, hooks_2.useCallbackRef)(function (event, node) {
            event.stopPropagation();
            diagram.send({ type: 'xyflow.nodeMouseLeave', node: node });
        })} onEdgeMouseEnter={(0, hooks_2.useCallbackRef)(function (event, edge) {
            event.stopPropagation();
            diagram.send({ type: 'xyflow.edgeMouseEnter', edge: edge, event: event });
        })} onEdgeMouseLeave={(0, hooks_2.useCallbackRef)(function (event, edge) {
            event.stopPropagation();
            diagram.send({ type: 'xyflow.edgeMouseLeave', edge: edge, event: event });
        })} onMove={onMove} onMoveEnd={onMoveEnd} onInit={(0, hooks_2.useCallbackRef)(function (instance) {
            diagram.send({ type: 'xyflow.init', instance: instance });
        })} onNodeContextMenu={(0, hooks_2.useCallbackRef)(function (event, node) {
            var diagramNode = (0, core_1.nonNullable)(diagram.findDiagramNode(node.id), "diagramNode ".concat(node.id, " not found"));
            onNodeContextMenu === null || onNodeContextMenu === void 0 ? void 0 : onNodeContextMenu(diagramNode, event);
        })} onEdgeContextMenu={(0, hooks_2.useCallbackRef)(function (event, edge) {
            var diagramEdge = (0, core_1.nonNullable)(diagram.findDiagramEdge(edge.id), "diagramEdge ".concat(edge.id, " not found"));
            onEdgeContextMenu === null || onEdgeContextMenu === void 0 ? void 0 : onEdgeContextMenu(diagramEdge, event);
        })} {...onCanvasContextMenu && {
        onPaneContextMenu: onCanvasContextMenu,
    }} {...enableFitView && {
        onViewportResize: onViewportResize,
    }} nodesDraggable={nodesDraggable} nodesSelectable={nodesSelectable} elevateEdgesOnSelect={!enableReadOnly} zIndexMode="manual" {...(nodesDraggable && layoutConstraints)} {...props} {...reactFlowProps}>
      {children}
    </BaseXYFlow_1.BaseXYFlow>);
}
