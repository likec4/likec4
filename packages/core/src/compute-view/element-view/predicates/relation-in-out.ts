import { unique } from 'remeda'
import { type ConnectionModel } from '../../../model'
import type { RelationshipModel } from '../../../model'
import { type AnyAux, type ModelRelationExpr, ModelFqnExpr } from '../../../types'
import { toArray, toSet } from '../../../utils/iterable/to'
import type { PredicateExecutor } from '../_types'
import { findConnectionsBetween, resolveAndIncludeFromMemory, resolveElements } from './_utils'

export const InOutRelationPredicate: PredicateExecutor<ModelRelationExpr.InOut<AnyAux>> = {
  include: ({ expr: { inout }, scope, model, memory, stage, filterWhere }) => {
    const connections = [] as ConnectionModel<AnyAux>[]
    if (ModelFqnExpr.isWildcard(inout)) {
      if (!scope) {
        return
      }
      connections.push(
        ...findConnectionsBetween(
          scope,
          scope.ascendingSiblings(),
        ),
      )
    } else {
      const elements = resolveAndIncludeFromMemory(inout, { memory, model })
      let visibleElements = [...memory.elements]
      if (visibleElements.length === 0) {
        visibleElements = unique(
          elements.flatMap(el => toArray(el.ascendingSiblings())),
        )
      }
      for (const el of elements) {
        connections.push(
          ...findConnectionsBetween(
            el,
            visibleElements,
          ),
        )
      }
    }

    stage.addConnections(
      filterWhere(connections),
    )

    return stage
  },
  exclude: ({ expr: { inout }, model, scope, stage, where }) => {
    const excluded = [] as RelationshipModel[]
    if (ModelFqnExpr.isWildcard(inout)) {
      if (!scope) {
        return
      }
      excluded.push(...scope.allOutgoing)
      excluded.push(...scope.allIncoming)
    } else {
      const elements = resolveElements(model, inout)
      excluded.push(
        ...elements.flatMap(e => [...e.allOutgoing, ...e.allIncoming]),
      )
    }
    stage.excludeRelations(toSet(excluded.filter(where)))

    return stage
  },
}
