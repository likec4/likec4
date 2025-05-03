import { anyPass, unique } from 'remeda'
import { nonexhaustive } from '../../../errors'
import type { LikeC4Model } from '../../../model'
import {
  type ConnectionModel,
  Connection,
  findConnection,
  findConnectionsBetween,
} from '../../../model/connection/model'
import type { RelationshipModel } from '../../../model/RelationModel'
import type { AnyAux } from '../../../model/types'
import { ModelLayer } from '../../../types/expression-model'
import { elementExprToPredicate } from '../../utils/elementExpressionToPredicate'
import type { ConnectionWhere, PredicateExecutor } from '../_types'
import { resolveAndIncludeFromMemory, resolveElements } from './_utils'

export const IncomingExprPredicate: PredicateExecutor<ModelLayer.RelationExpr.Incoming> = {
  include: ({ expr, scope, model, memory, stage, filterWhere }) => {
    const target = expr.incoming
    const connections = [] as ConnectionModel<AnyAux>[]
    if (ModelLayer.FqnExpr.isWildcard(target)) {
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
    if (ModelLayer.FqnExpr.isWildcard(incoming)) {
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
  expr: ModelLayer.FqnExpr.NonWildcard,
): ConnectionWhere {
  switch (true) {
    case ModelLayer.FqnExpr.isElementKindExpr(expr):
    case ModelLayer.FqnExpr.isElementTagExpr(expr): {
      const isElement = elementExprToPredicate(expr)
      return (connection) => isElement(connection.target)
    }
    case ModelLayer.FqnExpr.isModelRef(expr) && expr.selector === 'children': {
      const fqn = ModelLayer.FqnRef.toFqn(expr.ref)
      return anyPass(
        [...model.children(fqn)].map(
          el => Connection.isIncoming(el.id),
        ),
      )
    }
    case ModelLayer.FqnExpr.isModelRef(expr) && expr.selector === 'descendants': {
      const fqn = ModelLayer.FqnRef.toFqn(expr.ref)
      return anyPass([
        Connection.isInside(fqn),
        ...[...model.children(fqn)].map(
          el => Connection.isIncoming(el.id),
        ),
      ])
    }
    case ModelLayer.FqnExpr.isModelRef(expr) && expr.selector === 'expanded': {
      const fqn = ModelLayer.FqnRef.toFqn(expr.ref)
      return anyPass([
        Connection.isIncoming(fqn),
        Connection.isInside(fqn),
      ])
    }
    case ModelLayer.FqnExpr.isModelRef(expr): {
      const fqn = ModelLayer.FqnRef.toFqn(expr.ref)
      return Connection.isIncoming(fqn)
    }
    default:
      nonexhaustive(expr)
  }
}
