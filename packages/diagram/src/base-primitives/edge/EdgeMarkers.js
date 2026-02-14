"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EdgeMarkers = void 0;
exports.arrowTypeToMarker = arrowTypeToMarker;
var core_1 = require("@likec4/core");
var Open = function (props) { return (<marker viewBox="-4 -4 14 16" refX={5} refY={4} markerWidth="7" markerHeight="8" preserveAspectRatio="xMaxYMid meet" orient="auto-start-reverse" {...props}>
    <path d="M0,0 L7,4 L0,8 L4,4 Z" stroke="context-stroke" fill="context-stroke" strokeDasharray={0} strokeWidth={1} strokeLinecap={'round'}/>
  </marker>); };
var Arrow = function (props) { return (<marker viewBox="-1 -1 12 10" refX={4} refY={3} markerWidth="8" markerHeight="6" preserveAspectRatio="xMaxYMid meet" orient="auto-start-reverse" {...props}>
    <path d="M 0 0 L 8 3 L 0 6 L 1 3 z" fill="context-stroke" strokeWidth={0}/>
  </marker>); };
var Crow = function (props) { return (<marker viewBox="-1 -1 12 12" refX={8} refY={4} markerWidth="8" markerHeight="8" preserveAspectRatio="xMaxYMid meet" orient="auto-start-reverse" {...props}>
    <path d="M 8 0 L 0 4 L 8 8 M 8 4 L 0 4" fill="none" strokeWidth={1}/>
  </marker>); };
var OArrow = function (props) { return (<marker viewBox="-1 -1 12 10" refX={4} refY={3} markerWidth="8" markerHeight="6" preserveAspectRatio="xMaxYMid meet" orient="auto-start-reverse" {...props}>
    <path d="M 0 0 L 8 3 L 0 6 L 1 3 z" stroke="context-stroke" fill="context-stroke" strokeWidth={1.25} strokeLinejoin="miter" strokeLinecap={'square'}/>
  </marker>); };
var Diamond = function (props) { return (<marker viewBox="-4 -4 16 14" refX={5} refY={4} markerWidth="10" markerHeight="8" preserveAspectRatio="xMaxYMid meet" orient="auto-start-reverse" {...props}>
    <path d="M5,0 L10,4 L5,8 L0,4 Z" fill="context-stroke" strokeWidth={0} strokeLinecap={'round'}/>
  </marker>); };
var ODiamond = function (props) { return (<marker viewBox="-4 -4 16 14" refX={6} refY={4} markerWidth="10" markerHeight="8" preserveAspectRatio="xMaxYMid meet" orient="auto-start-reverse" {...props}>
    <path d="M5,0 L10,4 L5,8 L0,4 Z" stroke="context-stroke" fill="context-stroke" strokeWidth={1.25} strokeLinecap={'round'}/>
  </marker>); };
var Dot = function (props) { return (<marker viewBox="0 0 10 10" refX={4} refY={4} markerWidth="6" markerHeight="6" {...props}>
    <circle strokeWidth={0} fill="context-stroke" cx={4} cy={4} r={3}/>
  </marker>); };
var ODot = function (props) { return (<marker viewBox="0 0 10 10" refX={4} refY={4} markerWidth="6" markerHeight="6" {...props}>
    <circle strokeWidth={1.25} stroke="context-stroke" fill="context-stroke" cx={4} cy={4} r={3}/>
  </marker>); };
exports.EdgeMarkers = {
    Arrow: Arrow,
    Crow: Crow,
    OArrow: OArrow,
    Open: Open,
    Diamond: Diamond,
    ODiamond: ODiamond,
    Dot: Dot,
    ODot: ODot,
};
function arrowTypeToMarker(arrowType) {
    if (!arrowType || arrowType === 'none') {
        return undefined;
    }
    switch (arrowType) {
        case 'normal':
            return 'Arrow';
        case 'crow':
            return 'Crow';
        case 'onormal':
            return 'OArrow';
        case 'diamond':
            return 'Diamond';
        case 'odiamond':
            return 'ODiamond';
        case 'open':
        case 'vee':
            return 'Open';
        case 'dot':
            return 'Dot';
        case 'odot':
            return "ODot";
        default:
            (0, core_1.nonexhaustive)(arrowType);
    }
}
