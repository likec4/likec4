import { unique } from 'remeda'
import { type ConnectionModel, findConnectionsBetween } from '../../../model/connection/model'
import type { RelationshipModel } from '../../../model/RelationModel'
import type { AnyAux } from '../../../model/types'
import * as Expr from '../../../types/expression'
import { toArray } from '../../../utils/iterable'
import { toSet } from '../../../utils/iterable/to'
import type { PredicateExecutor } from '../_types'
import { resolveAndIncludeFromMemory, resolveElements } from './_utils'

export const InOutRelationPredicate: PredicateExecutor<Expr.InOutExpr> = {
  include: ({ expr: { inout }, scope, model, memory, stage, filterWhere }) => {
    const connections = [] as ConnectionModel<AnyAux>[]
    if (Expr.isWildcard(inout)) {
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
    if (Expr.isWildcard(inout)) {
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
