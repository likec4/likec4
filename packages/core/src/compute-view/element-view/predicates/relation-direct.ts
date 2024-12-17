import {
  concat,
  constant,
  first,
  flatMap,
  groupBy,
  hasAtLeast,
  map,
  mapValues,
  partition,
  pipe,
  piped,
  prop,
  values,
  when
} from 'remeda'
import { invariant } from '../../../errors'
import { ConnectionModel, findConnectionsBetween, findConnectionsWithin } from '../../../model/connection/model'
import type { RelationshipModel } from '../../../model/RelationModel'
import type { AnyAux } from '../../../model/types'
import * as Expr from '../../../types/expression'
import { ifilter, iflat, iunique, toArray, toSet } from '../../../utils/iterable'
import { intersection, union } from '../../../utils/set'
import type { Elem, PredicateCtx, PredicateExecutor } from '../_types'
import { NoWhere } from '../utils'
import { includeDescendantsFromMemory, resolveAndIncludeFromMemory, resolveElements } from './_utils'

export const DirectRelationExprPredicate: PredicateExecutor<Expr.DirectRelationExpr> = {
  include: ({ expr: { source, target, isBidirectional = false }, memory, model, stage, where, filterWhere }) => {
    const sourceIsWildcard = Expr.isWildcard(source)
    const targetIsWildcard = Expr.isWildcard(target)

    const connections = [] as ConnectionModel<AnyAux>[]
    switch (true) {
      // This is a special case, we look for all relationships that satisfy the where clause
      // * -> * ; Empty memory; Where clause
      case sourceIsWildcard && targetIsWildcard && memory.isEmpty() && where !== NoWhere: {
        const connections = pipe(
          model.relationships(),
          ifilter(where),
          toArray(),
          groupBy(r => r.expression),
          mapValues((sameSourceTarget) => {
            const head = first(sameSourceTarget)
            return new ConnectionModel(
              head.source,
              head.target,
              new Set(sameSourceTarget)
            )
          }),
          values()
        )
        stage.addConnections(connections)
        return stage
      }

      // This is a special case, we look for all relationships between elements that satisfy the where clause
      // * -> *; Not empty memory; Where clause
      case sourceIsWildcard && targetIsWildcard && !memory.isEmpty() && where !== NoWhere: {
        connections.push(
          ...findConnectionsWithin(memory.elements)
        )
        break
      }

      // * -> *
      case sourceIsWildcard && targetIsWildcard: {
        connections.push(
          ...findConnectionsWithin(model.roots())
        )
        break
      }

      // This is a special case, we look for all relationships that satisfy the where clause
      // element -> *; Where clause
      case !sourceIsWildcard && targetIsWildcard && where !== NoWhere: {
        const sources = resolveElements(model, source)
        const connections = pipe(
          sources,
          flatMap(source =>
            pipe(
              source,
              when(constant(isBidirectional === true), {
                onTrue: s => union(s.allIncoming, s.allOutgoing),
                onFalse: s => s.allOutgoing
              }),
              ifilter(where),
              iunique(),
              toArray(),
              partition(r => r.source === source),
              ([outgoing, incoming]) =>
                concat(
                  pipe(
                    outgoing,
                    map(outgoing =>
                      new ConnectionModel(
                        source,
                        outgoing.target,
                        new Set([outgoing])
                      )
                    )
                  ),
                  pipe(
                    incoming,
                    map(incoming =>
                      new ConnectionModel(
                        incoming.source,
                        source,
                        new Set([incoming])
                      )
                    )
                  )
                )
            )
          )
        )
        stage.addConnections(connections)
        return stage
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

      // This is a special case, we look for all relationships that satisfy the where clause
      // * -> element; Where clause
      case sourceIsWildcard && !targetIsWildcard && where !== NoWhere: {
        const targets = resolveElements(model, target)
        const connections = pipe(
          targets,
          flatMap(target =>
            pipe(
              target,
              when(constant(isBidirectional === true), {
                onTrue: s => union(s.allIncoming, s.allOutgoing),
                onFalse: s => s.allIncoming
              }),
              ifilter(where),
              toArray(),
              partition(r => r.target === target),
              ([incoming, outgoing]) =>
                concat(
                  pipe(
                    outgoing,
                    map(outgoing =>
                      new ConnectionModel(
                        target,
                        outgoing.target,
                        new Set([outgoing])
                      )
                    )
                  ),
                  pipe(
                    incoming,
                    map(incoming =>
                      new ConnectionModel(
                        incoming.source,
                        target,
                        new Set([incoming])
                      )
                    )
                  )
                )
            )
          )
        )
        stage.addConnections(connections)
        return stage
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

    return stage
  },
  exclude: ({ expr: { source, target, isBidirectional }, model, memory, stage, where }) => {
    const sourceIsWildcard = Expr.isWildcard(source)
    const targetIsWildcard = Expr.isWildcard(target)

    let relations: Set<RelationshipModel<AnyAux>>

    switch (true) {
      // * -> *
      case sourceIsWildcard && targetIsWildcard: {
        relations = pipe(
          memory.connections,
          flatMap(piped(
            prop('relations'),
            ifilter(where),
            toArray()
          )),
          toSet()
        )
        break
      }

      // element -> *
      case !sourceIsWildcard && targetIsWildcard: {
        const sources = resolveElements(model, source)
        relations = pipe(
          sources,
          flatMap(source =>
            pipe(
              source,
              when(constant(isBidirectional === true), {
                onTrue: s => union(s.allIncoming, s.allOutgoing),
                onFalse: s => s.allOutgoing
              }),
              ifilter(where),
              toArray()
            )
          ),
          toSet()
        )
        break
      }

      // * -> element
      case sourceIsWildcard && !targetIsWildcard: {
        const targets = resolveElements(model, target)
        relations = pipe(
          targets,
          flatMap(target =>
            pipe(
              target,
              when(constant(isBidirectional === true), {
                onTrue: s => union(s.allIncoming, s.allOutgoing),
                onFalse: s => s.allIncoming
              }),
              ifilter(where),
              toArray()
            )
          ),
          toSet()
        )
        break
      }

      default: {
        invariant(!Expr.isWildcard(source), 'Inferrence failed - source must be not a wildcard')
        invariant(!Expr.isWildcard(target), 'Inferrence failed - target must be not a wildcard')
        const sources = resolveElements(model, source)
        const targets = resolveElements(model, target)

        const left = toSet(
          sources
            .flatMap(s => [...(isBidirectional ? union(s.allIncoming, s.allOutgoing) : s.allOutgoing)])
        )
        const right = toSet(
          targets
            .flatMap(t => [...(isBidirectional ? union(t.allIncoming, t.allOutgoing) : t.allIncoming)])
        )

        relations = toSet(
          ifilter(intersection(left, right), where)
        )
      }
    }

    stage.excludeRelations(relations)
    return stage
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
