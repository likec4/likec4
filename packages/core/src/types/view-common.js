export function isViewRuleGlobalStyle(rule) {
    return 'styleId' in rule;
}
export function isViewRuleGlobalPredicateRef(rule) {
    return 'predicateId' in rule;
}
export function isAutoLayoutDirection(autoLayout) {
    return autoLayout === 'TB' || autoLayout === 'BT' || autoLayout === 'LR' || autoLayout === 'RL';
}
export function isViewRuleAutoLayout(rule) {
    return 'direction' in rule;
}
