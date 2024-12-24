import type * as c4 from '@likec4/core'
import { nonexhaustive, nonNullable } from '@likec4/core'
import { isNonNullish } from 'remeda'
import { ast } from '../../ast'
import { logWarnError } from '../../logger'
import { instanceRef } from '../../utils/fqnRef'
import type { Base } from './Base'
import { parseWhereClause } from '../model-parser-where'

export type WithExpressionV2 = ReturnType<typeof ExpressionV2Parser>

export function ExpressionV2Parser<TBase extends Base>(B: TBase) {
  return class ExpressionV2Parser extends B {
    parseFqnRef(astNode: ast.FqnRef): c4.FqnRef {
      const refValue = nonNullable(
        astNode.value.ref,
        `FqnRef is empty ${astNode.$cstNode?.range.start.line}:${astNode.$cstNode?.range.start.character}`,
      )
      if (ast.isElement(refValue)) {
        const deployedInstanceAst = instanceRef(astNode)
        if (!deployedInstanceAst) {
          return {
            model: this.resolveFqn(refValue),
          }
        }
        const deployment = this.resolveFqn(deployedInstanceAst)
        const element = this.resolveFqn(refValue)
        return {
          deployment,
          element,
        }
      }

      if (ast.isDeploymentElement(refValue)) {
        return {
          deployment: this.resolveFqn(refValue),
        }
      }
      nonexhaustive(refValue)
    }

    parseFqnExpr(astNode: ast.FqnExpr): c4.FqnExpr {
      if (ast.isWildcardExpression(astNode)) {
        return {
          wildcard: true,
        }
      }
      if (ast.isFqnRefExpr(astNode)) {
        return this.parseFqnRefExpr(astNode)
      }
      nonexhaustive(astNode)
    }

    parseFqnRefExpr(astNode: ast.FqnRefExpr): c4.FqnExpr.NonWildcard {
      const ref = this.parseFqnRef(astNode.ref)
      switch (true) {
        case astNode.selector === '._':
          return {
            ref,
            selector: 'expanded',
          } as c4.FqnExpr.NonWildcard
        case astNode.selector === '.**':
          return {
            ref,
            selector: 'descendants',
          } as c4.FqnExpr.NonWildcard
        case astNode.selector === '.*':
          return {
            ref,
            selector: 'children',
          } as c4.FqnExpr.NonWildcard
        default:
          return { ref } as c4.FqnExpr.NonWildcard
      }
    }

    parseFqnExpressions(astNode: ast.FqnExpressions): c4.FqnExpr[] {
      const exprs = [] as c4.FqnExpr[]
      let iter: ast.FqnExpressions['prev'] = astNode
      while (iter) {
        try {
          if (isNonNullish(iter.value) && this.isValid(iter.value)) {
            exprs.push(this.parseFqnExpr(iter.value))
          }
        } catch (e) {
          logWarnError(e)
        }
        iter = iter.prev
      }
      return exprs.reverse()
    }

    parseRelationExpr(astNode: ast.RelationPredicateOrWhereV2): c4.RelationExpr {
      if (ast.isRelationPredicateWhere(astNode)) {
        return {
          where: {
            expr: this.parseRelationExpr(astNode.subject as ast.RelationExpr),
            condition: astNode.where ? parseWhereClause(astNode.where) : {
              kind: { neq: '--always-true--' }
            }
          }
        }
      }
      if (ast.isDirectedRelationExpr(astNode)) {
        return {
          source: this.parseFqnExpr(astNode.source.from),
          target: this.parseFqnExpr(astNode.target),
          isBidirectional: astNode.source.isBidirectional,
        }
      }
      if (ast.isInOutRelationExpr(astNode)) {
        return {
          inout: this.parseFqnExpr(astNode.inout.to),
        }
      }
      if (ast.isOutgoingRelationExpr(astNode)) {
        return {
          outgoing: this.parseFqnExpr(astNode.from),
        }
      }
      if (ast.isIncomingRelationExpr(astNode)) {
        return {
          incoming: this.parseFqnExpr(astNode.to),
        }
      }
      nonexhaustive(astNode)
    }
  }
}
