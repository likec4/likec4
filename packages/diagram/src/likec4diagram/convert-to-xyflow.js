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
exports.convertToXYFlow = convertToXYFlow;
var diagram_view_1 = require("./xyflow-diagram/diagram-view");
var sequence_layout_1 = require("./xyflow-sequence/sequence-layout");
function convertToXYFlow(_a) {
    var dynamicViewVariant = _a.dynamicViewVariant, params = __rest(_a, ["dynamicViewVariant"]);
    var view = params.view;
    var isDynamic = view._type === 'dynamic';
    var _b = isDynamic && dynamicViewVariant === 'sequence'
        ? (0, sequence_layout_1.sequenceLayoutToXY)(view, params.currentViewId)
        : (0, diagram_view_1.diagramToXY)(__assign({}, params)), xynodes = _b.xynodes, xyedges = _b.xyedges;
    if (isDynamic && view.variant !== dynamicViewVariant) {
        return {
            view: __assign(__assign({}, view), { variant: dynamicViewVariant }),
            xynodes: xynodes,
            xyedges: xyedges,
        };
    }
    return {
        view: view,
        xynodes: xynodes,
        xyedges: xyedges,
    };
}
