import { FqnExpr, FqnRef } from '@likec4/core/types';
import { AstUtils } from 'langium';
import { isTruthy } from 'remeda';
import { ast, getViewRulePredicateContainer, isFqnRefInsideDeployment } from '../../ast';
import { tryOrLog } from '../_shared';
export const checkFqnRefExpr = (services) => {
    const modelParser = services.likec4.ModelParser;
    return tryOrLog((node, accept) => {
        const parser = modelParser.forDocument(AstUtils.getDocument(node));
        const expr = parser.parseFqnRefExpr(node);
        const viewRulePredicate = getViewRulePredicateContainer(node);
        const isInsideDeploymentButNotStyle = isFqnRefInsideDeployment(node) && !AstUtils.hasContainerOfType(node, n => ast.isDeploymentViewRuleStyle(n) || ast.isViewRuleStyle(n));
        if (viewRulePredicate?.$type === 'DeploymentViewRulePredicate' || isInsideDeploymentButNotStyle) {
            const isPartOfRelationExpr = AstUtils.hasContainerOfType(node, ast.isRelationExpr);
            // This expression is part of element predicate
            if (!isPartOfRelationExpr) {
                if (FqnExpr.isModelRef(expr)) {
                    accept('error', 'Deployment view predicate must reference deployment model', {
                        node,
                    });
                    return;
                }
                if (FqnExpr.isDeploymentRef(expr) && FqnRef.isInsideInstanceRef(expr.ref)) {
                    accept('error', 'Must reference deployment nodes or instances, but not internals', {
                        node,
                    });
                    return;
                }
            }
            if (isTruthy(node.selector) && !ast.isDeploymentNode(node.ref.value?.ref)) {
                accept('warning', `Selector '${node.selector}' applies to deployment nodes only, ignored here`, {
                    node,
                    property: 'selector',
                });
            }
            return;
        }
        if (viewRulePredicate?.$type === 'DynamicViewIncludePredicate') {
            switch (true) {
                case FqnExpr.isElementKindExpr(expr):
                case FqnExpr.isElementTagExpr(expr):
                case FqnExpr.isWildcard(expr): {
                    accept('warning', `Predicate is ignored, as not supported in dynamic views`, {
                        node,
                    });
                    return;
                }
            }
        }
    });
};
