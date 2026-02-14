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
exports.RelationshipEdge = void 0;
var css_1 = require("@likec4/styles/css");
var web_1 = require("@react-hookz/web");
var react_1 = require("@xyflow/react");
var react_2 = require("react");
var base_primitives_1 = require("../../../base-primitives");
var DiagramFeatures_1 = require("../../../context/DiagramFeatures");
var useCallbackRef_1 = require("../../../hooks/useCallbackRef");
var useDiagram_1 = require("../../../hooks/useDiagram");
var useSetState_1 = require("../../../hooks/useSetState");
var useUpdateEffect_1 = require("../../../hooks/useUpdateEffect");
var useXYFlow_1 = require("../../../hooks/useXYFlow");
var xyflow_1 = require("../../../utils/xyflow");
var EdgeDrifts_1 = require("./EdgeDrifts");
var edgesCss = require("./edges.css");
var useControlPoints_1 = require("./useControlPoints");
var useRelationshipEdgePath_1 = require("./useRelationshipEdgePath");
var getEdgeCenter = function (path) {
    var dompoint = path.getPointAtLength(path.getTotalLength() * 0.5);
    return {
        x: Math.round(dompoint.x),
        y: Math.round(dompoint.y),
    };
};
exports.RelationshipEdge = (0, base_primitives_1.memoEdge)(function (props) {
    var _a, _b, _c, _d;
    var _e = (0, react_2.useState)(false), isControlPointDragging = _e[0], setIsControlPointDragging = _e[1];
    var isControlPointDraggingRef = (0, react_2.useRef)(isControlPointDragging);
    isControlPointDraggingRef.current = isControlPointDragging;
    var xyflow = (0, useXYFlow_1.useXYFlow)();
    var diagram = (0, useDiagram_1.useDiagram)();
    var _f = (0, DiagramFeatures_1.useEnabledFeatures)(), enableNavigateTo = _f.enableNavigateTo, enableReadOnly = _f.enableReadOnly, enableCompareWithLatest = _f.enableCompareWithLatest;
    var enabledEditing = !enableReadOnly;
    var id = props.id, _g = props.selected, selected = _g === void 0 ? false : _g, _h = props.data, labelBBox = _h.labelBBox, labelXY = _h.labelXY, data = __rest(_h, ["labelBBox", "labelXY"]);
    var navigateTo = enableNavigateTo && !isControlPointDragging ? data.navigateTo : undefined;
    var _j = (0, useControlPoints_1.useControlPoints)(props), controlPoints = _j.controlPoints, setControlPoints = _j.setControlPoints, insertControlPoint = _j.insertControlPoint;
    var edgePath = (0, useRelationshipEdgePath_1.useRelationshipEdgePath)({
        props: props,
        controlPoints: controlPoints,
        isControlPointDragging: isControlPointDragging,
    });
    var labelX = (_a = labelBBox === null || labelBBox === void 0 ? void 0 : labelBBox.x) !== null && _a !== void 0 ? _a : 0, labelY = (_b = labelBBox === null || labelBBox === void 0 ? void 0 : labelBBox.y) !== null && _b !== void 0 ? _b : 0;
    var _k = (0, useSetState_1.useSetState)({
        x: (_c = labelXY === null || labelXY === void 0 ? void 0 : labelXY.x) !== null && _c !== void 0 ? _c : labelX,
        y: (_d = labelXY === null || labelXY === void 0 ? void 0 : labelXY.y) !== null && _d !== void 0 ? _d : labelY,
    }, xyflow_1.isSamePoint), labelPos = _k[0], setLabelPos = _k[1];
    (0, useUpdateEffect_1.useUpdateEffect)(function () {
        if (isControlPointDraggingRef.current) {
            return;
        }
        setLabelPos({
            x: labelX,
            y: labelY,
        });
    }, [labelX, labelY]);
    var svgPathRef = (0, react_2.useRef)(null);
    (0, web_1.useRafEffect)(function () {
        var path = svgPathRef.current;
        if (!path || !isControlPointDragging)
            return;
        setLabelPos(getEdgeCenter(path));
    }, [edgePath, isControlPointDragging]);
    var updateEdgeData = (0, useCallbackRef_1.useCallbackRef)(function (controlPoints) {
        var point = labelBBox && svgPathRef.current ? getEdgeCenter(svgPathRef.current) : null;
        if (point) {
            diagram.updateEdgeData(id, {
                controlPoints: controlPoints,
                labelBBox: __assign(__assign({}, labelBBox), point),
            });
        }
        else {
            diagram.updateEdgeData(id, { controlPoints: controlPoints });
        }
        diagram.stopEditing(true);
        setIsControlPointDragging(false);
    });
    var onControlPointerStartMove = (0, useCallbackRef_1.useCallbackRef)(function () {
        diagram.startEditing('edge');
        setIsControlPointDragging(true);
    });
    var onControlPointerCancelMove = (0, useCallbackRef_1.useCallbackRef)(function () {
        diagram.stopEditing();
        setIsControlPointDragging(false);
    });
    var onControlPointerFinishMove = (0, useCallbackRef_1.useCallbackRef)(function (points) {
        setControlPoints(points);
        requestAnimationFrame(function () {
            updateEdgeData(points);
        });
    });
    var onControlPointerDelete = (0, useCallbackRef_1.useCallbackRef)(function (points) {
        diagram.startEditing('edge');
        setIsControlPointDragging(true);
        setControlPoints(points);
        requestAnimationFrame(function () {
            updateEdgeData(points);
        });
    });
    /**
     * Handle pointer down event on the edge to add new control points
     */
    var onEdgePointerDown = (0, useCallbackRef_1.useCallbackRef)(function (e) {
        if (e.pointerType !== 'mouse') {
            return;
        }
        // Only respond to right-click or when edge is selected
        if (e.button !== 2 && !selected) {
            return;
        }
        e.stopPropagation();
        e.preventDefault();
        diagram.startEditing('edge');
        var newControlPoints = insertControlPoint(xyflow.screenToFlowPosition({
            x: e.clientX,
            y: e.clientY,
        }, { snapToGrid: false }));
        diagram.updateEdgeData(id, { controlPoints: newControlPoints });
        diagram.stopEditing(true);
    });
    // Force hovered state when dragging control point
    if (isControlPointDragging && !props.data.hovered) {
        props = __assign(__assign({}, props), { data: __assign(__assign({}, props.data), { hovered: true }) });
    }
    return (<>
      <base_primitives_1.EdgeContainer {...props} className={(0, css_1.css)({
            '& .react-flow__edge-interaction': {
                cursor: enabledEditing && selected ? 'copy' : undefined,
            },
        })}>
        <base_primitives_1.EdgePath edgeProps={props} svgPath={edgePath} ref={svgPathRef} isDragging={isControlPointDragging} {...enabledEditing && {
        onEdgePointerDown: onEdgePointerDown,
    }}/>
        {enableCompareWithLatest && (<EdgeDrifts_1.EdgeDrifts edgeProps={props} svgPath={edgePath}/>)}
        {labelBBox && (<base_primitives_1.EdgeLabelContainer edgeProps={props} labelPosition={isControlPointDragging ? labelPos : { x: labelX, y: labelY }}>
            <base_primitives_1.EdgeLabel pointerEvents={enabledEditing ? 'none' : 'all'} edgeProps={props}>
              {navigateTo && (<base_primitives_1.EdgeActionButton onClick={function (e) {
                    e.stopPropagation();
                    diagram.navigateTo(navigateTo);
                }}/>)}
            </base_primitives_1.EdgeLabel>
          </base_primitives_1.EdgeLabelContainer>)}
      </base_primitives_1.EdgeContainer>
      {/* Render control points above edge label  */}
      {enabledEditing && controlPoints.length > 0 && (<ControlPoints isControlPointDragging={isControlPointDragging} edgeProps={props} controlPoints={controlPoints} onMove={setControlPoints} onStartMove={onControlPointerStartMove} onCancelMove={onControlPointerCancelMove} onFinishMove={onControlPointerFinishMove} onDelete={onControlPointerDelete}/>)}
    </>);
});
exports.RelationshipEdge.displayName = 'RelationshipEdge';
function ControlPoints(_a) {
    var isControlPointDragging = _a.isControlPointDragging, edgeProps = _a.edgeProps, controlPoints = _a.controlPoints, onMove = _a.onMove, onStartMove = _a.onStartMove, onCancelMove = _a.onCancelMove, onFinishMove = _a.onFinishMove, onDelete = _a.onDelete;
    var xyflowStore = (0, useXYFlow_1.useXYStoreApi)();
    var xyflow = (0, useXYFlow_1.useXYFlow)();
    var edgeId = edgeProps.data.id;
    var controlPointsRef = (0, react_2.useRef)(controlPoints);
    controlPointsRef.current = controlPoints;
    var onLmbControlPointerDown = function (index, e, domNode) {
        var hasMoved = false;
        var initialPoint = { x: e.clientX, y: e.clientY };
        var clientPoint = __assign({}, initialPoint);
        var animationFrameId = null;
        var cp = __spreadArray([], controlPointsRef.current, true);
        var onPointerMove = function (e) {
            clientPoint.x = e.clientX;
            clientPoint.y = e.clientY;
            var isDragging = !(0, xyflow_1.isSamePoint)(initialPoint, clientPoint);
            // Moved
            if (isDragging) {
                if (!hasMoved) {
                    hasMoved = true;
                    onStartMove();
                }
                animationFrameId !== null && animationFrameId !== void 0 ? animationFrameId : (animationFrameId = requestAnimationFrame(function () {
                    animationFrameId = null;
                    var _a = xyflow.screenToFlowPosition(clientPoint, { snapToGrid: false }), x = _a.x, y = _a.y;
                    cp = __spreadArray([], cp, true);
                    cp[index] = {
                        x: Math.trunc(x),
                        y: Math.trunc(y),
                    };
                    onMove(cp);
                }));
            }
            e.stopPropagation();
        };
        var onPointerUp = function (e) {
            e.stopPropagation();
            domNode.removeEventListener('pointermove', onPointerMove, {
                capture: true,
            });
            domNode.removeEventListener('click', stopAndPrevent, {
                capture: true,
            });
            if (animationFrameId !== null) {
                cancelAnimationFrame(animationFrameId);
            }
            if (hasMoved) {
                onFinishMove(cp);
            }
            else {
                onCancelMove();
            }
        };
        domNode.addEventListener('pointermove', onPointerMove, {
            capture: true,
        });
        domNode.addEventListener('pointerup', onPointerUp, {
            once: true,
            capture: true,
        });
        // Handle click to prevent it from being handled by the edge #1945
        domNode.addEventListener('click', stopAndPrevent, {
            capture: true,
            once: true,
        });
    };
    var onRmbControlPointerDown = function (index, e) {
        var newControlPoints = __spreadArray([], controlPointsRef.current, true);
        if (newControlPoints.length <= 1 || index >= newControlPoints.length) {
            return;
        }
        stopAndPrevent(e);
        newControlPoints.splice(index, 1);
        // Defer the update to avoid conflict with the pointerup event
        setTimeout(function () {
            onDelete(newControlPoints);
        }, 10);
    };
    var onControlPointerDown = (0, useCallbackRef_1.useCallbackRef)(function (e) {
        var _a = xyflowStore.getState(), domNode = _a.domNode, addSelectedEdges = _a.addSelectedEdges, edges = _a.edges, unselectNodesAndEdges = _a.unselectNodesAndEdges;
        if (!domNode || e.pointerType !== 'mouse') {
            return;
        }
        var index = parseFloat(e.currentTarget.getAttribute('data-control-point-index') || '');
        if (isNaN(index)) {
            throw new Error('data-control-point-index is not a number');
        }
        switch (e.button) {
            case 0: {
                e.stopPropagation();
                unselectNodesAndEdges({
                    edges: edges.filter(function (ed) { return ed.selected && ed.id !== edgeId; }),
                });
                addSelectedEdges([edgeId]);
                onLmbControlPointerDown(index, e, domNode);
                break;
            }
            case 2:
                onRmbControlPointerDown(index, e);
                break;
        }
    });
    var onControlPointerDblClick = (0, useCallbackRef_1.useCallbackRef)(function (e) {
        if (e.pointerType !== 'mouse') {
            return;
        }
        var index = parseFloat(e.currentTarget.getAttribute('data-control-point-index') || '');
        if (isNaN(index)) {
            console.error(e.currentTarget);
            throw new Error('data-control-point-index is not a number');
        }
        onRmbControlPointerDown(index, e);
    });
    return (<react_1.EdgeLabelRenderer>
      <base_primitives_1.EdgeContainer component="svg" className={edgesCss.controlPointsContainer} {...edgeProps}>
        <g data-active={isControlPointDragging ? true : undefined} className="group" onContextMenu={stopAndPrevent}>
          {controlPoints.map(function (p, i) { return (<circle data-control-point-index={i} onPointerDownCapture={onControlPointerDown} onDoubleClick={onControlPointerDblClick} className={(0, css_1.cx)('nodrag nopan', edgesCss.controlPoint)} key={'controlPoints' + edgeId + '#' + i} cx={p.x} cy={p.y}/>); })}
        </g>
      </base_primitives_1.EdgeContainer>
    </react_1.EdgeLabelRenderer>);
}
var stopAndPrevent = function (e) {
    e.stopPropagation();
    e.preventDefault();
};
