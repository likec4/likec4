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
exports.DeploymentElementActions = void 0;
exports.ElementActions = ElementActions;
var icons_react_1 = require("@tabler/icons-react");
var react_1 = require("react");
var remeda_1 = require("remeda");
var base_primitives_1 = require("../../../base-primitives");
var DiagramFeatures_1 = require("../../../context/DiagramFeatures");
var useDiagram_1 = require("../../../hooks/useDiagram");
/**
 * Center-Bottom action bar, includes zoom-in and browse relationships actions, if the features are enabled.
 * Intended to be used with model elements.
 *
 * Use generic {@link ElementActionButtons} for custom action buttons.
 *
 * @param extraButtons - Add extra action buttons
 *
 * @example
 * ```tsx
 * <ElementActions
 *   extraButtons={[
 *     {
 *       key: 'extra',
 *       icon: <IconZoomScan />,
 *       onClick: (e) => {
 *         e.stopPropagation()
 *         console.log('extra action clicked')
 *       },
 *       },
 *     },
 *   ]}
 * />
 * ```
 */
function ElementActions(_a) {
    var extraButtons = _a.extraButtons, props = __rest(_a, ["extraButtons"]);
    var _b = (0, DiagramFeatures_1.useEnabledFeatures)(), enableNavigateTo = _b.enableNavigateTo, enableRelationshipBrowser = _b.enableRelationshipBrowser;
    var diagram = (0, useDiagram_1.useDiagram)();
    var _c = props.data, id = _c.id, navigateTo = _c.navigateTo, modelFqn = _c.modelFqn;
    var buttons = (0, react_1.useMemo)(function () {
        var buttons = [];
        if (navigateTo && enableNavigateTo) {
            buttons.push({
                key: 'navigate',
                icon: <icons_react_1.IconZoomScan />,
                onClick: function (e) {
                    e.stopPropagation();
                    diagram.navigateTo(navigateTo, id);
                },
            });
        }
        if (enableRelationshipBrowser) {
            buttons.push({
                key: 'relationships',
                icon: <icons_react_1.IconTransform />,
                onClick: function (e) {
                    e.stopPropagation();
                    diagram.openRelationshipsBrowser(modelFqn);
                },
            });
        }
        return buttons;
    }, [enableNavigateTo, enableRelationshipBrowser, modelFqn, navigateTo, id, diagram]);
    if (extraButtons && (0, remeda_1.hasAtLeast)(extraButtons, 1)) {
        buttons = __spreadArray(__spreadArray([], buttons, true), extraButtons, true);
    }
    // Spread all ReactFlow node props and override buttons with our computed buttons
    return <base_primitives_1.ElementActionButtons {...props} buttons={buttons}/>;
}
/**
 * Center-Bottom action bar, includes zoom-in and browse relationships actions, if the features are enabled.
 * Intended to be used with deployment elements.
 *
 * Use generic {@link ElementActionButtons} for custom action buttons.
 *
 * @param extraButtons - Add extra action buttons
 *
 * @example
 * ```tsx
 * <DeploymentElementActions
 *   extraButtons={[
 *     {
 *       key: 'extra',
 *       icon: <IconZoomScan />,
 *       onClick: (e) => {
 *         e.stopPropagation()
 *         console.log('extra action clicked')
 *       },
 *       },
 *     },
 *   ]}
 * />
 * ```
 */
var DeploymentElementActions = function (_a) {
    var extraButtons = _a.extraButtons, props = __rest(_a, ["extraButtons"]);
    var _b = (0, DiagramFeatures_1.useEnabledFeatures)(), enableNavigateTo = _b.enableNavigateTo, enableRelationshipBrowser = _b.enableRelationshipBrowser;
    var diagram = (0, useDiagram_1.useDiagram)();
    var _c = props.data, id = _c.id, navigateTo = _c.navigateTo, modelFqn = _c.modelFqn;
    var buttons = (0, react_1.useMemo)(function () {
        var buttons = [];
        if (navigateTo && enableNavigateTo) {
            buttons.push({
                key: 'navigate',
                icon: <icons_react_1.IconZoomScan />,
                onClick: function (e) {
                    e.stopPropagation();
                    diagram.navigateTo(navigateTo, id);
                },
            });
        }
        if (enableRelationshipBrowser && !!modelFqn) {
            buttons.push({
                key: 'relationships',
                icon: <icons_react_1.IconTransform />,
                onClick: function (e) {
                    e.stopPropagation();
                    diagram.openRelationshipsBrowser(modelFqn);
                },
            });
        }
        return buttons;
    }, [enableNavigateTo, enableRelationshipBrowser, modelFqn, navigateTo, id]);
    if (extraButtons && (0, remeda_1.hasAtLeast)(extraButtons, 1)) {
        buttons = __spreadArray(__spreadArray([], buttons, true), extraButtons, true);
    }
    // Spread all ReactFlow node props and override buttons with our computed buttons
    return <base_primitives_1.ElementActionButtons {...props} buttons={buttons}/>;
};
exports.DeploymentElementActions = DeploymentElementActions;
