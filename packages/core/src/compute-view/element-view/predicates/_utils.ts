import { anyPass } from 'remeda'
import { nonexhaustive } from '../../../errors'
import type { LikeC4Model } from '../../../model/LikeC4Model'
import { ModelLayer } from '../../../types/expression-model'
import { isDescendantOf } from '../../../utils/fqn'
import { ifilter, toArray } from '../../../utils/iterable'
import type { Elem, Memory, PredicateCtx } from '../_types'

/**
 * Resolve elements from the model based on the given expression
 */

export function resolveElements(model: LikeC4Model, expr: ModelLayer.FqnExpr.NonWildcard): Elem[] {
  switch (true) {
    case ModelLayer.FqnExpr.isElementKindExpr(expr): {
      return [...ifilter(model.elements(), el => {
        return expr.isEqual === (el.kind === expr.elementKind)
      })]
    }
    case ModelLayer.FqnExpr.isElementTagExpr(expr): {
      return [...ifilter(model.elements(), el => {
        return expr.isEqual === el.tags.includes(expr.elementTag)
      })]
    }
    case expr.selector === 'expanded': {
      const element = model.element(ModelLayer.FqnRef.toFqn(expr.ref))
      return [
        element,
        ...element.children(),
      ]
    }
    case expr.selector === 'children':
    case expr.selector === 'descendants': {
      const element = model.element(ModelLayer.FqnRef.toFqn(expr.ref))
      let children = expr.selector === 'children' ? toArray(element.children()) : toArray(element.descendants())
      return children && children.length > 0 ? children : [element]
    }
    case ModelLayer.FqnExpr.isModelRef(expr): {
      return [model.element(ModelLayer.FqnRef.toFqn(expr.ref))]
    }
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
  nonWildcard: ModelLayer.FqnExpr.NonWildcard,
  { memory, model }: Pick<PredicateCtx, 'model' | 'memory'>,
): Elem[] {
  const resolved = resolveElements(model, nonWildcard)
  // We include from memory only if the expression is:
  // - expanded element
  // - element reference with or with children (but not descendants - they are already included)
  if (ModelLayer.FqnExpr.isModelRef(nonWildcard)) {
    if (nonWildcard.selector === 'descendants') {
      return resolved
    }
    return includeDescendantsFromMemory(resolved, memory)
  }
  return resolved
}
