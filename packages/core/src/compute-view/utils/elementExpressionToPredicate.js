import { FqnRef, ModelFqnExpr, whereOperatorAsPredicate, } from '../../types';
import { nonexhaustive, parentFqn } from '../../utils';
export function elementExprToPredicate(target) {
    if (ModelFqnExpr.isCustom(target)) {
        return elementExprToPredicate(target.custom.expr);
    }
    if (ModelFqnExpr.isWhere(target)) {
        const predicate = elementExprToPredicate(target.where.expr);
        const where = whereOperatorAsPredicate(target.where.condition);
        return n => predicate(n) && where(n);
    }
    if (ModelFqnExpr.isElementKindExpr(target)) {
        return target.isEqual ? n => n.kind === target.elementKind : n => n.kind !== target.elementKind;
    }
    if (ModelFqnExpr.isElementTagExpr(target)) {
        return target.isEqual
            ? ({ tags }) => tags.includes(target.elementTag)
            : ({ tags }) => !tags.includes(target.elementTag);
    }
    if (ModelFqnExpr.isWildcard(target)) {
        return () => true;
    }
    if (ModelFqnExpr.isModelRef(target)) {
        const fqn = FqnRef.flatten(target.ref);
        if (target.selector === 'expanded') {
            return (n) => {
                return n.id === fqn || parentFqn(n.id) === fqn;
            };
        }
        if (target.selector === 'descendants' || target.selector === 'children') {
            const fqnWithDot = fqn + '.';
            return (n) => {
                return n.id.startsWith(fqnWithDot);
            };
        }
        return (n) => {
            return n.id === fqn;
        };
    }
    nonexhaustive(target);
}
