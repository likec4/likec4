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
exports.DiagramActorProvider = DiagramActorProvider;
var react_1 = require("@xstate/react");
var react_2 = require("@xyflow/react");
var react_3 = require("react");
var remeda_1 = require("remeda");
var ErrorFallback_1 = require("../../components/ErrorFallback");
var DiagramEventHandlers_1 = require("../../context/DiagramEventHandlers");
var DiagramFeatures_1 = require("../../context/DiagramFeatures");
var useEditorActorLogic_1 = require("../../editor/useEditorActorLogic");
var safeContext_1 = require("../../hooks/safeContext");
var useDiagram_1 = require("../../hooks/useDiagram");
var useUpdateEffect_1 = require("../../hooks/useUpdateEffect");
var diagram_api_1 = require("./diagram-api");
var machine_1 = require("./machine");
var persistence_1 = require("./persistence");
function DiagramActorProvider(_a) {
    var id = _a.id, view = _a.view, zoomable = _a.zoomable, pannable = _a.pannable, nodesDraggable = _a.nodesDraggable, nodesSelectable = _a.nodesSelectable, fitViewPadding = _a.fitViewPadding, _b = _a.where, where = _b === void 0 ? null : _b, children = _a.children, _defaultVariant = _a.dynamicViewVariant;
    var xystore = (0, react_2.useStoreApi)();
    var editorActor = (0, useEditorActorLogic_1.useEditorActorLogic)();
    var features = (0, DiagramFeatures_1.useEnabledFeatures)();
    var actor = (0, react_1.useActorRef)(machine_1.diagramMachine.provide({
        actors: {
            editorActor: editorActor,
        },
    }), {
        id: "diagram-".concat(id),
        systemId: 'diagram',
        // ...inspector,
        input: {
            xystore: xystore,
            view: view,
            zoomable: zoomable,
            pannable: pannable,
            fitViewPadding: fitViewPadding,
            nodesDraggable: nodesDraggable,
            nodesSelectable: nodesSelectable,
            where: where,
            features: features,
            dynamicViewVariant: _defaultVariant,
        },
    });
    var actorRef = (0, react_3.useRef)(actor);
    if (actorRef.current !== actor) {
        console.warn('DiagramMachine actor instance changed', {
            previous: actorRef.current.getSnapshot().context,
            current: actor.getSnapshot().context,
        });
        actorRef.current = actor;
    }
    var _c = (0, react_3.useState)(function () { return (0, diagram_api_1.makeDiagramApi)(actorRef); }), api = _c[0], setApi = _c[1];
    (0, react_3.useEffect)(function () {
        setApi(function (api) {
            if (api.ref === actorRef) {
                return api;
            }
            console.error('DiagramMachine actorRef changed, creating new DiagramApi instance, this should not happen during the lifetime of the actor');
            return (0, diagram_api_1.makeDiagramApi)(actorRef);
        });
    }, [actorRef]);
    (0, react_3.useEffect)(function () {
        actor.send({ type: 'update.features', features: features });
    }, [actor, features]);
    (0, useUpdateEffect_1.useUpdateEffect)(function () {
        return actor.send({
            type: 'update.inputs',
            inputs: { zoomable: zoomable, where: where, pannable: pannable, fitViewPadding: fitViewPadding, nodesDraggable: nodesDraggable, nodesSelectable: nodesSelectable },
        });
    }, [actor, zoomable, where, pannable, fitViewPadding, nodesDraggable, nodesSelectable]);
    (0, useUpdateEffect_1.useUpdateEffect)(function () {
        if (!_defaultVariant)
            return;
        actor.send({ type: 'switch.dynamicViewVariant', variant: _defaultVariant });
    }, [actor, _defaultVariant]);
    (0, react_3.useEffect)(function () { return actor.send({ type: 'update.view', view: view, source: 'external' }); }, [actor, view]);
    return (<safeContext_1.DiagramActorContextProvider value={actor}>
      <safeContext_1.DiagramApiContextProvider value={api}>
        <ErrorFallback_1.ErrorBoundary>
          <ToggledFeatures>
            {children}
          </ToggledFeatures>
        </ErrorFallback_1.ErrorBoundary>
        <PropagateDiagramActorEvents />
      </safeContext_1.DiagramApiContextProvider>
    </safeContext_1.DiagramActorContextProvider>);
}
var selectToggledFeatures = (0, useDiagram_1.selectDiagramActorContext)(function (context) {
    var _a;
    var toggledFeatures = context.toggledFeatures;
    var hasDrifts = context.view.drifts != null && context.view.drifts.length > 0;
    var enableCompareWithLatest = hasDrifts
        && context.features.enableCompareWithLatest
        && ((_a = toggledFeatures.enableCompareWithLatest) !== null && _a !== void 0 ? _a : false)
        // Compare with latest is disabled during active walkthrough
        && (0, remeda_1.isNullish)(context.activeWalkthrough);
    var enableReadOnly = context.features.enableReadOnly
        || toggledFeatures.enableReadOnly
        // Active walkthrough forces readonly
        || !!context.activeWalkthrough
        // Compare with latest enforces readonly
        || (enableCompareWithLatest && context.view._layout === 'auto');
    // Update toggled features if changed
    if (toggledFeatures.enableReadOnly !== enableReadOnly ||
        toggledFeatures.enableCompareWithLatest !== enableCompareWithLatest) {
        toggledFeatures = __assign(__assign({}, toggledFeatures), { enableCompareWithLatest: enableCompareWithLatest, enableReadOnly: enableReadOnly });
    }
    return toggledFeatures;
});
function ToggledFeatures(_a) {
    var children = _a.children;
    var toggledFeatures = (0, useDiagram_1.useDiagramSnapshot)(selectToggledFeatures);
    (0, useUpdateEffect_1.useUpdateEffect)(function () {
        persistence_1.DiagramToggledFeaturesPersistence.write(toggledFeatures);
    }, [toggledFeatures]);
    return (<DiagramFeatures_1.DiagramFeatures overrides={toggledFeatures}>
      {children}
    </DiagramFeatures_1.DiagramFeatures>);
}
var PropagateDiagramActorEvents = (0, react_3.memo)(function () {
    var diagram = (0, useDiagram_1.useDiagram)();
    var handlers = (0, DiagramEventHandlers_1.useDiagramEventHandlersRef)();
    (0, useDiagram_1.useOnDiagramEvent)('openSource', function (_a) {
        var _b, _c;
        var params = _a.params;
        return (_c = (_b = handlers.current).onOpenSource) === null || _c === void 0 ? void 0 : _c.call(_b, params);
    });
    (0, useDiagram_1.useOnDiagramEvent)('navigateTo', function (_a) {
        var _b, _c;
        var viewId = _a.viewId;
        return (_c = (_b = handlers.current).onNavigateTo) === null || _c === void 0 ? void 0 : _c.call(_b, viewId);
    });
    // useOnDiagramEvent('onChange', ({ change }) => handlers.current.onChange?.({ change }))
    (0, useDiagram_1.useOnDiagramEvent)('onLayoutTypeChange', function (_a) {
        var _b, _c;
        var layoutType = _a.layoutType;
        (_c = (_b = handlers.current).onLayoutTypeChange) === null || _c === void 0 ? void 0 : _c.call(_b, layoutType);
    });
    (0, useDiagram_1.useOnDiagramEvent)('initialized', function (_a) {
        var _b, _c;
        var xyflow = _a.instance;
        try {
            (_c = (_b = handlers.current).onInitialized) === null || _c === void 0 ? void 0 : _c.call(_b, { diagram: diagram, xyflow: xyflow });
        }
        catch (error) {
            console.error(error);
        }
    }, { once: true });
    return null;
});
