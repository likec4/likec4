import { FqnRef } from './fqnRef';
export var ModelFqnExpr;
(function (ModelFqnExpr) {
    function isWildcard(expr) {
        return 'wildcard' in expr && expr.wildcard === true;
    }
    ModelFqnExpr.isWildcard = isWildcard;
    function isModelRef(ref) {
        return 'ref' in ref && FqnRef.isModelRef(ref.ref);
    }
    ModelFqnExpr.isModelRef = isModelRef;
    function isElementKindExpr(expr) {
        return 'elementKind' in expr && 'isEqual' in expr;
    }
    ModelFqnExpr.isElementKindExpr = isElementKindExpr;
    function isElementTagExpr(expr) {
        return 'elementTag' in expr && 'isEqual' in expr;
    }
    ModelFqnExpr.isElementTagExpr = isElementTagExpr;
    function isWhere(expr) {
        return 'where' in expr && is(expr.where.expr);
    }
    ModelFqnExpr.isWhere = isWhere;
    function isCustom(expr) {
        return 'custom' in expr && (is(expr.custom.expr) || isWhere(expr.custom.expr));
    }
    ModelFqnExpr.isCustom = isCustom;
    function is(expr) {
        return isWildcard(expr)
            || isModelRef(expr)
            || isElementKindExpr(expr)
            || isElementTagExpr(expr);
    }
    ModelFqnExpr.is = is;
    function unwrap(expr) {
        if (isCustom(expr)) {
            expr = expr.custom.expr;
        }
        if (isWhere(expr)) {
            expr = expr.where.expr;
        }
        return expr;
    }
    ModelFqnExpr.unwrap = unwrap;
})(ModelFqnExpr || (ModelFqnExpr = {}));
export var ModelRelationExpr;
(function (ModelRelationExpr) {
    function isDirect(expr) {
        return 'source' in expr && 'target' in expr;
    }
    ModelRelationExpr.isDirect = isDirect;
    function isIncoming(expr) {
        return 'incoming' in expr;
    }
    ModelRelationExpr.isIncoming = isIncoming;
    function isOutgoing(expr) {
        return 'outgoing' in expr;
    }
    ModelRelationExpr.isOutgoing = isOutgoing;
    function isInOut(expr) {
        return 'inout' in expr;
    }
    ModelRelationExpr.isInOut = isInOut;
    function isWhere(expr) {
        return 'where' in expr &&
            (isDirect(expr.where.expr) || isIncoming(expr.where.expr) || isOutgoing(expr.where.expr) ||
                isInOut(expr.where.expr));
    }
    ModelRelationExpr.isWhere = isWhere;
    function isCustom(expr) {
        return 'customRelation' in expr;
    }
    ModelRelationExpr.isCustom = isCustom;
    function is(expr) {
        return isDirect(expr)
            || isIncoming(expr)
            || isOutgoing(expr)
            || isInOut(expr);
    }
    ModelRelationExpr.is = is;
    function unwrap(expr) {
        if (isCustom(expr)) {
            expr = expr.customRelation.expr;
        }
        if (isWhere(expr)) {
            expr = expr.where.expr;
        }
        return expr;
    }
    ModelRelationExpr.unwrap = unwrap;
})(ModelRelationExpr || (ModelRelationExpr = {}));
export var ModelExpression;
(function (ModelExpression) {
    function isWhere(expr) {
        return 'where' in expr;
    }
    ModelExpression.isWhere = isWhere;
    function isRelationWhere(expr) {
        return ModelRelationExpr.isWhere(expr);
    }
    ModelExpression.isRelationWhere = isRelationWhere;
    function isFqnExprWhere(expr) {
        return ModelFqnExpr.isWhere(expr);
    }
    ModelExpression.isFqnExprWhere = isFqnExprWhere;
    function isFqnExpr(expr) {
        return ModelFqnExpr.is(expr) || ModelFqnExpr.isWhere(expr) || ModelFqnExpr.isCustom(expr);
    }
    ModelExpression.isFqnExpr = isFqnExpr;
    function isRelationExpr(expr) {
        return ModelRelationExpr.is(expr) || ModelRelationExpr.isWhere(expr) || ModelRelationExpr.isCustom(expr);
    }
    ModelExpression.isRelationExpr = isRelationExpr;
})(ModelExpression || (ModelExpression = {}));
