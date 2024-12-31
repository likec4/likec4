import { anyPass } from 'remeda'
import { nonexhaustive } from '../../../errors'
import type { LikeC4Model } from '../../../model'
import * as Expr from '../../../types/expression'
import { isDescendantOf } from '../../../utils/fqn'
import { ifilter, toArray } from '../../../utils/iterable'
import type { Elem, Memory, PredicateCtx } from '../_types'

/**
 * Resolve elements from the model based on the given expression
 */

export function resolveElements(model: LikeC4Model, expr: Exclude<Expr.ElementExpression, Expr.WildcardExpr>): Elem[] {
  switch (true) {
    case Expr.isExpandedElementExpr(expr): {
      const element = model.element(expr.expanded)
      return [
        element,
        ...element.children(),
      ]
    }
    case Expr.isElementRef(expr): {
      const element = model.element(expr.element)
      let children
      if (expr.isChildren) {
        children = toArray(element.children())
      } else if (expr.isDescendants) {
        children = toArray(element.descendants())
      }
      return children && children.length > 0 ? children : [element]
    }
    case Expr.isElementKindExpr(expr):
      return [...ifilter(model.elements(), el => {
        return expr.isEqual === (el.kind === expr.elementKind)
      })]
    case Expr.isElementTagExpr(expr):
      return [...ifilter(model.elements(), el => {
        return expr.isEqual === el.tags.includes(expr.elementTag)
      })]
    default:
      nonexhaustive(expr)
  }
}

/**
 * Include elements that are not in the given set but are descendants of the current set
 * Consider the following example:
 *    a1.* -> b1
 * If there are a1.a2.a3 and b1.b2 in the memory, but not connected yet - we connect them
 */
export function includeDescendantsFromMemory(elements: Elem[], memory: Memory): Elem[] {
  if (memory.isEmpty() || elements.length === 0) {
    return elements
  }
  const descedantsOf = anyPass(elements.map(e => isDescendantOf(e)))
  const fromMemory = toArray(
    ifilter(
      memory.elements,
      el => !elements.includes(el) && descedantsOf(el),
    ),
  )
  return [
    ...elements,
    ...fromMemory,
  ]
}

/**
 * Combination of `resolveElements` and `includeDescendantsFromMemory`
 */
export function resolveAndIncludeFromMemory(
  nonWildcard: Expr.NonWilcard,
  { memory, model }: Pick<PredicateCtx, 'model' | 'memory'>,
): Elem[] {
  const resolved = resolveElements(model, nonWildcard)
  // We include from memory only if the expression is:
  // - expanded element
  // - element reference with or with children (but not descendants - they are already included)
  if (Expr.isExpandedElementExpr(nonWildcard) || Expr.isElementRef(nonWildcard)) {
    if (nonWildcard.isDescendants === true) {
      return resolved
    }
    return includeDescendantsFromMemory(resolved, memory)
  }
  return resolved
}
