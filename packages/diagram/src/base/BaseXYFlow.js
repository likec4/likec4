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
exports.BaseXYFlow = BaseXYFlow;
var css_1 = require("@likec4/styles/css");
var core_1 = require("@mantine/core");
var react_1 = require("@xyflow/react");
var react_2 = require("react");
var useCallbackRef_1 = require("../hooks/useCallbackRef");
var useUpdateEffect_1 = require("../hooks/useUpdateEffect");
var useXYFlow_1 = require("../hooks/useXYFlow");
var roundDpr_1 = require("../utils/roundDpr");
var xyflow_1 = require("../utils/xyflow");
var Background_1 = require("./Background");
var Base_1 = require("./Base");
var const_1 = require("./const");
function BaseXYFlow(_a) {
    var _b;
    var nodes = _a.nodes, edges = _a.edges, onEdgesChange = _a.onEdgesChange, onNodesChange = _a.onNodesChange, className = _a.className, _c = _a.pannable, pannable = _c === void 0 ? true : _c, _d = _a.zoomable, zoomable = _d === void 0 ? true : _d, _e = _a.nodesSelectable, nodesSelectable = _e === void 0 ? true : _e, _f = _a.nodesDraggable, nodesDraggable = _f === void 0 ? false : _f, _g = _a.background, background = _g === void 0 ? 'dots' : _g, children = _a.children, colorMode = _a.colorMode, _h = _a.fitViewPadding, fitViewPadding = _h === void 0 ? 0 : _h, _j = _a.fitView, fitView = _j === void 0 ? true : _j, _k = _a.zoomOnDoubleClick, zoomOnDoubleClick = _k === void 0 ? false : _k, onViewportResize = _a.onViewportResize, onMoveEnd = _a.onMoveEnd, onNodeMouseEnter = _a.onNodeMouseEnter, onNodeMouseLeave = _a.onNodeMouseLeave, onEdgeMouseEnter = _a.onEdgeMouseEnter, onEdgeMouseLeave = _a.onEdgeMouseLeave, props = __rest(_a, ["nodes", "edges", "onEdgesChange", "onNodesChange", "className", "pannable", "zoomable", "nodesSelectable", "nodesDraggable", "background", "children", "colorMode", "fitViewPadding", "fitView", "zoomOnDoubleClick", "onViewportResize", "onMoveEnd", "onNodeMouseEnter", "onNodeMouseLeave", "onEdgeMouseEnter", "onEdgeMouseLeave"]);
    var fitViewOptions = (0, react_2.useMemo)(function () { return ({
        minZoom: const_1.MinZoom,
        maxZoom: 1,
        padding: fitViewPadding,
        includeHiddenNodes: false,
    }); }, [fitViewPadding]);
    var isBgWithPattern = background !== 'transparent' && background !== 'solid';
    var isZoomTooSmall = (0, useXYFlow_1.useIsZoomTooSmall)();
    var xystore = (0, useXYFlow_1.useXYStoreApi)();
    var colorScheme = (0, core_1.useMantineColorScheme)().colorScheme;
    if (!colorMode) {
        colorMode = colorScheme === 'auto' ? 'system' : colorScheme;
    }
    return (<react_1.ReactFlow colorMode={colorMode} nodes={nodes} edges={edges} className={(0, css_1.cx)(background === 'transparent' && 'bg-transparent', className)} {...isZoomTooSmall && (_b = {},
        _b['data-likec4-zoom-small'] = true,
        _b)} zoomOnPinch={zoomable} zoomOnScroll={!pannable && zoomable} {...(!zoomable && {
        zoomActivationKeyCode: null,
    })} zoomOnDoubleClick={zoomOnDoubleClick} maxZoom={zoomable ? const_1.MaxZoom : 1} minZoom={zoomable ? const_1.MinZoom : 1} fitView={fitView} fitViewOptions={fitViewOptions} preventScrolling={zoomable || pannable} defaultMarkerColor="var(--xy-edge-stroke)" noDragClassName="nodrag" noPanClassName="nopan" noWheelClassName="nowheel" panOnScroll={pannable} panOnDrag={pannable} {...(!pannable && {
        panActivationKeyCode: null,
        selectionKeyCode: null,
    })} elementsSelectable={nodesSelectable} nodesFocusable={nodesDraggable || nodesSelectable} edgesFocusable={false} nodesDraggable={nodesDraggable} nodeDragThreshold={4} nodeClickDistance={3} paneClickDistance={3} elevateNodesOnSelect={false} // or edges are not visible after select\
     selectNodesOnDrag={false} onNodesChange={onNodesChange} onEdgesChange={onEdgesChange} onMoveEnd={(0, useCallbackRef_1.useCallbackRef)(function (event, _a) {
            var x = _a.x, y = _a.y, zoom = _a.zoom;
            /**
             * WORKAROUND
             * Viewport transform is not rounded to integers which results in blurry nodes on some resolution
             * https://github.com/xyflow/xyflow/issues/3282
             * https://github.com/likec4/likec4/issues/734
             */
            var roundedX = (0, roundDpr_1.roundDpr)(x), roundedY = (0, roundDpr_1.roundDpr)(y);
            if (x !== roundedX || y !== roundedY) {
                xystore.setState({ transform: [roundedX, roundedY, zoom] });
            }
            onMoveEnd === null || onMoveEnd === void 0 ? void 0 : onMoveEnd(event, { x: roundedX, y: roundedY, zoom: zoom });
        })} onNodeMouseEnter={(0, useCallbackRef_1.useCallbackRef)(function (event, node) {
            if (onNodeMouseEnter) {
                onNodeMouseEnter(event, node);
                return;
            }
            onNodesChange([{
                    id: node.id,
                    type: 'replace',
                    item: Base_1.Base.setHovered(node, true),
                }]);
        })} onNodeMouseLeave={(0, useCallbackRef_1.useCallbackRef)(function (event, node) {
            if (onNodeMouseLeave) {
                onNodeMouseLeave(event, node);
                return;
            }
            onNodesChange([{
                    id: node.id,
                    type: 'replace',
                    item: Base_1.Base.setHovered(node, false),
                }]);
        })} onEdgeMouseEnter={(0, useCallbackRef_1.useCallbackRef)(function (event, edge) {
            if (onEdgeMouseEnter) {
                onEdgeMouseEnter(event, edge);
                return;
            }
            onEdgesChange([{
                    id: edge.id,
                    type: 'replace',
                    item: Base_1.Base.setHovered(edge, true),
                }]);
        })} onEdgeMouseLeave={(0, useCallbackRef_1.useCallbackRef)(function (event, edge) {
            if (onEdgeMouseLeave) {
                onEdgeMouseLeave(event, edge);
                return;
            }
            onEdgesChange([{
                    id: edge.id,
                    type: 'replace',
                    item: Base_1.Base.setHovered(edge, false),
                }]);
        })} onNodeDoubleClick={xyflow_1.stopPropagation} onEdgeDoubleClick={xyflow_1.stopPropagation} {...props}>
      {isBgWithPattern && <Background_1.Background background={background}/>}
      {onViewportResize && <ViewportResizeHanlder onViewportResize={onViewportResize}/>}
      {children}
    </react_1.ReactFlow>);
}
var selectDimensions = function (_a) {
    var width = _a.width, height = _a.height;
    return (width || 1) * (height || 1);
};
var ViewportResizeHanlder = function (_a) {
    var onViewportResize = _a.onViewportResize;
    var square = (0, react_1.useStore)(selectDimensions);
    (0, useUpdateEffect_1.useUpdateEffect)(onViewportResize, [square]);
    return null;
};
