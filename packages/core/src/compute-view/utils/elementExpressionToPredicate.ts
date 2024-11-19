import { isNullish } from 'remeda'
import { nonexhaustive } from '../../errors'
import {
  type Element,
  type ElementPredicateExpression,
  isCustomElement,
  isElementKindExpr,
  isElementRef,
  isElementTagExpr,
  isElementWhere,
  isExpandedElementExpr,
  isWildcard,
  whereOperatorAsPredicate
} from '../../types'
import { parentFqn } from '../../utils'

type Predicate<T> = (x: T) => boolean

export function elementExprToPredicate<T extends Pick<Element, 'id' | 'kind' | 'tags'>>(
  target: ElementPredicateExpression
): Predicate<T> {
  if (isElementWhere(target)) {
    const predicate = elementExprToPredicate(target.where.expr)
    const where = whereOperatorAsPredicate(target.where.condition)
    return n => predicate(n) && where(n)
  }
  if (isWildcard(target)) {
    return () => true
  }
  if (isElementKindExpr(target)) {
    return target.isEqual ? n => n.kind === target.elementKind : n => n.kind !== target.elementKind
  }
  if (isElementTagExpr(target)) {
    return target.isEqual
      ? ({ tags }) => !!tags && tags.includes(target.elementTag)
      : ({ tags }) => isNullish(tags) || !tags.includes(target.elementTag)
  }
  if (isExpandedElementExpr(target)) {
    return n => n.id === target.expanded || parentFqn(n.id) === target.expanded
  }
  if (isElementRef(target)) {
    const { element, isDescedants } = target
    return isDescedants
      ? n => n.id.startsWith(element + '.')
      : n => (n.id as string) === element
  }
  if (isCustomElement(target)) {
    return elementExprToPredicate(target.custom.expr)
  }
  nonexhaustive(target)
}
