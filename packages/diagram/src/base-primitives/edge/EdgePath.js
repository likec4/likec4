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
exports.EdgePath = void 0;
var css_1 = require("@likec4/styles/css");
var recipes_1 = require("@likec4/styles/recipes");
var react_1 = require("react");
var EdgeMarkers_1 = require("./EdgeMarkers");
exports.EdgePath = (0, react_1.forwardRef)(function (_a, svgPathRef) {
    var _b;
    var _c = _a.edgeProps, id = _c.id, _d = _c.data, line = _d.line, dir = _d.dir, tail = _d.tail, head = _d.head, _e = _c.selectable, selectable = _e === void 0 ? true : _e, style = _c.style, interactionWidth = _c.interactionWidth, _f = _a.isDragging, isDragging = _f === void 0 ? false : _f, // omit
    onEdgePointerDown = _a.onEdgePointerDown, strokeWidth = _a.strokeWidth, svgPath = _a.svgPath;
    var markerStartName = (0, EdgeMarkers_1.arrowTypeToMarker)(tail);
    var markerEndName = (0, EdgeMarkers_1.arrowTypeToMarker)(head !== null && head !== void 0 ? head : 'normal');
    if (dir === 'back') {
        ;
        _b = [markerEndName, markerStartName], markerStartName = _b[0], markerEndName = _b[1];
    }
    var MarkerStart = markerStartName ? EdgeMarkers_1.EdgeMarkers[markerStartName] : null;
    var MarkerEnd = markerEndName ? EdgeMarkers_1.EdgeMarkers[markerEndName] : null;
    var isDotted = line === 'dotted';
    var isDashed = isDotted || line === 'dashed';
    var strokeDasharray;
    if (isDotted) {
        strokeDasharray = '1,8';
    }
    else if (isDashed) {
        strokeDasharray = '8,10';
    }
    var classes = (0, recipes_1.edgePath)();
    return (<>
      {selectable && (<path className={(0, css_1.cx)('react-flow__edge-interaction', (0, css_1.css)({
                fill: 'none',
            }))} onPointerDown={onEdgePointerDown} d={svgPath} style={__assign({ strokeWidth: interactionWidth !== null && interactionWidth !== void 0 ? interactionWidth : 10, stroke: 'currentcolor', strokeOpacity: 0 }, isDragging ? { display: 'none' } : {})}/>)}
      <circle className={(0, css_1.cx)(
        // This class is queried by RelationshipPopover to position in the middle of the edge
        'likec4-edge-middle-point', classes.middlePoint)} data-edge-id={id} style={{
            offsetPath: "path(\"".concat(svgPath, "\")"),
        }}/>

      <g className={classes.markersCtx} onPointerDown={onEdgePointerDown}>
        <defs>
          {MarkerStart && <MarkerStart id={'start' + id}/>}
          {MarkerEnd && <MarkerEnd id={'end' + id}/>}
        </defs>
        <path className={(0, css_1.cx)('react-flow__edge-path', 'hide-on-reduced-graphics', classes.pathBg, isDragging && (0, css_1.css)({ display: 'none' }))} d={svgPath} style={style} strokeLinecap={'round'}/>
        <path ref={svgPathRef} className={(0, css_1.cx)('react-flow__edge-path', classes.path, selectable && 'react-flow__edge-interaction')} d={svgPath} style={style} strokeWidth={strokeWidth} strokeLinecap={'round'} strokeDasharray={strokeDasharray} markerStart={MarkerStart ? "url(#start".concat(id, ")") : undefined} markerEnd={MarkerEnd ? "url(#end".concat(id, ")") : undefined}/>
      </g>
    </>);
});
exports.EdgePath.displayName = 'EdgePath';
