import { allPass, anyPass, hasAtLeast, map, pipe } from 'remeda'
import { invariant } from '../../../errors'
import type { ConnectionModel } from '../../../model/connection/model'
import { findConnectionsBetween, findConnectionsWithin } from '../../../model/connection/model'
import type { AnyAux } from '../../../model/types'
import * as Expr from '../../../types/expression'
import { iflat, iunique, toArray } from '../../../utils/iterable'
import type { ConnectionWhere, Elem, PredicateCtx, PredicateExecutor } from '../_types'
import { includeDescendantsFromMemory, resolveAndIncludeFromMemory, resolveElements } from './_utils'
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
    iflat(),
    iunique(),
    toArray(),
    all => includeDescendantsFromMemory(all, memory)
  )
  return [sources, targets]
}
