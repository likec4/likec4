import { FqnRef } from './fqnRef';
export var FqnExpr;
(function (FqnExpr) {
    function isWildcard(expr) {
        return 'wildcard' in expr && expr.wildcard === true;
    }
    FqnExpr.isWildcard = isWildcard;
    function isModelRef(ref) {
        return 'ref' in ref && FqnRef.isModelRef(ref.ref);
    }
    FqnExpr.isModelRef = isModelRef;
    function isDeploymentRef(expr) {
        return 'ref' in expr && FqnRef.isDeploymentRef(expr.ref);
    }
    FqnExpr.isDeploymentRef = isDeploymentRef;
    function isElementKindExpr(expr) {
        return 'elementKind' in expr && 'isEqual' in expr;
    }
    FqnExpr.isElementKindExpr = isElementKindExpr;
    function isElementTagExpr(expr) {
        return 'elementTag' in expr && 'isEqual' in expr;
    }
    FqnExpr.isElementTagExpr = isElementTagExpr;
    function isWhere(expr) {
        return 'where' in expr && is(expr.where.expr);
    }
    FqnExpr.isWhere = isWhere;
    function isCustom(expr) {
        return 'custom' in expr && (is(expr.custom.expr) || isWhere(expr.custom.expr));
    }
    FqnExpr.isCustom = isCustom;
    function is(expr) {
        return isWildcard(expr)
            || isModelRef(expr)
            || isDeploymentRef(expr)
            || isElementKindExpr(expr)
            || isElementTagExpr(expr);
    }
    FqnExpr.is = is;
    function unwrap(expr) {
        if (isCustom(expr)) {
            expr = expr.custom.expr;
        }
        if (isWhere(expr)) {
            expr = expr.where.expr;
        }
        return expr;
    }
    FqnExpr.unwrap = unwrap;
})(FqnExpr || (FqnExpr = {}));
export var RelationExpr;
(function (RelationExpr) {
    function isDirect(expr) {
        return 'source' in expr && 'target' in expr;
    }
    RelationExpr.isDirect = isDirect;
    function isIncoming(expr) {
        return 'incoming' in expr;
    }
    RelationExpr.isIncoming = isIncoming;
    function isOutgoing(expr) {
        return 'outgoing' in expr;
    }
    RelationExpr.isOutgoing = isOutgoing;
    function isInOut(expr) {
        return 'inout' in expr;
    }
    RelationExpr.isInOut = isInOut;
    function isWhere(expr) {
        return 'where' in expr &&
            (isDirect(expr.where.expr) || isIncoming(expr.where.expr) || isOutgoing(expr.where.expr) ||
                isInOut(expr.where.expr));
    }
    RelationExpr.isWhere = isWhere;
    function isCustom(expr) {
        return 'customRelation' in expr;
    }
    RelationExpr.isCustom = isCustom;
    function is(expr) {
        return isDirect(expr)
            || isIncoming(expr)
            || isOutgoing(expr)
            || isInOut(expr);
    }
    RelationExpr.is = is;
    function unwrap(expr) {
        if (isCustom(expr)) {
            expr = expr.customRelation.expr;
        }
        if (isWhere(expr)) {
            expr = expr.where.expr;
        }
        return expr;
    }
    RelationExpr.unwrap = unwrap;
})(RelationExpr || (RelationExpr = {}));
export var Expression;
(function (Expression) {
    function isWhere(expr) {
        return 'where' in expr;
    }
    Expression.isWhere = isWhere;
    function isRelationWhere(expr) {
        return RelationExpr.isWhere(expr);
    }
    Expression.isRelationWhere = isRelationWhere;
    function isFqnExprWhere(expr) {
        return FqnExpr.isWhere(expr);
    }
    Expression.isFqnExprWhere = isFqnExprWhere;
    function isFqnExpr(expr) {
        return FqnExpr.is(expr) || FqnExpr.isWhere(expr) || FqnExpr.isCustom(expr);
    }
    Expression.isFqnExpr = isFqnExpr;
    function isRelation(expr) {
        return RelationExpr.is(expr) || RelationExpr.isWhere(expr) || RelationExpr.isCustom(expr);
    }
    Expression.isRelation = isRelation;
})(Expression || (Expression = {}));
