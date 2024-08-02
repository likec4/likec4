import type { ComputedNode } from '@likec4/core'
import { Expr, nonexhaustive, parentFqn } from '@likec4/core'
import { whereOperatorAsPredicate } from '@likec4/core/types'
import { isNullish } from 'remeda'

type Predicate<T> = (x: T) => boolean

export function elementExprToPredicate(target: Expr.ElementPredicateExpression): Predicate<ComputedNode> {
  if (Expr.isElementWhere(target)) {
    const predicate = elementExprToPredicate(target.where.expr)
    const where = whereOperatorAsPredicate(target.where.condition)
    return n => predicate(n) && where(n)
  }
  if (Expr.isWildcard(target)) {
    return () => true
  }
  if (Expr.isElementKindExpr(target)) {
    return target.isEqual ? n => n.kind === target.elementKind : n => n.kind !== target.elementKind
  }
  if (Expr.isElementTagExpr(target)) {
    return target.isEqual
      ? ({ tags }) => !!tags && tags.includes(target.elementTag)
      : ({ tags }) => isNullish(tags) || !tags.includes(target.elementTag)
  }
  if (Expr.isExpandedElementExpr(target)) {
    return n => n.id === target.expanded || parentFqn(n.id) === target.expanded
  }
  if (Expr.isElementRef(target)) {
    const { element, isDescedants } = target
    return isDescedants
      ? n => n.id.startsWith(element + '.')
      : n => (n.id as string) === element
  }
  if (Expr.isCustomElement(target)) {
    return n => (n.id as string) === target.custom.element
  }
  nonexhaustive(target)
}
