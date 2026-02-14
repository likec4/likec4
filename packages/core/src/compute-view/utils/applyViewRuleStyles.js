import { anyPass, filter, forEach, isDefined, isEmpty, isNot, pipe } from 'remeda';
import { isGroupElementKind, isViewRuleStyle, } from '../../types';
import { elementExprToPredicate } from './elementExpressionToPredicate';
export function applyViewRuleStyle(rule, predicate, nodes) {
    const { shape, color, icon, ...rest } = rule.style;
    const nonEmptyStyle = !isEmpty(rest);
    pipe(nodes, filter(isNot(isGroupElementKind)), filter(predicate), forEach(n => {
        n.shape = shape ?? n.shape;
        n.color = color ?? n.color;
        if (isDefined(icon)) {
            n.icon = icon;
        }
        if (isDefined(rule.notation)) {
            n.notation = rule.notation;
        }
        if (nonEmptyStyle) {
            n.style = {
                ...n.style,
                ...rest,
            };
        }
    }));
}
export function applyViewRuleStyles(rules, nodes) {
    for (const rule of rules) {
        if (!isViewRuleStyle(rule) || rule.targets.length === 0) {
            continue;
        }
        const predicates = rule.targets.map(elementExprToPredicate);
        applyViewRuleStyle(rule, anyPass(predicates), nodes);
    }
    return nodes;
}
