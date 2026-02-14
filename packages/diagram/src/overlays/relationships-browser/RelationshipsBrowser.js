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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RelationshipsBrowser = RelationshipsBrowser;
var css_1 = require("@likec4/styles/css");
var core_1 = require("@mantine/core");
var hooks_1 = require("@mantine/hooks");
var icons_react_1 = require("@tabler/icons-react");
var react_1 = require("@xyflow/react");
var fast_equals_1 = require("fast-equals");
var react_2 = require("motion/react");
var react_3 = require("react");
var BaseXYFlow_1 = require("../../base/BaseXYFlow");
var useCallbackRef_1 = require("../../hooks/useCallbackRef");
var custom_1 = require("./custom");
var hooks_2 = require("./hooks");
var layout_1 = require("./layout");
var SelectElement_1 = require("./SelectElement");
var nodeTypes = {
    element: custom_1.ElementNode,
    compound: custom_1.CompoundNode,
    empty: custom_1.EmptyNode,
};
var edgeTypes = {
    relationship: custom_1.RelationshipEdge,
};
function RelationshipsBrowser(_a) {
    var actorRef = _a.actorRef;
    // const actorRef = useDiagramActorState(s => s.children.relationshipsBrowser)
    // if (actorRef == null) {
    //   return null
    // }
    var initialRef = (0, react_3.useRef)(null);
    if (initialRef.current == null) {
        initialRef.current = {
            initialNodes: [],
            initialEdges: [],
        };
    }
    return (<hooks_2.RelationshipsBrowserActorContext.Provider value={actorRef}>
      <react_1.ReactFlowProvider {...initialRef.current}>
        <react_2.LayoutGroup id={actorRef.sessionId} inherit={false}>
          <react_2.AnimatePresence>
            <RelationshipsBrowserXYFlow />
          </react_2.AnimatePresence>
        </react_2.LayoutGroup>
      </react_1.ReactFlowProvider>
    </hooks_2.RelationshipsBrowserActorContext.Provider>);
}
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
var RelationshipsBrowserXYFlow = (0, react_3.memo)(function () {
    var browser = (0, hooks_2.useRelationshipsBrowser)();
    var _a = (0, hooks_2.useRelationshipsBrowserState)(selector, selectorEq), isActive = _a.isActive, nodes = _a.nodes, edges = _a.edges;
    return (<BaseXYFlow_1.BaseXYFlow id={browser.rootElementId} nodes={nodes} edges={edges} className={(0, css_1.cx)(isActive ? 'initialized' : 'not-initialized', 'relationships-browser')} nodeTypes={nodeTypes} edgeTypes={edgeTypes} fitView={false} onNodeClick={(0, useCallbackRef_1.useCallbackRef)(function (_e, node) {
            _e.stopPropagation();
            browser.send({ type: 'xyflow.nodeClick', node: node });
        })} onEdgeClick={(0, useCallbackRef_1.useCallbackRef)(function (_e, edge) {
            _e.stopPropagation();
            browser.send({ type: 'xyflow.edgeClick', edge: edge });
        })} onPaneClick={(0, useCallbackRef_1.useCallbackRef)(function (_e) {
            _e.stopPropagation();
            browser.send({ type: 'xyflow.paneClick' });
        })} onDoubleClick={(0, useCallbackRef_1.useCallbackRef)(function (_e) {
            browser.send({ type: 'xyflow.paneDblClick' });
        })} onViewportResize={(0, useCallbackRef_1.useCallbackRef)(function () {
            browser.send({ type: 'xyflow.resized' });
        })} onNodesChange={(0, useCallbackRef_1.useCallbackRef)(function (changes) {
            browser.send({ type: 'xyflow.applyNodeChanges', changes: changes });
        })} onEdgesChange={(0, useCallbackRef_1.useCallbackRef)(function (changes) {
            browser.send({ type: 'xyflow.applyEdgeChanges', changes: changes });
        })} onEdgeMouseEnter={(0, useCallbackRef_1.useCallbackRef)(function (_event, edge) {
            if (!edge.data.hovered) {
                browser.send({ type: 'xyflow.edgeMouseEnter', edge: edge });
            }
        })} onEdgeMouseLeave={(0, useCallbackRef_1.useCallbackRef)(function (_event, edge) {
            if (edge.data.hovered) {
                browser.send({ type: 'xyflow.edgeMouseLeave', edge: edge });
            }
        })} onSelectionChange={(0, useCallbackRef_1.useCallbackRef)(function (params) {
            browser.send(__assign({ type: 'xyflow.selectionChange' }, params));
        })} nodesDraggable={false} nodesSelectable pannable zoomable>
      <RelationshipsBrowserInner />
    </BaseXYFlow_1.BaseXYFlow>);
});
var selector2 = function (state) { return ({
    subjectId: state.context.subject,
    viewId: state.context.viewId,
    scope: state.context.scope,
    closeable: state.context.closeable,
}); };
var RelationshipsBrowserInner = (0, react_3.memo)(function () {
    var browser = (0, hooks_2.useRelationshipsBrowser)();
    var _a = (0, hooks_2.useRelationshipsBrowserState)(selector2), subjectId = _a.subjectId, viewId = _a.viewId, scope = _a.scope, closeable = _a.closeable;
    var store = (0, react_1.useStoreApi)();
    var instance = (0, react_1.useReactFlow)();
    (0, react_3.useEffect)(function () {
        if (instance.viewportInitialized) {
            browser.send({ type: 'xyflow.init', instance: instance, store: store });
        }
    }, [store, instance.viewportInitialized, browser]);
    var layouted = (0, layout_1.useRelationshipsView)(subjectId, viewId, scope);
    var _b = (0, hooks_1.useStateHistory)(subjectId), historySubjectId = _b[0], historyOps = _b[1], _c = _b[2], history = _c.history, current = _c.current;
    (0, react_3.useEffect)(function () {
        if (historySubjectId !== subjectId) {
            historyOps.set(subjectId);
        }
    }, [subjectId]);
    (0, react_3.useEffect)(function () {
        if (historySubjectId !== subjectId) {
            browser.navigateTo(historySubjectId);
        }
    }, [historySubjectId, browser]);
    (0, react_3.useEffect)(function () {
        browser.updateView(layouted);
    }, [layouted, browser]);
    var hasStepBack = current > 0;
    var hasStepForward = current + 1 < history.length;
    return (<>
      <TopLeftPanel hasStepBack={hasStepBack} hasStepForward={hasStepForward} onStepBack={function () { return historyOps.back(); }} onStepForward={function () { return historyOps.forward(); }}/>
      {closeable && (<react_1.Panel position="top-right">
          <core_1.Group gap={4} wrap={'nowrap'}>
            <CopyLinkButton subjectId={subjectId}/>
            <core_1.ActionIcon variant="default" color="gray" onClick={function (e) {
                e.stopPropagation();
                browser.close();
            }}>
              <icons_react_1.IconX />
            </core_1.ActionIcon>
          </core_1.Group>
        </react_1.Panel>)}
    </>);
});
var TopLeftPanel = function (_a) {
    var hasStepBack = _a.hasStepBack, hasStepForward = _a.hasStepForward, onStepBack = _a.onStepBack, onStepForward = _a.onStepForward;
    return (<react_1.Panel position="top-left">
      <core_1.Group gap={4} wrap={'nowrap'}>
        <react_2.AnimatePresence mode="popLayout">
          {hasStepBack && (<react_2.m.div layout initial={{ opacity: 0.05, transform: 'translateX(-5px)' }} animate={{ opacity: 1, transform: 'translateX(0)' }} exit={{
                opacity: 0.05,
                transform: 'translateX(-10px)',
            }} key={'back'}>
              <core_1.ActionIcon variant="default" color="gray" onClick={function (e) {
                e.stopPropagation();
                onStepBack();
            }}>
                <icons_react_1.IconChevronLeft />
              </core_1.ActionIcon>
            </react_2.m.div>)}
          {hasStepForward && (<react_2.m.div layout initial={{ opacity: 0.05, transform: 'translateX(5px)' }} animate={{ opacity: 1, transform: 'translateX(0)' }} exit={{
                opacity: 0,
                transform: 'translateX(5px)',
            }} key={'forward'}>
              <core_1.ActionIcon variant="default" color="gray" onClick={function (e) {
                e.stopPropagation();
                onStepForward();
            }}>
                <icons_react_1.IconChevronRight />
              </core_1.ActionIcon>
            </react_2.m.div>)}
        </react_2.AnimatePresence>
        <SelectElement_1.SelectElement />
      </core_1.Group>
    </react_1.Panel>);
};
var Tooltip = core_1.Tooltip.withProps({
    color: 'dark',
    fz: 'xs',
    openDelay: 400,
    closeDelay: 150,
    label: '',
    children: null,
    offset: 4,
    withinPortal: false,
});
/**
 * Builds a shareable URL with the relationships parameter.
 * Handles both browser history routing and hash-based routing.
 * Preserves base paths when app is hosted under a sub-path.
 */
function buildRelationshipUrl(subjectId) {
    var currentUrl = new URL(window.location.href);
    // Hash-based routing: /#/view/name or /base/path/index.html#/view/name
    if (currentUrl.hash.startsWith('#/')) {
        var hashUrl = new URL(currentUrl.hash.substring(1), currentUrl.origin);
        hashUrl.searchParams.set('relationships', subjectId);
        var cleanPath = hashUrl.pathname.replace(/\/$/, '');
        return "".concat(currentUrl.origin).concat(currentUrl.pathname).concat(currentUrl.search, "#").concat(cleanPath).concat(hashUrl.search);
    }
    // Standard browser history routing
    currentUrl.searchParams.set('relationships', subjectId);
    return currentUrl.href;
}
/**
 * Button that copies a direct link to the current relationship view.
 * Shows visual feedback for both success and failure states.
 * Note: Clipboard API requires HTTPS or localhost. This is a browser security restriction, not a code issue.
 */
var CopyLinkButton = function (_a) {
    var subjectId = _a.subjectId;
    var clipboard = (0, hooks_1.useClipboard)({ timeout: 2000 });
    var _b = (0, react_3.useState)(false), copyError = _b[0], setCopyError = _b[1];
    var errorTimeoutRef = (0, react_3.useRef)(null);
    var handleCopy = function (e) { return __awaiter(void 0, void 0, void 0, function () {
        var url;
        return __generator(this, function (_a) {
            e.stopPropagation();
            // Clear previous error state
            setCopyError(false);
            if (errorTimeoutRef.current) {
                clearTimeout(errorTimeoutRef.current);
                errorTimeoutRef.current = null;
            }
            url = buildRelationshipUrl(subjectId);
            // Check if we're NOT in a secure context (HTTP on non-localhost)
            // Clipboard API requires HTTPS or localhost
            if (!window.isSecureContext) {
                setCopyError(true);
                errorTimeoutRef.current = window.setTimeout(function () {
                    setCopyError(false);
                }, 2000);
                return [2 /*return*/];
            }
            // Call clipboard.copy() - Mantine's hook catches errors internally
            // Errors are exposed via clipboard.error property, not thrown
            clipboard.copy(url);
            return [2 /*return*/];
        });
    }); };
    // Watch for clipboard errors - Mantine's useClipboard exposes errors via clipboard.error
    (0, react_3.useEffect)(function () {
        if (clipboard.error) {
            setCopyError(true);
            if (errorTimeoutRef.current) {
                clearTimeout(errorTimeoutRef.current);
            }
            errorTimeoutRef.current = window.setTimeout(function () {
                setCopyError(false);
            }, 2000);
        }
    }, [clipboard.error]);
    // Cleanup timeout on unmount
    (0, react_3.useEffect)(function () {
        return function () {
            if (errorTimeoutRef.current) {
                clearTimeout(errorTimeoutRef.current);
            }
        };
    }, []);
    // Determine icon and tooltip based on state
    var getButtonState = function () {
        if (clipboard.copied) {
            return {
                icon: <icons_react_1.IconCheck />,
                tooltip: 'Link copied!',
            };
        }
        if (copyError) {
            return {
                icon: <icons_react_1.IconAlertTriangle />,
                tooltip: 'Copy failed - Clipboard requires HTTPS or localhost',
            };
        }
        return {
            icon: <icons_react_1.IconLink />,
            tooltip: 'Copy link to this relationship view',
        };
    };
    var buttonState = getButtonState();
    return (<Tooltip label={buttonState.tooltip} withArrow position="top" withinPortal={false}>
      <core_1.ActionIcon variant="default" color="gray" onClick={handleCopy} aria-label="Copy link to this relationship view">
        {buttonState.icon}
      </core_1.ActionIcon>
    </Tooltip>);
};
