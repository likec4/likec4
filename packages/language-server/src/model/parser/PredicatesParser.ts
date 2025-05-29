import type * as c4 from '@likec4/core'
import { nonexhaustive } from '@likec4/core'
import { ast } from '../../ast'
import type { WithExpressionV2 } from './FqnRefParser'

export type WithPredicates = ReturnType<typeof PredicatesParser>

export function PredicatesParser<TBase extends WithExpressionV2>(B: TBase) {
  return class PredicatesParser extends B {
    parsePredicate(astNode: ast.ExpressionV2): c4.ModelExpression {
      return this.parseExpressionV2(astNode) as c4.ModelExpression
    }

    parseElementPredicate(astNode: ast.FqnExprOrWith): c4.ModelFqnExpr.Any {
      if (ast.isFqnExprWith(astNode)) {
        return this.parseFqnExprWith(astNode) as c4.ModelFqnExpr.Any
      }
      if (ast.isFqnExprOrWhere(astNode)) {
        return this.parseFqnExprOrWhere(astNode) as c4.ModelFqnExpr.Any
      }
      nonexhaustive(astNode)
    }

    parseElementPredicateOrWhere(astNode: ast.FqnExprOrWhere): c4.ModelFqnExpr.OrWhere {
      return this.parseFqnExprOrWhere(astNode) as c4.ModelFqnExpr.Any
    }

    parseElementExpression(astNode: ast.FqnExpr): c4.ModelFqnExpr {
      return this.parseFqnExpr(astNode) as c4.ModelFqnExpr
    }

    parseElementPredicateWhere(astNode: ast.FqnExprWhere): c4.ModelFqnExpr.Where {
      return this.parseFqnExprWhere(astNode) as c4.ModelFqnExpr.Where
    }

    parseElementPredicateWith(astNode: ast.FqnExprWith): c4.ModelFqnExpr.Custom {
      return this.parseFqnExprWith(astNode) as c4.ModelFqnExpr.Custom
    }

    parseRelationPredicate(astNode: ast.RelationExprOrWith): c4.ModelRelationExpr.Any {
      return this.parseRelationExprOrWith(astNode) as c4.ModelRelationExpr.Any
    }

    parseRelationPredicateOrWhere(astNode: ast.RelationExprOrWhere): c4.ModelRelationExpr.OrWhere {
      return this.parseRelationExprOrWhere(astNode) as c4.ModelRelationExpr.OrWhere
    }

    parseRelationPredicateWhere(astNode: ast.RelationExprWhere): c4.ModelRelationExpr.Where {
      return this.parseRelationExprWhere(astNode) as c4.ModelRelationExpr.Where
    }

    parseRelationPredicateWith(astNode: ast.RelationExprWith): c4.ModelRelationExpr.Custom {
      return this.parseRelationExprWith(astNode) as c4.ModelRelationExpr.Custom
    }

    parseRelationExpression(astNode: ast.RelationExpr): c4.ModelRelationExpr {
      return this.parseRelationExpr(astNode) as c4.ModelRelationExpr
    }
  }
}
