import { isTruthy } from 'remeda';
export function isViewRulePredicate(rule) {
    return 'include' in rule || 'exclude' in rule;
}
export function isViewRuleStyle(rule) {
    return 'targets' in rule && 'style' in rule;
}
export function isComputedView(view) {
    return view._stage === 'computed';
}
export function isDiagramView(view) {
    return view._stage === 'layouted';
}
export { isDiagramView as isLayoutedView };
export function isElementView(view) {
    return view._type === 'element';
}
export function isScopedElementView(view) {
    return isElementView(view) && isTruthy(view.viewOf);
}
export function isExtendsElementView(view) {
    return isElementView(view) && isTruthy(view.extends);
}
export function isDeploymentView(view) {
    return view._type === 'deployment';
}
export function isDynamicView(view) {
    return view._type === 'dynamic';
}
