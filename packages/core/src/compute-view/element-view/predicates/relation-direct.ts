import { allPass, anyPass, hasAtLeast, map, pipe } from 'remeda'
import { invariant, nonexhaustive } from '../../../errors'
import type { LikeC4Model } from '../../../model'
import type { ConnectionModel } from '../../../model/connection/ConnectionModel'
import { findConnectionsBetween, findConnectionsWithin } from '../../../model/connection/model'
import type { AnyAux } from '../../../model/types'
import * as Expr from '../../../types/expression'
import { isAncestor } from '../../../utils'
import { distinct, filter, flatten, toArray } from '../../../utils/iterable'
import type { ConnectionWhere, Elem, Memory, PredicateCtx, PredicateExecutor } from '../_types'
import { incomingConnectionPredicate } from './relation-in'
import { outgoingConnectionPredicate } from './relation-out'

export const DirectRelationExprPredicate: PredicateExecutor<Expr.DirectRelationExpr> = {
  include: ({ expr: { source, target, isBidirectional }, memory, model, stage, filterWhere }) => {
    const sourceIsWildcard = Expr.isWildcard(source)
    const targetIsWildcard = Expr.isWildcard(target)

    const connections = [] as ConnectionModel<AnyAux>[]
    switch (true) {
      // * -> *
      case sourceIsWildcard && targetIsWildcard: {
        connections.push(
          ...findConnectionsWithin(model.roots())
        )
        break
      }

      // element -> *
      case !sourceIsWildcard && targetIsWildcard: {
        const [sources, targets] = resolveWildcard(source, { memory, model })
        const dir = isBidirectional ? 'both' : 'directed'
        for (const source of sources) {
          connections.push(
            ...findConnectionsBetween(source, targets, dir)
          )
        }
        break
      }

      // * -> element
      case sourceIsWildcard && !targetIsWildcard: {
        const [targets, sources] = resolveWildcard(target, { memory, model })
        const dir = isBidirectional ? 'both' : 'directed'
        for (const source of sources) {
          connections.push(
            ...findConnectionsBetween(source, targets, dir)
          )
        }
        break
      }

      default: {
        invariant(!Expr.isWildcard(source), 'Inference failed - source must be not a wildcard')
        invariant(!Expr.isWildcard(target), 'Inference failed - target must be not a wildcard')
        const sources = resolveAndIncludeFromMemory(source, { memory, model })
        const targets = resolveAndIncludeFromMemory(target, { memory, model })
        const dir = isBidirectional ? 'both' : 'directed'
        for (const source of sources) {
          connections.push(
            ...findConnectionsBetween(source, targets, dir)
          )
        }
      }
    }

    stage.addConnections(
      filterWhere(connections)
    )
    return stage.patch()
  },
  exclude: ({ expr: { source, target, isBidirectional }, memory, scope, model, stage, filterWhere }) => {
    let satisfies: ConnectionWhere
    const sourceIsWildcard = Expr.isWildcard(source)
    const targetIsWildcard = Expr.isWildcard(target)

    switch (true) {
      // * -> *
      case sourceIsWildcard && targetIsWildcard: {
        satisfies = () => true
        break
      }

      // element -> *
      case !sourceIsWildcard && targetIsWildcard: {
        satisfies = outgoingConnectionPredicate(model, source)
        if (isBidirectional) {
          satisfies = anyPass([
            satisfies,
            incomingConnectionPredicate(model, source)
          ])
        }
        break
      }

      // * -> element
      case sourceIsWildcard && !targetIsWildcard: {
        satisfies = incomingConnectionPredicate(model, target)
        if (isBidirectional) {
          satisfies = anyPass([
            satisfies,
            outgoingConnectionPredicate(model, target)
          ])
        }
        break
      }

      default: {
        invariant(!Expr.isWildcard(source), 'Inferrence failed - source must be not a wildcard')
        invariant(!Expr.isWildcard(target), 'Inferrence failed - target must be not a wildcard')
        const isOut = outgoingConnectionPredicate(model, source)
        const isIn = incomingConnectionPredicate(model, target)

        satisfies = allPass([isIn, isOut])

        if (isBidirectional) {
          const isOutReverse = outgoingConnectionPredicate(model, target)
          const isInReverese = incomingConnectionPredicate(model, source)
          satisfies = anyPass([
            satisfies,
            allPass([isOutReverse, isInReverese])
          ])
        }
      }
    }

    const connectionsToExclude = filterWhere(
      memory.connections.filter(satisfies)
    )

    return stage.excludeConnections(connectionsToExclude).patch()
  }
}

/**
 * Resolve elements from the model based on the given expression
 */
export function resolveElements(model: LikeC4Model, expr: Exclude<Expr.ElementExpression, Expr.WildcardExpr>): Elem[] {
  switch (true) {
    case Expr.isExpandedElementExpr(expr): {
      const element = model.element(expr.expanded)
      return [
        element,
        ...element.children()
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
      return [...filter(model.elements(), el => {
        return expr.isEqual === (el.kind === expr.elementKind)
      })]
    case Expr.isElementTagExpr(expr):
      return [...filter(model.elements(), el => {
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
  const fromMemory = [...memory.elements].filter(el =>
    !elements.includes(el) && elements.some(ancestor => isAncestor(ancestor, el))
  )
  return elements.concat(fromMemory)
}

/**
 * Combination of `resolveElements` and `includeDescendantsFromMemory`
 */
export function resolveAndIncludeFromMemory(
  nonWildcard: Expr.NonWilcard,
  { memory, model }: Pick<PredicateCtx, 'model' | 'memory'>
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

/**
 * Resolve elements for both source and target, when one of them is a wildcard
 */
function resolveWildcard(
  nonWildcard: Expr.NonWilcard,
  { memory, model }: Pick<PredicateCtx, 'model' | 'memory'>
): [elements: Elem[], wildcard: Elem[]] {
  let sources = resolveElements(model, nonWildcard)
  if (!hasAtLeast(sources, 1)) {
    return [[], []]
  }

  if (Expr.isExpandedElementExpr(nonWildcard) || Expr.isElementRef(nonWildcard)) {
    const parent = model.element(nonWildcard.element ?? nonWildcard.expanded)
    const targets = toArray(parent.ascendingSiblings())
    return [
      includeDescendantsFromMemory(sources, memory),
      includeDescendantsFromMemory(targets, memory)
    ]
  }
  const targets = pipe(
    sources,
    map(el => el.ascendingSiblings()),
    flatten,
    distinct,
    toArray,
    all => includeDescendantsFromMemory(all, memory)
  )
  return [sources, targets]
}

/**
 * Include elements that are not in the given set but are descendants of the current set
 * Consider the following example:
 *    a1.* -> b1
 * If there are a1.a2.a3 and b1.b2 in the memory, but not connected yet - we connect them
 */
export function visibleElements(elements: Elem[], memory: Memory): Elem[] {
  if (memory.isEmpty() || elements.length === 0) {
    return elements
  }
  const fromMemory = [...memory.elements].filter(el =>
    !elements.includes(el) && elements.some(ancestor => isAncestor(ancestor, el))
  )
  return elements.concat(fromMemory)
}
