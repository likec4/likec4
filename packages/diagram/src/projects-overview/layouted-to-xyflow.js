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
exports.layoutedProjectsViewToXYFlow = layoutedProjectsViewToXYFlow;
var remeda_1 = require("remeda");
var const_1 = require("../base/const");
function layoutedProjectsViewToXYFlow(view) {
    return {
        xynodes: (0, remeda_1.map)(view.nodes, projectNodeToXY),
        xyedges: (0, remeda_1.map)(view.edges, projectEdgeToXY),
    };
}
function projectNodeToXY(_a) {
    var id = _a.id, x = _a.x, y = _a.y, width = _a.width, height = _a.height, node = __rest(_a, ["id", "x", "y", "width", "height"]);
    return {
        id: id,
        position: { x: x, y: y },
        type: 'project',
        initialWidth: width,
        initialHeight: height,
        draggable: false,
        deletable: false,
        zIndex: const_1.ZIndexes.Element,
        style: {
            width: width,
            height: height,
        },
        data: __assign({ id: id, width: width, height: height }, node),
    };
}
function projectEdgeToXY(_a) {
    var id = _a.id, source = _a.source, target = _a.target, edge = __rest(_a, ["id", "source", "target"]);
    return {
        id: id,
        source: source,
        target: target,
        type: 'relationship',
        zIndex: const_1.ZIndexes.Edge,
        deletable: false,
        data: __assign({ id: id, technology: null, labelBBox: null }, edge),
    };
}
