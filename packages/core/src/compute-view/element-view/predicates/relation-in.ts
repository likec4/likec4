import { anyPass, unique } from 'remeda'
import { nonexhaustive } from '../../../errors'
import { type ConnectionModel, type LikeC4Model, type RelationshipModel, Connection } from '../../../model'
import type { ModelRelationExpr } from '../../../types'
import { type AnyAux, FqnRef, ModelFqnExpr } from '../../../types'
import { elementExprToPredicate } from '../../utils/elementExpressionToPredicate'
import type { ConnectionWhere, PredicateExecutor } from '../_types'
import { findConnection, findConnectionsBetween, resolveAndIncludeFromMemory, resolveElements } from './_utils'

export const IncomingExprPredicate: PredicateExecutor<ModelRelationExpr.Incoming<AnyAux>> = {
  include: ({ expr, scope, model, memory, stage, filterWhere }) => {
    const target = expr.incoming
    const connections = [] as ConnectionModel<AnyAux>[]
    if (ModelFqnExpr.isWildcard(target)) {
      if (!scope) {
        return
      }
      for (const sibling of scope.ascendingSiblings()) {
        connections.push(
          ...findConnection(
            sibling,
            scope,
            'directed',
          ),
        )
      }
    } else {
      const targets = resolveAndIncludeFromMemory(target, { memory, model })
      const visibleElements = [...memory.elements]
      if (visibleElements.length === 0) {
        visibleElements.push(
          ...unique(
            targets.flatMap(el => [...el.ascendingSiblings()]),
          ),
        )
      }
      const ensureIncoming = incomingConnectionPredicate(model, target)
      for (const visible of visibleElements) {
        connections.push(
          ...findConnectionsBetween(
            visible,
            targets,
            'directed',
          ).filter(ensureIncoming),
        )
      }
    }

    stage.addConnections(
      filterWhere(connections),
    )

    return stage
  },
  exclude: ({ expr: { incoming }, model, scope, stage, where }) => {
    const excluded = [] as RelationshipModel[]
    if (ModelFqnExpr.isWildcard(incoming)) {
      if (!scope) {
        return
      }
      excluded.push(...scope.allIncoming)
    } else {
      const elements = resolveElements(model, incoming)
      excluded.push(
        ...elements.flatMap(e => [...e.allIncoming]),
      )
    }
    stage.excludeRelations(new Set(excluded.filter(where)))

    return stage
  },
}

export function incomingConnectionPredicate(
  model: LikeC4Model,
  expr: ModelFqnExpr.NonWildcard,
): ConnectionWhere {
  switch (true) {
    case ModelFqnExpr.isElementKindExpr(expr):
    case ModelFqnExpr.isElementTagExpr(expr): {
      const isElement = elementExprToPredicate(expr)
      return (connection) => isElement(connection.target)
    }
    case ModelFqnExpr.isModelRef(expr) && expr.selector === 'children': {
      const fqn = FqnRef.flatten(expr.ref)
      return anyPass(
        [...model.children(fqn)].map(
          el => Connection.isIncoming(el.id),
        ),
      )
    }
    case ModelFqnExpr.isModelRef(expr) && expr.selector === 'descendants': {
      const fqn = FqnRef.flatten(expr.ref)
      return anyPass([
        Connection.isInside(fqn),
        ...[...model.children(fqn)].map(
          el => Connection.isIncoming(el.id),
        ),
      ])
    }
    case ModelFqnExpr.isModelRef(expr) && expr.selector === 'expanded': {
      const fqn = FqnRef.flatten(expr.ref)
      return anyPass([
        Connection.isIncoming(fqn),
        Connection.isInside(fqn),
      ])
    }
    case ModelFqnExpr.isModelRef(expr): {
      const fqn = FqnRef.flatten(expr.ref)
      return Connection.isIncoming(fqn)
    }
    default:
      nonexhaustive(expr)
  }
}
