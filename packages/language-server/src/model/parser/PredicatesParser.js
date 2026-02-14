import { nonexhaustive } from '@likec4/core';
import { ast } from '../../ast';
export function PredicatesParser(B) {
    return class PredicatesParser extends B {
        parsePredicate(astNode) {
            return this.parseExpressionV2(astNode);
        }
        parseElementPredicate(astNode) {
            if (ast.isFqnExprWith(astNode)) {
                return this.parseFqnExprWith(astNode);
            }
            if (ast.isFqnExprOrWhere(astNode)) {
                return this.parseFqnExprOrWhere(astNode);
            }
            nonexhaustive(astNode);
        }
        parseElementPredicateOrWhere(astNode) {
            return this.parseFqnExprOrWhere(astNode);
        }
        parseElementExpression(astNode) {
            return this.parseFqnExpr(astNode);
        }
        parseElementPredicateWhere(astNode) {
            return this.parseFqnExprWhere(astNode);
        }
        parseElementPredicateWith(astNode) {
            return this.parseFqnExprWith(astNode);
        }
        parseRelationPredicate(astNode) {
            return this.parseRelationExprOrWith(astNode);
        }
        parseRelationPredicateOrWhere(astNode) {
            return this.parseRelationExprOrWhere(astNode);
        }
        parseRelationPredicateWhere(astNode) {
            return this.parseRelationExprWhere(astNode);
        }
        parseRelationPredicateWith(astNode) {
            return this.parseRelationExprWith(astNode);
        }
        parseRelationExpression(astNode) {
            return this.parseRelationExpr(astNode);
        }
    };
}
