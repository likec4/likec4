"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deriveElementStates = deriveElementStates;
var utils_1 = require("@likec4/core/utils");
var remeda_1 = require("remeda");
/**
 * Derives the state of elements in the view based on the active rules.
 *
 * Categorizes elements into:
 * - Explicitly included: Elements that are both in the view and have an enabled include rule
 * - Implicitly included: Elements in the view without an explicit include rule
 * - Excluded: Elements with an enabled exclude rule that are not in the view
 */
function deriveElementStates(_a) {
    var rules = _a.rules, view = _a.view;
    var includedInView = new Set(view ? view.nodes.map(function (node) { var _a; return (_a = node.modelRef) !== null && _a !== void 0 ? _a : null; }).filter(remeda_1.isNonNullish) : []);
    var explicits = (0, remeda_1.pipe)(rules, (0, remeda_1.filter)(function (r) { return r.type === 'include' && r.enabled; }), (0, remeda_1.map)(function (r) { return r.expr.ref.model; }), (0, utils_1.toSet)());
    var excluded = (0, remeda_1.pipe)(rules, (0, remeda_1.filter)(function (r) { return r.type === 'exclude' && r.enabled; }), (0, remeda_1.map)(function (r) { return r.expr.ref.model; }), (0, utils_1.toSet)());
    var disabled = (0, remeda_1.pipe)(rules, (0, remeda_1.filter)(function (r) { return !r.enabled; }), (0, remeda_1.map)(function (r) { return r.expr.ref.model; }), (0, utils_1.toSet)());
    return {
        disabled: disabled,
        includedExplicit: explicits,
        includedImplicit: (0, utils_1.difference)(includedInView, explicits),
        excluded: (0, utils_1.difference)(excluded, includedInView),
    };
}
