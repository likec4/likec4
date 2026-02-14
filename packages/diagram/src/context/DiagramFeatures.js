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
exports.DefaultFeatures = void 0;
exports.DiagramFeatures = DiagramFeatures;
exports.useEnabledFeatures = useEnabledFeatures;
exports.IfEnabled = IfEnabled;
exports.IfNotEnabled = IfNotEnabled;
exports.IfReadOnly = IfReadOnly;
exports.IfNotReadOnly = IfNotReadOnly;
var react_1 = require("react");
var useSetState_1 = require("../hooks/useSetState");
var useUpdateEffect_1 = require("../hooks/useUpdateEffect");
var FeatureNames = [
    'Controls',
    'Editor',
    'ReadOnly',
    'FocusMode',
    'NavigateTo',
    'ElementDetails',
    'RelationshipDetails',
    'RelationshipBrowser',
    'Search',
    'NavigationButtons',
    'Notations',
    'DynamicViewWalkthrough',
    'FitView',
    'CompareWithLatest',
    'Notes',
    /**
     * Running in VSCode
     */
    'Vscode',
    'ElementTags',
];
exports.DefaultFeatures = {
    enableEditor: false,
    enableReadOnly: true,
    enableCompareWithLatest: false,
    enableControls: false,
    enableDynamicViewWalkthrough: false,
    enableElementDetails: false,
    enableFocusMode: false,
    enableNavigateTo: false,
    enableNotations: false,
    enableRelationshipBrowser: false,
    enableRelationshipDetails: false,
    enableSearch: false,
    enableNavigationButtons: false,
    enableFitView: false,
    enableVscode: false,
    enableElementTags: false,
    enableNotes: false,
};
var DiagramFeaturesContext = (0, react_1.createContext)(exports.DefaultFeatures);
function DiagramFeatures(_a) {
    var children = _a.children, features = _a.features, overrides = _a.overrides;
    var outerScope = (0, react_1.useContext)(DiagramFeaturesContext);
    var _b = (0, useSetState_1.useSetState)(function () { return (__assign(__assign(__assign({}, outerScope), features), overrides)); }), scope = _b[0], setScope = _b[1];
    (0, useUpdateEffect_1.useUpdateEffect)(function () {
        setScope(__assign(__assign(__assign({}, outerScope), features), overrides));
    }, [outerScope, features, overrides, setScope]);
    return (<DiagramFeaturesContext.Provider value={scope}>
      {children}
    </DiagramFeaturesContext.Provider>);
}
var overridesForOverlays = {
    enableControls: false,
    enableReadOnly: true,
    enableCompareWithLatest: false,
};
DiagramFeatures.Overlays = function (_a) {
    var children = _a.children;
    return (<DiagramFeatures overrides={overridesForOverlays}>
      {children}
    </DiagramFeatures>);
};
function useEnabledFeatures() {
    return (0, react_1.useContext)(DiagramFeaturesContext);
}
/**
 * Renders children only if the specified feature is enabled
 * @param feature Feature name
 * @param and Additional AND condition
 * @example
 * <IfEnabled feature="ReadOnly" and={isSomething}>
 *   ...
 * </IfEnabled>
 */
function IfEnabled(_a) {
    var feature = _a.feature, children = _a.children, _b = _a.and, and = _b === void 0 ? true : _b;
    var enabled = useEnabledFeatures()["enable".concat(feature)] === true;
    return enabled && and ? <>{children}</> : null;
}
function IfNotEnabled(_a) {
    var feature = _a.feature, children = _a.children;
    var notEnabled = useEnabledFeatures()["enable".concat(feature)] !== true;
    return notEnabled ? <>{children}</> : null;
}
function IfReadOnly(_a) {
    var children = _a.children;
    var isReadOnly = useEnabledFeatures().enableReadOnly === true;
    return isReadOnly ? <>{children}</> : null;
}
function IfNotReadOnly(_a) {
    var children = _a.children;
    var isReadOnly = useEnabledFeatures().enableReadOnly === true;
    if (isReadOnly) {
        return null;
    }
    return <>{children}</>;
}
