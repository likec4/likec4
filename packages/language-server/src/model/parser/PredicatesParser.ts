import type * as c4 from '@likec4/core'
import { invariant, nonexhaustive } from '@likec4/core'
import { isBoolean, isDefined, isTruthy } from 'remeda'
import { ast, parseAstOpacityProperty, parseAstSizeValue, toColor } from '../../ast'
import { logWarnError } from '../../logger'
import { elementRef } from '../../utils/elementRef'
import { parseWhereClause } from '../model-parser-where'
import { type Base, removeIndent } from './Base'
import type { WithExpressionV2 } from './FqnRefParser'

export type WithPredicates = ReturnType<typeof PredicatesParser>

export function PredicatesParser<TBase extends WithExpressionV2>(B: TBase) {
  return class PredicatesParser extends B {
    parsePredicate(astNode: ast.ExpressionV2): c4.ModelLayer.Expression {
      return this.parseExpressionV2(astNode) as c4.ModelLayer.Expression
    }

    parseElementPredicate(astNode: ast.FqnExprOrWith): c4.ModelLayer.AnyFqnExpr {
      if (ast.isFqnExprWith(astNode)) {
        return this.parseFqnExprWith(astNode) as c4.ModelLayer.AnyFqnExpr
      }
      if (ast.isFqnExprOrWhere(astNode)) {
        return this.parseFqnExprOrWhere(astNode) as c4.ModelLayer.AnyFqnExpr
      }
      nonexhaustive(astNode)
    }

    parseElementPredicateOrWhere(astNode: ast.FqnExprOrWhere): c4.ModelLayer.FqnExprOrWhere {
      return this.parseFqnExprOrWhere(astNode) as c4.ModelLayer.AnyFqnExpr
    }

    parseElementExpression(astNode: ast.FqnExpr): c4.ModelLayer.FqnExpr {
      return this.parseFqnExpr(astNode) as c4.ModelLayer.FqnExpr
    }

    parseElementPredicateWhere(astNode: ast.FqnExprWhere): c4.ModelLayer.FqnExpr.Where {
      return this.parseFqnExprWhere(astNode) as c4.ModelLayer.FqnExpr.Where
    }

    parseElementPredicateWith(astNode: ast.FqnExprWith): c4.ModelLayer.FqnExpr.Custom {
      return this.parseFqnExprWith(astNode) as c4.ModelLayer.FqnExpr.Custom
    }

    parseRelationPredicate(astNode: ast.RelationExprOrWith): c4.ModelLayer.AnyRelationExpr {
      return this.parseRelationExprOrWith(astNode) as c4.ModelLayer.AnyRelationExpr
    }

    parseRelationPredicateOrWhere(astNode: ast.RelationExprOrWhere): c4.ModelLayer.RelationExprOrWhere {
      return this.parseRelationExprOrWhere(astNode) as c4.ModelLayer.RelationExprOrWhere
    }

    parseRelationPredicateWhere(astNode: ast.RelationExprWhere): c4.ModelLayer.RelationExpr.Where {
      return this.parseRelationExprWhere(astNode) as c4.ModelLayer.RelationExpr.Where
    }

    parseRelationPredicateWith(astNode: ast.RelationExprWith): c4.ModelLayer.RelationExpr.Custom {
      return this.parseRelationExprWith(astNode) as c4.ModelLayer.RelationExpr.Custom
    }

    parseRelationExpression(astNode: ast.RelationExpr): c4.ModelLayer.RelationExpr {
      return this.parseRelationExpr(astNode) as c4.ModelLayer.RelationExpr
    }
  }
}
