import { isEmptyish, isNullish, omitBy } from 'remeda';
import { exact, isGroupElementKind, isViewRuleGroup, isViewRulePredicate, ModelFqnExpr, } from '../../types';
import { elementExprToPredicate } from './elementExpressionToPredicate';
export function flattenGroupRules(guard) {
    return (rule) => {
        if (isViewRuleGroup(rule)) {
            return rule.groupRules.flatMap(flattenGroupRules(guard));
        }
        if (isViewRulePredicate(rule)) {
            return 'include' in rule ? rule.include.filter(guard) : [];
        }
        return [];
    };
}
export function applyCustomElementProperties(_rules, _nodes) {
    const rules = _rules.flatMap(flattenGroupRules(ModelFqnExpr.isCustom));
    if (rules.length === 0) {
        return _nodes;
    }
    const nodes = [..._nodes];
    for (const { custom: { expr, ...props }, } of rules) {
        const { border, opacity, multiple, iconColor, iconSize, iconPosition, padding, size, textSize, ...rest } = omitBy(props, isNullish);
        const style = exact({
            border,
            opacity,
            multiple,
            iconColor,
            iconSize,
            iconPosition,
            padding,
            size,
            textSize,
        });
        const styleNotEmpty = !isEmptyish(style);
        const propsNotEmpty = !isEmptyish(rest);
        const satisfies = elementExprToPredicate(expr);
        nodes.forEach((node, i) => {
            if (isGroupElementKind(node) || !satisfies(node)) {
                return;
            }
            if (propsNotEmpty) {
                node = {
                    ...node,
                    ...rest,
                    isCustomized: true,
                };
            }
            if (styleNotEmpty) {
                node = {
                    ...node,
                    isCustomized: true,
                    style: {
                        ...node.style,
                        ...style,
                    },
                };
            }
            nodes[i] = node;
        });
    }
    return nodes;
}
