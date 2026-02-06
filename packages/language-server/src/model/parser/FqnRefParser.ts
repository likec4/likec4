import type * as c4 from '@likec4/core'
import { invariant, nonexhaustive, nonNullable } from '@likec4/core'
import { isBoolean, isDefined, isNonNullish, isTruthy } from 'remeda'
import type { Except } from 'type-fest'
import { ast, parseAstOpacityProperty, parseAstSizeValue, parseMarkdownAsString, toColor } from '../../ast'
import { projectIdFrom } from '../../utils'
import { importsRef, instanceRef } from '../../utils/fqnRef'
import { createBinaryOperator, parseWhereClause } from '../model-parser-where'
import { type Base, removeIndent } from './Base'

export type WithExpressionV2 = ReturnType<typeof ExpressionV2Parser>

export function ExpressionV2Parser<TBase extends Base>(B: TBase) {
  return class ExpressionV2Parser extends B {
    parseFqnRef(astNode: ast.FqnRef): c4.FqnRef {
      const refValue = nonNullable(
        astNode.value?.ref,
        () => `Element "${astNode.$cstNode?.text}" is not resolved`,
      )
      if (ast.isImported(refValue)) {
        const fqnRef = {
          project: projectIdFrom(refValue),
          model: this.resolveFqn(
            nonNullable(refValue.imported.ref, `Imported "${refValue.$cstNode?.text}" is not resolved`),
          ),
        }
        this.doc.c4Imports.set(fqnRef.project, fqnRef.model)
        return fqnRef
      }
      if (ast.isElement(refValue)) {
        const imported = importsRef(astNode)
        if (imported) {
          const fqnRef = {
            project: projectIdFrom(imported),
            model: this.resolveFqn(refValue),
          }
          this.doc.c4Imports.set(fqnRef.project, fqnRef.model)
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

    parseExpressionV2(astNode: ast.ExpressionV2): c4.Expression {
      if (ast.isFqnExprOrWith(astNode)) {
        return this.parseFqnExprOrWith(astNode)
      }
      if (ast.isRelationExprOrWith(astNode)) {
        return this.parseRelationExprOrWith(astNode)
      }
      nonexhaustive(astNode)
    }

    parseFqnExprOrWith(astNode: ast.FqnExprOrWith): c4.FqnExpr.Any {
      if (ast.isFqnExprWith(astNode)) {
        return this.parseFqnExprWith(astNode)
      }
      if (ast.isFqnExprOrWhere(astNode)) {
        return this.parseFqnExprOrWhere(astNode)
      }
      nonexhaustive(astNode)
    }

    parseFqnExprWith(astNode: ast.FqnExprWith): c4.FqnExpr.Custom {
      const expr = this.parseFqnExprOrWhere(astNode.subject)
      const props = astNode.custom?.props ?? []
      return props.reduce(
        (acc, prop) => {
          if (!this.isValid(prop)) {
            return acc
          }
          if (ast.isNavigateToProperty(prop)) {
            const viewId = prop.value.view.$refText
            if (isTruthy(viewId)) {
              acc.custom.navigateTo = viewId as c4.ViewId
            }
            return acc
          }
          if (ast.isNotesProperty(prop)) {
            const value = this.parseMarkdownOrString(prop.value)
            if (value) {
              acc.custom[prop.key] = value
            }
            return acc
          }
          if (ast.isElementStringProperty(prop)) {
            if (prop.key === 'description' || prop.key === 'summary') {
              const parsed = this.parseMarkdownOrString(prop.value)
              if (parsed) {
                acc.custom['description'] = parsed
              }
              return acc
            }
            const parsed = removeIndent(parseMarkdownAsString(prop.value))
            if (parsed) {
              acc.custom[prop.key] = parsed
            }
            return acc
          }
          if (ast.isIconProperty(prop)) {
            const value = this.parseIconProperty(prop)
            if (isDefined(value)) {
              acc.custom[prop.key] = value
            }
            return acc
          }
          if (ast.isColorProperty(prop)) {
            const value = toColor(prop)
            if (isDefined(value)) {
              acc.custom[prop.key] = value
            }
            return acc
          }
          if (ast.isShapeProperty(prop)) {
            if (isDefined(prop.value)) {
              acc.custom[prop.key] = prop.value
            }
            return acc
          }
          if (ast.isBorderProperty(prop)) {
            if (isDefined(prop.value)) {
              acc.custom[prop.key] = prop.value
            }
            return acc
          }
          if (ast.isOpacityProperty(prop)) {
            if (isDefined(prop.value)) {
              acc.custom[prop.key] = parseAstOpacityProperty(prop)
            }
            return acc
          }
          if (ast.isIconColorProperty(prop)) {
            const color = toColor(prop)
            if (isDefined(color)) {
              acc.custom[prop.key] = color
            }
            return acc
          }
          if (ast.isNotationProperty(prop)) {
            const value = isTruthy(prop.value) ? removeIndent(parseMarkdownAsString(prop.value)) : undefined
            if (value) {
              acc.custom[prop.key] = value
            }
            return acc
          }
          if (ast.isMultipleProperty(prop)) {
            if (isBoolean(prop.value)) {
              acc.custom[prop.key] = prop.value
            }
            return acc
          }
          if (ast.isShapeSizeProperty(prop)) {
            if (isTruthy(prop.value)) {
              acc.custom[prop.key] = parseAstSizeValue(prop)
            }
            return acc
          }
          if (ast.isTextSizeProperty(prop)) {
            if (isTruthy(prop.value)) {
              acc.custom[prop.key] = parseAstSizeValue(prop)
            }
            return acc
          }
          if (ast.isPaddingSizeProperty(prop)) {
            if (isTruthy(prop.value)) {
              acc.custom[prop.key] = parseAstSizeValue(prop)
            }
            return acc
          }
          if (ast.isIconSizeProperty(prop)) {
            if (isTruthy(prop.value)) {
              acc.custom[prop.key] = parseAstSizeValue(prop)
            }
            return acc
          }
          if (ast.isIconPositionProperty(prop)) {
            if (isTruthy(prop.value)) {
              acc.custom[prop.key] = prop.value
            }
            return acc
          }
          nonexhaustive(prop)
        },
        {
          custom: {
            expr,
          },
        } as c4.FqnExpr.Custom,
      )
    }

    parseFqnExprOrWhere(astNode: ast.FqnExprOrWhere): c4.FqnExpr.OrWhere {
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
      if (ast.isElementKindExpression(astNode)) {
        invariant(astNode.kind?.ref, `ElementKind "${astNode.$cstNode?.text}" is not resolved`)
        return {
          elementKind: astNode.kind.ref.name as c4.ElementKind,
          isEqual: astNode.isEqual,
        }
      }
      if (ast.isElementTagExpression(astNode)) {
        invariant(astNode.tag.tag.ref, `Tag ${astNode.$cstNode?.text} is not resolved`)
        let elementTag = astNode.tag.tag.$refText
        return {
          elementTag: elementTag as c4.Tag,
          isEqual: astNode.isEqual,
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
          this.logError(e, iter.value, 'fqnref')
        }
        iter = iter.prev
      }
      return exprs.reverse()
    }

    parseRelationExprOrWith(astNode: ast.RelationExprOrWith): c4.RelationExpr.Any {
      if (ast.isRelationExprWith(astNode)) {
        return this.parseRelationExprWith(astNode)
      }
      if (ast.isRelationExprOrWhere(astNode)) {
        return this.parseRelationExprOrWhere(astNode)
      }
      nonexhaustive(astNode)
    }

    parseRelationExprWith(
      astNode: ast.RelationExprWith,
    ): c4.RelationExpr.Custom {
      const expr = this.parseRelationExprOrWhere(astNode.subject)
      const customProps = this.parseCustomRelationProperties(astNode.custom)
      return {
        customRelation: {
          ...customProps,
          expr,
        },
      }
    }

    parseCustomRelationProperties(
      custom: ast.CustomRelationProperties | undefined,
    ): Except<c4.RelationExpr.Custom['customRelation'], 'expr'> {
      const props = custom?.props ?? []
      return props.reduce(
        (acc, prop) => {
          if (ast.isNotesProperty(prop)) {
            const value = this.parseMarkdownOrString(prop.value)
            if (value) {
              acc[prop.key] = value
            }
            return acc
          }
          if (ast.isRelationStringProperty(prop) || ast.isNotationProperty(prop)) {
            if (prop.key === 'description') {
              const parsed = this.parseMarkdownOrString(prop.value)
              if (parsed) {
                acc['description'] = parsed
              }
              return acc
            }
            const value = removeIndent(parseMarkdownAsString(prop.value))
            if (value) {
              acc[prop.key] = value
            }
            return acc
          }
          if (ast.isArrowProperty(prop)) {
            if (isTruthy(prop.value)) {
              acc[prop.key] = prop.value
            }
            return acc
          }
          if (ast.isColorProperty(prop)) {
            const value = toColor(prop)
            if (isTruthy(value)) {
              acc[prop.key] = value
            }
            return acc
          }
          if (ast.isLineProperty(prop)) {
            if (isTruthy(prop.value)) {
              acc[prop.key] = prop.value
            }
            return acc
          }
          if (ast.isRelationNavigateToProperty(prop)) {
            const viewId = prop.value.view.ref?.name
            if (isTruthy(viewId)) {
              acc[prop.key] = viewId as c4.ViewId
            }
            return acc
          }
          nonexhaustive(prop)
        },
        {} as Except<c4.RelationExpr.Custom['customRelation'], 'expr'>,
      )
    }

    parseRelationExprOrWhere(astNode: ast.RelationExprOrWhere): c4.RelationExpr.OrWhere {
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
      const relationOrWhereExpr = this.parseRelationExpr(astNode.subject)
      const expr = relationOrWhereExpr.where?.expr ?? relationOrWhereExpr
      const kindCondition = relationOrWhereExpr.where?.condition
      const whereCondition = astNode.where ? parseWhereClause(astNode.where) : null

      let condition: c4.WhereOperator

      if (whereCondition && kindCondition) {
        condition = createBinaryOperator(
          'and',
          kindCondition,
          whereCondition,
        )
      } else {
        condition = whereCondition
          ?? kindCondition
          ?? { kind: { neq: '--always-true--' } }
      }

      return {
        where: {
          expr: expr,
          condition: condition,
        },
      }
    }

    parseRelationExpr(astNode: ast.RelationExpr): c4.RelationExpr.OrWhere {
      switch (astNode.$type) {
        case 'DirectedRelationExpr':
          return this.wrapInWhere({
            source: this.parseFqnExpr(astNode.source.from),
            target: this.parseFqnExpr(astNode.target),
            isBidirectional: astNode.source.isBidirectional,
          }, this.parseInlineKindCondition(astNode.source))
        case 'InOutRelationExpr':
          return {
            inout: this.parseFqnExpr(astNode.inout.to),
          }
        case 'OutgoingRelationExpr':
          return this.wrapInWhere(
            { outgoing: this.parseFqnExpr(astNode.from) },
            this.parseInlineKindCondition(astNode),
          )
        case 'IncomingRelationExpr':
          return {
            incoming: this.parseFqnExpr(astNode.to),
          }
        default:
          nonexhaustive(astNode)
      }
    }

    parseInlineKindCondition(astNode: ast.OutgoingRelationExpr): c4.WhereOperator | null {
      const kind = astNode.kind ?? astNode.dotKind?.kind
      if (!kind) {
        return null
      }
      if (!kind.ref) {
        this.logError(`RelationshipKind "${kind.$refText}" is not resolved`, astNode, 'fqnref')
        return null
      }
      return { kind: { eq: kind.ref?.name } }
    }

    wrapInWhere(expr: c4.RelationExpr, condition: c4.WhereOperator | null): c4.RelationExpr.OrWhere {
      return condition ? { where: { expr, condition } } : expr
    }
  }
}
