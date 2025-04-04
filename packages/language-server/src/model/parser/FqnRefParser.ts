import type * as c4 from '@likec4/core'
import { type ProjectId, nonexhaustive, nonNullable } from '@likec4/core'
import { isNonNullish } from 'remeda'
import { ast } from '../../ast'
import { logWarnError } from '../../logger'
import { importsRef, instanceRef } from '../../utils/fqnRef'
import { parseWhereClause } from '../model-parser-where'
import type { Base } from './Base'

export type WithExpressionV2 = ReturnType<typeof ExpressionV2Parser>

export function ExpressionV2Parser<TBase extends Base>(B: TBase) {
  return class ExpressionV2Parser extends B {
    _parseImportFqnRef(node: ast.Imported): c4.FqnRef.ImportRef {
      return {
        project: node.$container.project as ProjectId,
        model: this.resolveFqn(
          nonNullable(node.element.ref, `FqnRef is empty of imported: ${node.$cstNode?.text}`),
        ),
      }
    }

    parseFqnRef(astNode: ast.FqnRef): c4.FqnRef {
      const refValue = nonNullable(
        astNode.value.ref,
        `FqnRef is empty ${astNode.$cstNode?.range.start.line}:${astNode.$cstNode?.range.start.character}`,
      )
      if (ast.isImported(refValue)) {
        return this._parseImportFqnRef(refValue)
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

    parseElementWhereExpr(astNode: ast.ElementPredicateWhereV2): c4.RelationExpr {
      return {
        where: {
          expr: this.parseFqnExpr(astNode.subject as ast.FqnExpr),
          condition: astNode.where ? parseWhereClause(astNode.where) : {
            kind: { neq: '--always-true--' },
          },
        },
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

    parseRelationWhereExpr(astNode: ast.RelationPredicateWhereV2): c4.RelationExpr {
      return {
        where: {
          expr: this.parseRelationExpr(astNode.subject as ast.RelationExpr),
          condition: astNode.where ? parseWhereClause(astNode.where) : {
            kind: { neq: '--always-true--' },
          },
        },
      }
    }

    parseRelationExpr(astNode: ast.RelationExpr): c4.RelationExpr {
      if (ast.isRelationPredicateWhere(astNode)) {
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
