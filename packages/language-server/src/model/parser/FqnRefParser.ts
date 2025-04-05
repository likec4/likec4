import type * as c4 from '@likec4/core'
import { type ProjectId, invariant, nonexhaustive, nonNullable } from '@likec4/core'
import { isNonNullish } from 'remeda'
import { ast } from '../../ast'
import { logWarnError } from '../../logger'
import { importsRef, instanceRef } from '../../utils/fqnRef'
import { parseWhereClause } from '../model-parser-where'
import type { Base } from './Base'

export type WithExpressionV2 = ReturnType<typeof ExpressionV2Parser>

export function ExpressionV2Parser<TBase extends Base>(B: TBase) {
  return class ExpressionV2Parser extends B {
    parseFqnRef(astNode: ast.FqnRef): c4.FqnRef {
      const refValue = nonNullable(
        astNode.value.ref,
        `FqnRef is empty ${astNode.$cstNode?.range.start.line}:${astNode.$cstNode?.range.start.character}`,
      )
      if (ast.isImported(refValue)) {
        const fqnRef = {
          project: refValue.$container.project as ProjectId,
          model: this.resolveFqn(
            nonNullable(refValue.element.ref, `FqnRef is empty of imported: ${refValue.$cstNode?.text}`),
          ),
        }
        this.doc.c4Imports.add(fqnRef.project, fqnRef.model)
        return fqnRef
      }
      if (ast.isElement(refValue)) {
        const imported = importsRef(astNode)
        if (imported) {
          const fqnRef = {
            project: imported.$container.project as c4.ProjectId,
            model: this.resolveFqn(refValue),
          }
          this.doc.c4Imports.add(fqnRef.project, fqnRef.model)
          return fqnRef
        }
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

    parseExpressionV2(astNode: ast.ExpressionV2): c4.ExpressionV2 {
      if (ast.isFqnExprOrWhere(astNode)) {
        return this.parseFqnExprOrWhere(astNode)
      }
      if (ast.isRelationExprOrWhere(astNode)) {
        return this.parseRelationExprOrWhere(astNode)
      }
      nonexhaustive(astNode)
    }

    parseFqnExprOrWhere(astNode: ast.FqnExprOrWhere): c4.FqnExprOrWhere {
      if (ast.isFqnExprWhere(astNode)) {
        return this.parseFqnExprWhere(astNode)
      }
      if (ast.isFqnExpr(astNode)) {
        return this.parseFqnExpr(astNode)
      }
      nonexhaustive(astNode)
    }

    parseFqnExprWhere(astNode: ast.FqnExprWhere): c4.FqnExpr.Where {
      invariant(!ast.isFqnExprWhere(astNode.subject), 'FqnExprWhere is not allowed as subject of FqnExprWhere')
      return {
        where: {
          expr: this.parseFqnExpr(astNode.subject),
          condition: astNode.where ? parseWhereClause(astNode.where) : {
            kind: { neq: '--always-true--' },
          },
        },
      }
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

    parseRelationExprOrWhere(astNode: ast.RelationExprOrWhere): c4.RelationExprOrWhere {
      if (ast.isRelationExprWhere(astNode)) {
        return this.parseRelationExprWhere(astNode)
      }
      if (ast.isRelationExpr(astNode)) {
        return this.parseRelationExpr(astNode)
      }
      nonexhaustive(astNode)
    }

    parseRelationExprWhere(astNode: ast.RelationExprWhere): c4.RelationExpr.Where {
      invariant(
        !ast.isRelationExprWhere(astNode.subject),
        'RelationExprWhere is not allowed as subject of RelationExprWhere',
      )
      return {
        where: {
          expr: this.parseRelationExpr(astNode.subject),
          condition: astNode.where ? parseWhereClause(astNode.where) : {
            kind: { neq: '--always-true--' },
          },
        },
      }
    }

    parseRelationExpr(astNode: ast.RelationExpr): c4.RelationExpr {
      switch (astNode.$type) {
        case 'DirectedRelationExpr':
          return {
            source: this.parseFqnExpr(astNode.source.from),
            target: this.parseFqnExpr(astNode.target),
            isBidirectional: astNode.source.isBidirectional,
          }
        case 'InOutRelationExpr':
          return {
            inout: this.parseFqnExpr(astNode.inout.to),
          }
        case 'OutgoingRelationExpr':
          return {
            outgoing: this.parseFqnExpr(astNode.from),
          }
        case 'IncomingRelationExpr':
          return {
            incoming: this.parseFqnExpr(astNode.to),
          }
        default:
          nonexhaustive(astNode)
      }
    }
  }
}
