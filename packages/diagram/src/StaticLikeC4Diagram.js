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
exports.StaticLikeC4Diagram = StaticLikeC4Diagram;
var css_1 = require("@likec4/styles/css");
var LikeC4Diagram_1 = require("./LikeC4Diagram");
/**
 * StaticLikeC4Diagram is a component that renders a LikeC4 diagram in a static way.
 * (Export/Embed)
 *
 * @internal
 */
function StaticLikeC4Diagram(_a) {
    var view = _a.view, _b = _a.fitView, fitView = _b === void 0 ? true : _b, _c = _a.fitViewPadding, fitViewPadding = _c === void 0 ? '8px' : _c, _d = _a.enableRelationshipDetails, enableRelationshipDetails = _d === void 0 ? false : _d, _e = _a.enableRelationshipBrowser, enableRelationshipBrowser = _e === void 0 ? enableRelationshipDetails : _e, _f = _a.background, background = _f === void 0 ? 'transparent' : _f, className = _a.className, rest = __rest(_a, ["view", "fitView", "fitViewPadding", "enableRelationshipDetails", "enableRelationshipBrowser", "background", "className"]);
    return (<LikeC4Diagram_1.LikeC4Diagram view={view} className={(0, css_1.cx)(className, 'likec4-static-view')} fitView={fitView} fitViewPadding={fitViewPadding} pannable={false} zoomable={false} controls={false} background={background} enableNotations={false} enableElementDetails={false} enableRelationshipDetails={enableRelationshipDetails} enableRelationshipBrowser={enableRelationshipBrowser} enableDynamicViewWalkthrough={false} showNavigationButtons={false} enableCompareWithLatest={false} enableFocusMode={false} enableSearch={false} nodesSelectable={false} enableElementTags={false} enableNotes={false} {...rest}/>);
}
