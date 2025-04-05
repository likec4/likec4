import { isNullish } from 'remeda'
import { nonexhaustive } from '../../errors'
import {
  ModelLayer,
  whereOperatorAsPredicate,
} from '../../types'
import { parentFqn } from '../../utils'

type Predicate<T> = (x: T) => boolean

export function elementExprToPredicate<T extends { id: string; tags?: readonly string[] | null; kind: string }>(
  target: ModelLayer.AnyFqnExpr,
): Predicate<T> {
  if (ModelLayer.FqnExpr.isCustom(target)) {
    return elementExprToPredicate(target.custom.expr)
  }
  if (ModelLayer.FqnExpr.isWhere(target)) {
    const predicate = elementExprToPredicate(target.where.expr)
    const where = whereOperatorAsPredicate(target.where.condition)
    return n => predicate(n) && where(n)
  }
  if (ModelLayer.FqnExpr.isElementKindExpr(target)) {
    return target.isEqual ? n => n.kind === target.elementKind : n => n.kind !== target.elementKind
  }
  if (ModelLayer.FqnExpr.isElementTagExpr(target)) {
    return target.isEqual
      ? ({ tags }) => !!tags && tags.includes(target.elementTag)
      : ({ tags }) => isNullish(tags) || !tags.includes(target.elementTag)
  }
  if (ModelLayer.FqnExpr.isWildcard(target)) {
    return () => true
  }
  if (ModelLayer.FqnExpr.isModelRef(target)) {
    const fqn = ModelLayer.FqnRef.toFqn(target.ref)
    if (target.selector === 'expanded') {
      return (n) => {
        return n.id === fqn || parentFqn(n.id) === fqn
      }
    }
    if (target.selector === 'descendants' || target.selector === 'children') {
      const fqnWithDot = fqn + '.'
      return (n) => {
        return n.id.startsWith(fqnWithDot)
      }
    }
    return (n) => {
      return n.id === fqn
    }
  }
  nonexhaustive(target)
}
