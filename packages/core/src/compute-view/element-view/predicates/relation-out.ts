import { anyPass, unique } from 'remeda'
import { nonexhaustive } from '../../../errors'
import { type ConnectionModel, Connection, findConnectionsBetween } from '../../../model/connection/model'
import type { LikeC4Model } from '../../../model/LikeC4Model'
import type { RelationshipModel } from '../../../model/RelationModel'
import type { AnyAux } from '../../../model/types'
import { ModelLayer } from '../../../types/expression-v2-model'
import { toSet } from '../../../utils/iterable/to'
import { elementExprToPredicate } from '../../utils/elementExpressionToPredicate'
import type { ConnectionWhere, PredicateExecutor } from '../_types'
import { resolveAndIncludeFromMemory, resolveElements } from './_utils'

export const OutgoingExprPredicate: PredicateExecutor<ModelLayer.RelationExpr.Outgoing> = {
  include: ({ expr, scope, model, memory, stage, filterWhere }) => {
    const target = expr.outgoing
    const connections = [] as ConnectionModel<AnyAux>[]
    if (ModelLayer.FqnExpr.isWildcard(target)) {
      if (!scope) {
        return
      }

      connections.push(
        ...findConnectionsBetween(
          scope,
          scope.ascendingSiblings(),
          'directed',
        ),
      )
    } else {
      const elements = resolveAndIncludeFromMemory(target, { memory, model })
      const visibleElements = [...memory.elements]
      if (visibleElements.length === 0) {
        visibleElements.push(
          ...unique(
            elements.flatMap(el => [...el.ascendingSiblings()]),
          ),
        )
      }
      const ensureOutgoing = outgoingConnectionPredicate(model, target)

      for (const source of elements) {
        connections.push(
          ...findConnectionsBetween(
            source,
            visibleElements,
            'directed',
          ).filter(ensureOutgoing),
        )
      }
    }

    stage.addConnections(
      filterWhere(connections),
    )

    return stage
  },
  exclude: ({ expr: { outgoing }, model, scope, stage, where }) => {
    const excluded = [] as RelationshipModel[]
    if (ModelLayer.FqnExpr.isWildcard(outgoing)) {
      if (!scope) {
        return
      }
      excluded.push(...scope.allOutgoing)
    } else {
      const elements = resolveElements(model, outgoing)
      excluded.push(
        ...elements.flatMap(e => [...e.allOutgoing]),
      )
    }
    stage.excludeRelations(
      toSet(excluded.filter(where)),
    )

    return stage
  },
}

export function outgoingConnectionPredicate(
  model: LikeC4Model,
  expr: ModelLayer.FqnExpr.NonWildcard,
): ConnectionWhere {
  switch (true) {
    case ModelLayer.FqnExpr.isElementKindExpr(expr):
    case ModelLayer.FqnExpr.isElementTagExpr(expr): {
      const isElement = elementExprToPredicate(expr)
      return (connection) => isElement(connection.source)
    }
    case ModelLayer.FqnExpr.isModelRef(expr) && expr.selector === 'children': {
      const fqn = ModelLayer.FqnRef.toFqn(expr.ref)
      return anyPass(
        [...model.children(fqn)].map(
          el => Connection.isOutgoing(el.id),
        ),
      )
    }
    case ModelLayer.FqnExpr.isModelRef(expr) && expr.selector === 'descendants': {
      const fqn = ModelLayer.FqnRef.toFqn(expr.ref)
      return anyPass([
        Connection.isInside(fqn),
        ...[...model.children(fqn)].map(
          el => Connection.isOutgoing(el.id),
        ),
      ])
    }
    case ModelLayer.FqnExpr.isModelRef(expr) && expr.selector === 'expanded': {
      const fqn = ModelLayer.FqnRef.toFqn(expr.ref)
      return anyPass([
        Connection.isOutgoing(fqn),
        Connection.isInside(fqn),
      ])
    }
    case ModelLayer.FqnExpr.isModelRef(expr): {
      const fqn = ModelLayer.FqnRef.toFqn(expr.ref)
      return Connection.isOutgoing(fqn)
    }
    default:
      nonexhaustive(expr)
  }
}
