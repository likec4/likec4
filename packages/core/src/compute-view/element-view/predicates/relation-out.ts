import { anyPass, unique } from 'remeda'
import type { LikeC4Model, RelationshipModel } from '../../../model'
import { type ConnectionModel, Connection } from '../../../model'
import type { AnyAux } from '../../../types'
import { type ModelRelationExpr, FqnRef, ModelFqnExpr } from '../../../types'
import { nonexhaustive } from '../../../utils'
import { toSet } from '../../../utils/iterable/to'
import { elementExprToPredicate } from '../../utils/elementExpressionToPredicate'
import type { ConnectionWhere, PredicateExecutor } from '../_types'
import { findConnectionsBetween, resolveAndIncludeFromMemory, resolveElements } from './_utils'

export const OutgoingExprPredicate: PredicateExecutor<ModelRelationExpr.Outgoing<AnyAux>> = {
  include: ({ expr, scope, model, memory, stage, filterWhere }) => {
    const target = expr.outgoing
    const connections = [] as ConnectionModel<AnyAux>[]
    if (ModelFqnExpr.isWildcard(target)) {
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
    if (ModelFqnExpr.isWildcard(outgoing)) {
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
  expr: ModelFqnExpr.NonWildcard,
): ConnectionWhere {
  switch (true) {
    case ModelFqnExpr.isElementKindExpr(expr):
    case ModelFqnExpr.isElementTagExpr(expr): {
      const isElement = elementExprToPredicate(expr)
      return (connection) => isElement(connection.source)
    }
    case ModelFqnExpr.isModelRef(expr) && expr.selector === 'children': {
      const fqn = FqnRef.flatten(expr.ref)
      return anyPass(
        [...model.children(fqn)].map(
          el => Connection.isOutgoing(el.id),
        ),
      )
    }
    case ModelFqnExpr.isModelRef(expr) && expr.selector === 'descendants': {
      const fqn = FqnRef.flatten(expr.ref)
      return anyPass([
        Connection.isInside(fqn),
        ...[...model.children(fqn)].map(
          el => Connection.isOutgoing(el.id),
        ),
      ])
    }
    case ModelFqnExpr.isModelRef(expr) && expr.selector === 'expanded': {
      const fqn = FqnRef.flatten(expr.ref)
      return anyPass([
        Connection.isOutgoing(fqn),
        Connection.isInside(fqn),
      ])
    }
    case ModelFqnExpr.isModelRef(expr): {
      const fqn = FqnRef.flatten(expr.ref)
      return Connection.isOutgoing(fqn)
    }
    default:
      nonexhaustive(expr)
  }
}
