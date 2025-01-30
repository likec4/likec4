import type * as c4 from '@likec4/core'
import { invariant, nonexhaustive } from '@likec4/core'
import { isBoolean, isDefined, isTruthy } from 'remeda'
import { ast, parseAstOpacityProperty, toColor } from '../../ast'
import { logWarnError } from '../../logger'
import { elementRef } from '../../utils/elementRef'
import { parseWhereClause } from '../model-parser-where'
import { type Base, removeIndent } from './Base'

export type WithPredicates = ReturnType<typeof PredicatesParser>

export function PredicatesParser<TBase extends Base>(B: TBase) {
  return class PredicatesParser extends B {
    parsePredicate(astNode: ast.Predicate): c4.Expression {
      if (ast.isElementPredicate(astNode)) {
        return this.parseElementPredicate(astNode)
      }
      if (ast.isRelationPredicate(astNode)) {
        return this.parseRelationPredicate(astNode)
      }
      nonexhaustive(astNode)
    }

    parseElementPredicate(astNode: ast.ElementPredicate): c4.ElementPredicateExpression {
      if (ast.isElementPredicateWith(astNode)) {
        return this.parseElementPredicateWith(astNode)
      }
      if (ast.isElementPredicateWhere(astNode)) {
        return this.parseElementPredicateWhere(astNode)
      }
      if (ast.isElementExpression(astNode)) {
        return this.parseElementExpression(astNode)
      }
      nonexhaustive(astNode)
    }

    parseElementExpressionsIterator(astNode: ast.ElementExpressionsIterator): c4.ElementExpression[] {
      const exprs = [] as c4.ElementExpression[]
      let iter: ast.ElementExpressionsIterator['prev'] = astNode
      while (iter) {
        try {
          if (iter.value) {
            exprs.unshift(this.parseElementExpression(iter.value))
          }
        } catch (e) {
          logWarnError(e)
        }
        iter = iter.prev
      }
      return exprs
    }

    parseElementExpression(astNode: ast.ElementExpression): c4.ElementExpression {
      if (ast.isWildcardExpression(astNode)) {
        return {
          wildcard: true,
        }
      }
      if (ast.isElementKindExpression(astNode)) {
        invariant(astNode.kind?.ref, 'ElementKindExpr kind is not resolved: ' + astNode.$cstNode?.text)
        return {
          elementKind: astNode.kind.ref.name as c4.ElementKind,
          isEqual: astNode.isEqual,
        }
      }
      if (ast.isElementTagExpression(astNode)) {
        invariant(astNode.tag?.ref, 'ElementTagExpr tag is not resolved: ' + astNode.$cstNode?.text)
        let elementTag = astNode.tag.$refText
        if (elementTag.startsWith('#')) {
          elementTag = elementTag.slice(1)
        }
        return {
          elementTag: elementTag as c4.Tag,
          isEqual: astNode.isEqual,
        }
      }
      if (ast.isExpandElementExpression(astNode)) {
        const elementNode = elementRef(astNode.expand)
        invariant(elementNode, 'Element not found ' + astNode.expand.$cstNode?.text)
        const expanded = this.resolveFqn(elementNode)
        return {
          expanded,
        }
      }
      if (ast.isElementDescedantsExpression(astNode)) {
        const elementNode = elementRef(astNode.parent)
        invariant(elementNode, 'Element not found ' + astNode.parent.$cstNode?.text)
        const element = this.resolveFqn(elementNode)
        return {
          element,
          isChildren: astNode.suffix === '.*',
          isDescendants: astNode.suffix === '.**',
        }
      }
      if (ast.isElementRef(astNode)) {
        const elementNode = elementRef(astNode)
        invariant(elementNode, 'Element not found ' + astNode.$cstNode?.text)
        const element = this.resolveFqn(elementNode)
        return {
          element,
        }
      }
      nonexhaustive(astNode)
    }

    parseElementPredicateWhere(astNode: ast.ElementPredicateWhere): c4.ElementWhereExpr {
      const expr = this.parseElementExpression(astNode.subject)
      return {
        where: {
          expr,
          condition: astNode.where ? parseWhereClause(astNode.where) : {
            kind: { neq: '--always-true--' },
          },
        },
      }
    }

    parseElementPredicateWith(astNode: ast.ElementPredicateWith): c4.CustomElementExpr {
      const expr = this.parseElementPredicate(astNode.subject)
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
          if (ast.isElementStringProperty(prop)) {
            if (isDefined(prop.value)) {
              acc.custom[prop.key] = removeIndent(prop.value) || ''
            }
            return acc
          }
          if (ast.isIconProperty(prop)) {
            const value = prop.libicon?.ref?.name ?? prop.value
            if (isDefined(value)) {
              acc.custom[prop.key] = value as c4.IconUrl
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
          if (ast.isNotationProperty(prop)) {
            if (isTruthy(prop.value)) {
              acc.custom[prop.key] = removeIndent(prop.value)
            }
            return acc
          }
          if (ast.isMultipleProperty(prop)) {
            if (isBoolean(prop.value)) {
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
        } as c4.CustomElementExpr,
      )
    }

    parseRelationPredicate(astNode: ast.RelationPredicate): c4.RelationPredicateExpression {
      if (ast.isRelationPredicateWith(astNode)) {
        let relation = ast.isRelationPredicateWhere(astNode.subject)
          ? this.parseRelationPredicateWhere(astNode.subject)
          : this.parseRelationExpression(astNode.subject)

        return this.parseRelationPredicateWith(astNode, relation)
      }
      if (ast.isRelationPredicateWhere(astNode)) {
        return this.parseRelationPredicateWhere(astNode)
      }
      if (ast.isRelationExpression(astNode)) {
        return this.parseRelationExpression(astNode)
      }
      nonexhaustive(astNode)
    }

    parseRelationPredicateWhere(astNode: ast.RelationPredicateWhere): c4.RelationWhereExpr {
      const expr = this.parseRelationExpression(astNode.subject)
      return {
        where: {
          expr,
          condition: astNode.where ? parseWhereClause(astNode.where) : {
            kind: { neq: '--always-true--' },
          },
        },
      }
    }

    parseRelationPredicateWith(
      astNode: ast.RelationPredicateWith,
      relation: c4.RelationExpression | c4.RelationWhereExpr,
    ): c4.CustomRelationExpr {
      const props = astNode.custom?.props ?? []
      return props.reduce(
        (acc, prop) => {
          if (ast.isRelationStringProperty(prop) || ast.isNotationProperty(prop) || ast.isNotesProperty(prop)) {
            if (isDefined(prop.value)) {
              acc.customRelation[prop.key] = removeIndent(prop.value) ?? ''
            }
            return acc
          }
          if (ast.isArrowProperty(prop)) {
            if (isTruthy(prop.value)) {
              acc.customRelation[prop.key] = prop.value
            }
            return acc
          }
          if (ast.isColorProperty(prop)) {
            const value = toColor(prop)
            if (isTruthy(value)) {
              acc.customRelation[prop.key] = value
            }
            return acc
          }
          if (ast.isLineProperty(prop)) {
            if (isTruthy(prop.value)) {
              acc.customRelation[prop.key] = prop.value
            }
            return acc
          }
          if (ast.isRelationNavigateToProperty(prop)) {
            const viewId = prop.value.view.ref?.name
            if (isTruthy(viewId)) {
              acc.customRelation.navigateTo = viewId as c4.ViewId
            }
            return acc
          }
          nonexhaustive(prop)
        },
        {
          customRelation: {
            relation,
          },
        } as c4.CustomRelationExpr,
      )
    }

    parseRelationExpression(astNode: ast.RelationExpression): c4.RelationExpression {
      if (ast.isDirectedRelationExpression(astNode)) {
        return {
          source: this.parseElementExpression(astNode.source.from),
          target: this.parseElementExpression(astNode.target),
          isBidirectional: astNode.source.isBidirectional,
        }
      }
      if (ast.isInOutRelationExpression(astNode)) {
        return {
          inout: this.parseElementExpression(astNode.inout.to),
        }
      }
      if (ast.isOutgoingRelationExpression(astNode)) {
        return {
          outgoing: this.parseElementExpression(astNode.from),
        }
      }
      if (ast.isIncomingRelationExpression(astNode)) {
        return {
          incoming: this.parseElementExpression(astNode.to),
        }
      }
      nonexhaustive(astNode)
    }
  }
}
