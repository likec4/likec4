import { isNullish } from 'remeda';
import { isDynamicView, isElementView, isViewRuleGlobalPredicateRef, isViewRuleGlobalStyle, } from '../../types';
import { nonexhaustive } from '../../utils';
export function resolveGlobalRules(view, globals) {
    if (isElementView(view)) {
        return {
            ...view,
            rules: resolveGlobalRulesInElementView(view.rules, globals),
        };
    }
    if (isDynamicView(view)) {
        return {
            ...view,
            rules: resolveGlobalRulesInDynamicView(view.rules, globals),
        };
    }
    nonexhaustive(view);
}
export function resolveGlobalRulesInElementView(rules, globals) {
    return rules.reduce((acc, rule) => {
        if (isViewRuleGlobalPredicateRef(rule)) {
            const globalPredicates = globals.predicates[rule.predicateId];
            if (isNullish(globalPredicates)) {
                return acc;
            }
            return acc.concat(globalPredicates);
        }
        if (isViewRuleGlobalStyle(rule)) {
            const globalStyles = globals.styles[rule.styleId];
            if (isNullish(globalStyles)) {
                return acc;
            }
            return acc.concat(globalStyles);
        }
        acc.push(rule);
        return acc;
    }, []);
}
export function resolveGlobalRulesInDynamicView(rules, globals) {
    return rules.reduce((acc, rule) => {
        if (isViewRuleGlobalPredicateRef(rule)) {
            const globalPredicates = globals.dynamicPredicates[rule.predicateId];
            if (isNullish(globalPredicates)) {
                return acc;
            }
            return acc.concat(globalPredicates);
        }
        if (isViewRuleGlobalStyle(rule)) {
            const globalStyles = globals.styles[rule.styleId];
            if (isNullish(globalStyles)) {
                return acc;
            }
            return acc.concat(globalStyles);
        }
        acc.push(rule);
        return acc;
    }, []);
}
