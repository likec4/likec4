export function isViewRuleGroup(rule) {
    return 'title' in rule && 'groupRules' in rule && Array.isArray(rule.groupRules);
}
export function isViewRuleRank(rule) {
    return 'rank' in rule && Array.isArray(rule.targets);
}
