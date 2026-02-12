import type { PredicateSelector, WhereOperator } from '@likec4/core/types'
import {
  FqnExpr,
  FqnRef,
  isAndOperator,
  isKindEqual,
  isNotOperator,
  isOrOperator,
  isParticipantOperator,
  isTagEqual,
  ModelFqnExpr,
  ModelRelationExpr,
  RelationExpr,
} from '@likec4/core/types'
import type { Expression, ModelExpression } from '@likec4/core/types'
import { isString } from 'remeda'
import { printDeploymentRef, printModelRef, quoteString } from './utils'

function printSelector(selector: PredicateSelector | undefined): string {
  if (!selector) return ''
  switch (selector) {
    case 'children':
      return '.*'
    case 'expanded':
      return '._'
    case 'descendants':
      return '.**'
    default:
      return ''
  }
}

// ---- WhereOperator ----

export function printWhereOperator(op: WhereOperator): string {
  switch (true) {
    case isTagEqual(op): {
      const tag = isString(op.tag) ? op.tag : ('eq' in op.tag ? op.tag.eq : op.tag.neq)
      const isNeg = !isString(op.tag) && 'neq' in op.tag
      return isNeg ? `tag is not #${tag}` : `tag is #${tag}`
    }
    case isKindEqual(op): {
      const kind = isString(op.kind) ? op.kind : ('eq' in op.kind ? op.kind.eq : op.kind.neq)
      const isNeg = !isString(op.kind) && 'neq' in op.kind
      return isNeg ? `kind is not ${kind}` : `kind is ${kind}`
    }
    case isParticipantOperator(op):
      return `${op.participant}.${printWhereOperator(op.operator)}`
    case isNotOperator(op):
      return `not (${printWhereOperator(op.not)})`
    case isAndOperator(op):
      return op.and.map((o: WhereOperator) => printWhereOperator(o)).join(' and ')
    case isOrOperator(op):
      return op.or.map((o: WhereOperator) => printWhereOperator(o)).join(' or ')
    default:
      return ''
  }
}

// ---- Model FQN Expression ----

function printModelFqnExprBase(expr: ModelFqnExpr.Any): string {
  if (ModelFqnExpr.isWildcard(expr)) return '*'
  if (ModelFqnExpr.isModelRef(expr)) {
    return printModelRef(expr.ref) + printSelector(expr.selector)
  }
  if (ModelFqnExpr.isElementKindExpr(expr)) {
    return expr.isEqual ? `element.kind == ${expr.elementKind}` : `element.kind != ${expr.elementKind}`
  }
  if (ModelFqnExpr.isElementTagExpr(expr)) {
    return expr.isEqual ? `element.tag == #${expr.elementTag}` : `element.tag != #${expr.elementTag}`
  }
  return ''
}

// ---- Model Relation Expression ----

function printModelRelationEndpoint(endpoint: ModelFqnExpr.Any): string {
  return printModelFqnExprBase(endpoint)
}

function printModelRelationBase(expr: ModelRelationExpr.Any): string {
  if (ModelRelationExpr.isDirect(expr)) {
    const src = printModelRelationEndpoint(expr.source)
    const tgt = printModelRelationEndpoint(expr.target)
    return expr.isBidirectional ? `${src} <-> ${tgt}` : `${src} -> ${tgt}`
  }
  if (ModelRelationExpr.isIncoming(expr)) {
    return `-> ${printModelRelationEndpoint(expr.incoming)}`
  }
  if (ModelRelationExpr.isOutgoing(expr)) {
    return `${printModelRelationEndpoint(expr.outgoing)} ->`
  }
  if (ModelRelationExpr.isInOut(expr)) {
    return `-> ${printModelRelationEndpoint(expr.inout)} ->`
  }
  return ''
}

// ---- Full Model Expression (with where/custom) ----

export function printModelExpression(expr: ModelExpression): string {
  // Custom relation (with)
  if (ModelRelationExpr.isCustom(expr)) {
    const inner = printModelExpressionInner(expr.customRelation.expr as ModelExpression)
    const props = printCustomRelationProps(expr.customRelation)
    return props ? `${inner} with {\n${props}}` : inner
  }
  // Custom fqn (with)
  if (ModelFqnExpr.isCustom(expr)) {
    const inner = printModelExpressionInner(expr.custom.expr as ModelExpression)
    const props = printCustomElementProps(expr.custom)
    return props ? `${inner} with {\n${props}}` : inner
  }
  return printModelExpressionInner(expr)
}

function printModelExpressionInner(expr: ModelExpression): string {
  // Where (on fqn or relation)
  if (ModelRelationExpr.isWhere(expr)) {
    const inner = printModelRelationBase(expr.where.expr)
    return `${inner} where ${printWhereOperator(expr.where.condition)}`
  }
  if (ModelFqnExpr.isWhere(expr)) {
    const inner = printModelFqnExprBase(expr.where.expr)
    return `${inner} where ${printWhereOperator(expr.where.condition)}`
  }
  // Base expressions
  if (ModelRelationExpr.is(expr)) return printModelRelationBase(expr)
  if (ModelFqnExpr.is(expr)) return printModelFqnExprBase(expr)
  return ''
}

// ---- Deployment Expressions ----

function printFqnExprBase(expr: FqnExpr.Any): string {
  if (FqnExpr.isWildcard(expr)) return '*'
  if (FqnExpr.isModelRef(expr)) {
    return printModelRef(expr.ref) + printSelector(expr.selector)
  }
  if (FqnExpr.isDeploymentRef(expr)) {
    return printDeploymentRef(expr.ref) + printSelector(expr.selector)
  }
  if (FqnExpr.isElementKindExpr(expr)) {
    return expr.isEqual ? `element.kind == ${expr.elementKind}` : `element.kind != ${expr.elementKind}`
  }
  if (FqnExpr.isElementTagExpr(expr)) {
    return expr.isEqual ? `element.tag == #${expr.elementTag}` : `element.tag != #${expr.elementTag}`
  }
  return ''
}

function printRelationEndpoint(endpoint: FqnExpr.Any): string {
  return printFqnExprBase(endpoint)
}

function printRelationBase(expr: RelationExpr.Any): string {
  if (RelationExpr.isDirect(expr)) {
    const src = printRelationEndpoint(expr.source)
    const tgt = printRelationEndpoint(expr.target)
    return expr.isBidirectional ? `${src} <-> ${tgt}` : `${src} -> ${tgt}`
  }
  if (RelationExpr.isIncoming(expr)) {
    return `-> ${printRelationEndpoint(expr.incoming)}`
  }
  if (RelationExpr.isOutgoing(expr)) {
    return `${printRelationEndpoint(expr.outgoing)} ->`
  }
  if (RelationExpr.isInOut(expr)) {
    return `-> ${printRelationEndpoint(expr.inout)} ->`
  }
  return ''
}

export function printExpression(expr: Expression): string {
  // Custom relation (with)
  if (RelationExpr.isCustom(expr)) {
    const inner = printExpressionInner(expr.customRelation.expr as Expression)
    const props = printCustomRelationProps(expr.customRelation)
    return props ? `${inner} with {\n${props}}` : inner
  }
  // Custom fqn (with)
  if (FqnExpr.isCustom(expr)) {
    const inner = printExpressionInner(expr.custom.expr as Expression)
    const props = printCustomElementProps(expr.custom)
    return props ? `${inner} with {\n${props}}` : inner
  }
  return printExpressionInner(expr)
}

function printExpressionInner(expr: Expression): string {
  if (RelationExpr.isWhere(expr)) {
    const inner = printRelationBase(expr.where.expr)
    return `${inner} where ${printWhereOperator(expr.where.condition)}`
  }
  if (FqnExpr.isWhere(expr)) {
    const inner = printFqnExprBase(expr.where.expr)
    return `${inner} where ${printWhereOperator(expr.where.condition)}`
  }
  if (RelationExpr.is(expr)) return printRelationBase(expr)
  if (FqnExpr.is(expr)) return printFqnExprBase(expr)
  return ''
}

// ---- Model FQN-only Expression (for style targets) ----

export function printModelFqnExpr(expr: ModelFqnExpr.Any): string {
  if (ModelFqnExpr.isCustom(expr)) {
    const inner = printModelFqnExprInner(expr.custom.expr as ModelFqnExpr.Any)
    const props = printCustomElementProps(expr.custom)
    return props ? `${inner} with {\n${props}}` : inner
  }
  return printModelFqnExprInner(expr)
}

function printModelFqnExprInner(expr: ModelFqnExpr.Any): string {
  if (ModelFqnExpr.isWhere(expr)) {
    const inner = printModelFqnExprBase(expr.where.expr)
    return `${inner} where ${printWhereOperator(expr.where.condition)}`
  }
  if (ModelFqnExpr.is(expr)) return printModelFqnExprBase(expr)
  return ''
}

// FqnExpr.Any (for deployment view style targets)
export function printFqnExprAny(expr: FqnExpr.Any): string {
  if (FqnExpr.isCustom(expr)) {
    const inner = printFqnExprAnyInner(expr.custom.expr as FqnExpr.Any)
    const props = printCustomElementProps(expr.custom)
    return props ? `${inner} with {\n${props}}` : inner
  }
  return printFqnExprAnyInner(expr)
}

function printFqnExprAnyInner(expr: FqnExpr.Any): string {
  if (FqnExpr.isWhere(expr)) {
    const inner = printFqnExprBase(expr.where.expr)
    return `${inner} where ${printWhereOperator(expr.where.condition)}`
  }
  if (FqnExpr.is(expr)) return printFqnExprBase(expr)
  return ''
}

// ---- Custom Property Printers ----

function printCustomElementProps(custom: any): string {
  const lines: string[] = []
  if (custom.title) lines.push(`  title ${quoteString(custom.title)}`)
  if (custom.color) lines.push(`  color ${custom.color}`)
  if (custom.shape) lines.push(`  shape ${custom.shape}`)
  if (custom.icon) lines.push(`  icon ${custom.icon}`)
  if (custom.iconColor) lines.push(`  iconColor ${custom.iconColor}`)
  if (custom.iconSize) lines.push(`  iconSize ${custom.iconSize}`)
  if (custom.iconPosition) lines.push(`  iconPosition ${custom.iconPosition}`)
  if (custom.border) lines.push(`  border ${custom.border}`)
  if (custom.opacity != null) lines.push(`  opacity ${custom.opacity}%`)
  if (custom.navigateTo) lines.push(`  navigateTo ${custom.navigateTo}`)
  if (custom.multiple) lines.push(`  multiple`)
  if (custom.size) lines.push(`  size ${custom.size}`)
  if (custom.padding) lines.push(`  padding ${custom.padding}`)
  if (custom.textSize) lines.push(`  textSize ${custom.textSize}`)
  return lines.length > 0 ? lines.join('\n') + '\n' : ''
}

function printCustomRelationProps(custom: any): string {
  const lines: string[] = []
  if (custom.title) lines.push(`  title ${quoteString(custom.title)}`)
  if (custom.color) lines.push(`  color ${custom.color}`)
  if (custom.line) lines.push(`  line ${custom.line}`)
  if (custom.head) lines.push(`  head ${custom.head}`)
  if (custom.tail) lines.push(`  tail ${custom.tail}`)
  if (custom.navigateTo) lines.push(`  navigateTo ${custom.navigateTo}`)
  return lines.length > 0 ? lines.join('\n') + '\n' : ''
}
