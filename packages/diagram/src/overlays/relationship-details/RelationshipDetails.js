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
exports.RelationshipDetails = RelationshipDetails;
var core_1 = require("@likec4/core");
var css_1 = require("@likec4/styles/css");
var core_2 = require("@mantine/core");
var hooks_1 = require("@mantine/hooks");
var icons_react_1 = require("@tabler/icons-react");
var react_1 = require("@xstate/react");
var react_2 = require("@xyflow/react");
var fast_equals_1 = require("fast-equals");
var react_3 = require("motion/react");
var react_4 = require("react");
var remeda_1 = require("remeda");
var BaseXYFlow_1 = require("../../base/BaseXYFlow");
var useLikeC4Model_1 = require("../../hooks/useLikeC4Model");
var compute_1 = require("./compute");
var custom_1 = require("./custom");
var hooks_2 = require("./hooks");
var layout_1 = require("./layout");
var SelectEdge_1 = require("./SelectEdge");
var nodeTypes = {
    element: custom_1.ElementNode,
    compound: custom_1.CompoundNode,
};
var edgeTypes = {
    relationship: custom_1.RelationshipEdge,
};
function RelationshipDetails(_a) {
    var actorRef = _a.actorRef;
    // const actorRef = useDiagramActorState(s => s.children.relationshipsBrowser)
    // if (actorRef == null) {
    //   return null
    // }
    var initialRef = (0, react_4.useRef)(null);
    if (initialRef.current == null) {
        initialRef.current = {
            defaultNodes: [],
            defaultEdges: [],
        };
    }
    return (<hooks_2.RelationshipDetailsActorContext.Provider value={actorRef}>
      <react_2.ReactFlowProvider {...initialRef.current}>
        <react_3.LayoutGroup id={actorRef.sessionId} inherit={false}>
          <react_3.AnimatePresence>
            <RelationshipDetailsInner key="xyflow"/>
            <SyncRelationshipDetailsXYFlow key="sync"/>
          </react_3.AnimatePresence>
        </react_3.LayoutGroup>
      </react_2.ReactFlowProvider>
    </hooks_2.RelationshipDetailsActorContext.Provider>);
}
var selectSubject = function (state) { return (__assign(__assign({}, state.context.subject), { viewId: state.context.viewId })); };
var SyncRelationshipDetailsXYFlow = (0, react_4.memo)(function () {
    var _a;
    var actor = (0, hooks_2.useRelationshipDetailsActor)();
    var subject = (0, react_1.useSelector)(actor, selectSubject, fast_equals_1.deepEqual);
    var likec4model = (0, useLikeC4Model_1.useLikeC4Model)();
    var view = (_a = likec4model.findView(subject.viewId)) !== null && _a !== void 0 ? _a : null;
    var data = (0, react_4.useMemo)(function () {
        var data;
        if ('edgeId' in subject && (0, remeda_1.isTruthy)(subject.edgeId)) {
            (0, core_1.invariant)(view, "view ".concat(subject.viewId, " not found"));
            var edge = (0, core_1.nonNullable)(view.findEdge(subject.edgeId), "edge ".concat(subject.edgeId, " not found in ").concat(subject.viewId));
            data = (0, compute_1.computeEdgeDetailsViewData)([edge.id], view);
        }
        else if (!!subject.source && !!subject.target) {
            data = (0, compute_1.computeRelationshipDetailsViewData)({
                source: likec4model.element(subject.source),
                target: likec4model.element(subject.target),
            });
        }
        else {
            return null;
        }
        return (0, layout_1.layoutRelationshipDetails)(data, view);
    }, [
        subject,
        view,
        likec4model,
    ]);
    var store = (0, react_2.useStoreApi)();
    var instance = (0, react_2.useReactFlow)();
    (0, react_4.useEffect)(function () {
        if (instance.viewportInitialized) {
            actor.send({ type: 'xyflow.init', instance: instance, store: store });
        }
    }, [store, instance.viewportInitialized, actor]);
    (0, react_4.useEffect)(function () {
        if (data !== null) {
            actor.send({ type: 'update.layoutData', data: data });
        }
    }, [data, actor]);
    return null;
});
var selector = function (_a) {
    var context = _a.context;
    return ({
        // subject: context.subject,
        // view: state.context.view,
        initialized: context.initialized.xydata && context.initialized.xyflow,
        nodes: context.xynodes,
        edges: context.xyedges,
    });
};
var RelationshipDetailsInner = (0, react_4.memo)(function () {
    var browser = (0, hooks_2.useRelationshipDetails)();
    var _a = (0, hooks_2.useRelationshipDetailsState)(selector, fast_equals_1.deepEqual), initialized = _a.initialized, nodes = _a.nodes, edges = _a.edges;
    return (<BaseXYFlow_1.BaseXYFlow id={browser.rootElementId} nodes={nodes} edges={edges} className={(0, css_1.cx)(initialized ? 'initialized' : 'not-initialized', 'likec4-relationship-details')} nodeTypes={nodeTypes} edgeTypes={edgeTypes} onNodesChange={(0, hooks_1.useCallbackRef)(function (changes) {
            browser.send({ type: 'xyflow.applyNodeChanges', changes: changes });
        })} onEdgesChange={(0, hooks_1.useCallbackRef)(function (changes) {
            browser.send({ type: 'xyflow.applyEdgeChanges', changes: changes });
        })} fitViewPadding={0.05} onNodeClick={(0, hooks_1.useCallbackRef)(function (e, node) {
            e.stopPropagation();
            browser.send({ type: 'xyflow.nodeClick', node: node });
        })} onEdgeClick={(0, hooks_1.useCallbackRef)(function (e, edge) {
            e.stopPropagation();
            browser.send({ type: 'xyflow.edgeClick', edge: edge });
        })} onPaneClick={(0, hooks_1.useCallbackRef)(function () {
            browser.send({ type: 'xyflow.paneClick' });
        })} onDoubleClick={(0, hooks_1.useCallbackRef)(function () {
            browser.send({ type: 'xyflow.paneDblClick' });
        })} onViewportResize={(0, hooks_1.useCallbackRef)(function () {
            browser.send({ type: 'xyflow.resized' });
        })} onEdgeMouseEnter={(0, hooks_1.useCallbackRef)(function (_event, edge) {
            if (!edge.data.hovered) {
                browser.send({ type: 'xyflow.edgeMouseEnter', edge: edge });
            }
        })} onEdgeMouseLeave={(0, hooks_1.useCallbackRef)(function (_event, edge) {
            if (edge.data.hovered) {
                browser.send({ type: 'xyflow.edgeMouseLeave', edge: edge });
            }
        })} onSelectionChange={(0, hooks_1.useCallbackRef)(function (params) {
            browser.send(__assign({ type: 'xyflow.selectionChange' }, params));
        })} nodesDraggable={false} nodesSelectable fitView={false} pannable zoomable>
      <TopLeftPanel />
      <react_2.Panel position="top-right">
        <core_2.ActionIcon variant="default" color="gray" 
    // color="gray"
    // size={'lg'}
    // data-autofocus
    // autoFocus
    onClick={function (e) {
            e.stopPropagation();
            browser.close();
        }}>
          <icons_react_1.IconX />
        </core_2.ActionIcon>
      </react_2.Panel>
    </BaseXYFlow_1.BaseXYFlow>);
});
// type TopLeftPanelProps = {
//   edge: DiagramEdge
//   view: DiagramView
//   hasStepBack: boolean
//   hasStepForward: boolean
//   onStepBack: () => void
//   onStepForward: () => void
// }
var topLeftPanelselector = function (_a) {
    var context = _a.context;
    return ({
        subject: context.subject,
        viewId: context.viewId,
    });
};
var TopLeftPanel = (0, react_4.memo)(function () {
    var _a = (0, hooks_2.useRelationshipDetailsState)(topLeftPanelselector, fast_equals_1.deepEqual), subject = _a.subject, viewId = _a.viewId;
    var likec4model = (0, useLikeC4Model_1.useLikeC4Model)();
    var view = likec4model.findView(viewId);
    if (!view || !view.isDiagram()) {
        return null;
    }
    var edges = __spreadArray([], view.edges(), true);
    var edge = ('edgeId' in subject && (0, remeda_1.isTruthy)(subject.edgeId))
        ? edges.find(function (e) { return e.id === subject.edgeId; })
        : ((0, remeda_1.find)(edges, function (e) { var _a, _b; return ((_a = e.source.element) === null || _a === void 0 ? void 0 : _a.id) === subject.source && ((_b = e.target.element) === null || _b === void 0 ? void 0 : _b.id) === subject.target; })
            || (0, remeda_1.find)(edges, function (e) {
                var _a, _b, _c, _d, _e, _f, _g, _h;
                return (((_a = e.source.element) === null || _a === void 0 ? void 0 : _a.id) === subject.source ||
                    (0, core_1.isAncestor)((_c = (_b = e.source.element) === null || _b === void 0 ? void 0 : _b.id) !== null && _c !== void 0 ? _c : '__', (_d = subject.source) !== null && _d !== void 0 ? _d : '__')) &&
                    (((_e = e.target.element) === null || _e === void 0 ? void 0 : _e.id) === subject.target || (0, core_1.isAncestor)((_g = (_f = e.target.element) === null || _f === void 0 ? void 0 : _f.id) !== null && _g !== void 0 ? _g : '__', (_h = subject.target) !== null && _h !== void 0 ? _h : '__'));
            }));
    if (!edge) {
        return null;
    }
    return <TopLeftPanelInner edge={edge.$edge} view={view.$view}/>;
});
var TopLeftPanelInner = function (_a) {
    var edge = _a.edge, view = _a.view;
    var browser = (0, hooks_2.useRelationshipDetails)();
    var edgeId = edge.id;
    var _b = (0, hooks_1.useStateHistory)(edge.id), historyEdgeId = _b[0], historyOps = _b[1], _c = _b[2], history = _c.history, current = _c.current;
    (0, react_4.useEffect)(function () {
        if (historyEdgeId !== edgeId) {
            historyOps.set(edgeId);
        }
    }, [edgeId]);
    (0, react_4.useEffect)(function () {
        if (historyEdgeId !== edgeId) {
            browser.navigateTo(historyEdgeId);
        }
    }, [historyEdgeId]);
    var hasStepBack = current > 0;
    var hasStepForward = current + 1 < history.length;
    return (<react_2.Panel position="top-left">
      <core_2.Group gap={4} wrap={'nowrap'}>
        <react_3.AnimatePresence mode="popLayout">
          {hasStepBack && (<react_3.m.div layout initial={{ opacity: 0.05, transform: 'translateX(-5px)' }} animate={{ opacity: 1, transform: 'translateX(0)' }} exit={{
                opacity: 0.05,
                transform: 'translateX(-10px)',
            }} key={'back'}>
              <core_2.ActionIcon variant="default" color="gray" onClick={function (e) {
                e.stopPropagation();
                historyOps.back();
            }}>
                <icons_react_1.IconChevronLeft />
              </core_2.ActionIcon>
            </react_3.m.div>)}
          {hasStepForward && (<react_3.m.div layout initial={{ opacity: 0.05, transform: 'translateX(5px)' }} animate={{ opacity: 1, transform: 'translateX(0)' }} exit={{
                opacity: 0,
                transform: 'translateX(5px)',
            }} key={'forward'}>
              <core_2.ActionIcon variant="default" color="gray" onClick={function (e) {
                e.stopPropagation();
                historyOps.forward();
            }}>
                <icons_react_1.IconChevronRight />
              </core_2.ActionIcon>
            </react_3.m.div>)}

          <core_2.Group gap={'xs'} wrap={'nowrap'} ml={'sm'}>
            {/* <Box fz={'xs'} fw={'500'} style={{ whiteSpace: 'nowrap', userSelect: 'none' }}>Relationships of</Box> */}
            <SelectEdge_1.SelectEdge edge={edge} view={view}/>
          </core_2.Group>
        </react_3.AnimatePresence>
      </core_2.Group>
    </react_2.Panel>);
};
