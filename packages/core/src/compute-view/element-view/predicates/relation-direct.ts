import { concat, constant, flatMap, hasAtLeast, map, partition, pipe, piped, prop, when } from 'remeda'
import { invariant } from '../../../errors'
import { ConnectionModel, findConnectionsBetween, findConnectionsWithin } from '../../../model/connection/model'
import type { RelationshipModel } from '../../../model/RelationModel'
import type { AnyAux } from '../../../model/types'
import { ModelLayer } from '../../../types/expression-v2-model'
import { isSameHierarchy } from '../../../utils'
import { ifilter, iflat, iunique, toArray, toSet } from '../../../utils/iterable'
import { intersection, union } from '../../../utils/set'
import type { Elem, PredicateCtx, PredicateExecutor } from '../_types'
import { NoWhere } from '../utils'
import { includeDescendantsFromMemory, resolveAndIncludeFromMemory, resolveElements } from './_utils'

const isWildcard = ModelLayer.FqnExpr.isWildcard

export const DirectRelationExprPredicate: PredicateExecutor<ModelLayer.RelationExpr.Direct> = {
  include: ({ expr: { source, target, isBidirectional = false }, memory, model, stage, where, filterWhere }) => {
    const sourceIsWildcard = isWildcard(source)
    const targetIsWildcard = isWildcard(target)

    const connections = [] as ConnectionModel<AnyAux>[]
    switch (true) {
      // This is a special case, we look for all relationships that satisfy the where clause
      // * -> * ; Empty memory; Where clause
      case sourceIsWildcard && targetIsWildcard && memory.isEmpty() && where !== NoWhere: {
        const connections = pipe(
          model.relationships(),
          ifilter(where),
          toArray(),
          map(r => new ConnectionModel(r.source, r.target, new Set([r]))),
        )
        stage.addConnections(connections)
        return stage
      }

      // This is a special case, we look for all relationships between elements that satisfy the where clause
      // * -> *; Not empty memory; Where clause
      case sourceIsWildcard && targetIsWildcard && !memory.isEmpty() && where !== NoWhere: {
        connections.push(
          ...findConnectionsWithin(memory.elements),
        )
        break
      }

      // * -> *
      case sourceIsWildcard && targetIsWildcard: {
        connections.push(
          ...findConnectionsWithin(model.roots()),
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
                onFalse: s => s.allOutgoing,
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
                        new Set([outgoing]),
                      )
                    ),
                  ),
                  pipe(
                    incoming,
                    map(incoming =>
                      new ConnectionModel(
                        incoming.source,
                        source,
                        new Set([incoming]),
                      )
                    ),
                  ),
                ),
            )
          ),
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
            ...findConnectionsBetween(source, targets, dir),
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
                onFalse: s => s.allIncoming,
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
                        new Set([outgoing]),
                      )
                    ),
                  ),
                  pipe(
                    incoming,
                    map(incoming =>
                      new ConnectionModel(
                        incoming.source,
                        target,
                        new Set([incoming]),
                      )
                    ),
                  ),
                ),
            )
          ),
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
            ...findConnectionsBetween(source, targets, dir),
          )
        }
        break
      }

      default: {
        invariant(!isWildcard(source), 'Inference failed - source must be not a wildcard')
        invariant(!isWildcard(target), 'Inference failed - target must be not a wildcard')
        const sources = resolveAndIncludeFromMemory(source, { memory, model })
        const targets = resolveAndIncludeFromMemory(target, { memory, model })
        const dir = isBidirectional ? 'both' : 'directed'
        for (const source of sources) {
          connections.push(
            ...findConnectionsBetween(source, targets, dir),
          )
        }
      }
    }

    stage.addConnections(
      filterWhere(connections),
    )

    return stage
  },
  exclude: ({ expr: { source, target, isBidirectional }, model, memory, stage, where }) => {
    const sourceIsWildcard = isWildcard(source)
    const targetIsWildcard = isWildcard(target)

    let relations: Set<RelationshipModel<AnyAux>>

    switch (true) {
      // * -> *
      case sourceIsWildcard && targetIsWildcard: {
        relations = pipe(
          memory.connections,
          flatMap(piped(
            prop('relations'),
            ifilter(where),
            toArray(),
          )),
          toSet(),
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
                onFalse: s => s.allOutgoing,
              }),
              ifilter(where),
              toArray(),
            )
          ),
          toSet(),
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
                onFalse: s => s.allIncoming,
              }),
              ifilter(where),
              toArray(),
            )
          ),
          toSet(),
        )
        break
      }

      default: {
        invariant(!isWildcard(source), 'Inferrence failed - source must be not a wildcard')
        invariant(!isWildcard(target), 'Inferrence failed - target must be not a wildcard')
        const sources = resolveElements(model, source)
        const targets = resolveElements(model, target)

        let accum = new Set<RelationshipModel<AnyAux>>()
        for (const source of sources) {
          for (const target of targets) {
            if (isSameHierarchy(source, target)) {
              continue
            }
            accum = union(
              accum,
              intersection(source.allOutgoing, target.allIncoming),
              isBidirectional ? intersection(target.allOutgoing, source.allIncoming) : new Set(),
            )
          }
        }

        relations = toSet(ifilter(accum, where))
      }
    }

    stage.excludeRelations(relations)
    return stage
  },
}

/**
 * Resolve elements for both source and target, when one of them is a wildcard
 */
function resolveWildcard(
  nonWildcard: ModelLayer.FqnExpr.NonWildcard,
  { memory, model }: Pick<PredicateCtx, 'model' | 'memory'>,
): [elements: Elem[], wildcard: Elem[]] {
  let sources = resolveElements(model, nonWildcard)
  if (!hasAtLeast(sources, 1)) {
    return [[], []]
  }

  if (ModelLayer.FqnExpr.isModelRef(nonWildcard)) {
    const parent = model.element(ModelLayer.FqnRef.toFqn(nonWildcard.ref))
    const targets = toArray(parent.ascendingSiblings())
    return [
      includeDescendantsFromMemory(sources, memory),
      includeDescendantsFromMemory(targets, memory),
    ]
  }
  const targets = pipe(
    sources,
    map(el => el.ascendingSiblings()),
    iflat(),
    iunique(),
    toArray(),
    all => includeDescendantsFromMemory(all, memory),
  )
  return [sources, targets]
}
