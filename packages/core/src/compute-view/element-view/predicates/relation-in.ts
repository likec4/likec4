import { anyPass, map, pipe, reduce, unique } from 'remeda'
import { model } from '../../../builder/Builder.model'
import { nonexhaustive } from '../../../errors'
import type { LikeC4Model } from '../../../model'
import { Connection, type ConnectionModel } from '../../../model/connection/ConnectionModel'
import { findConnection, findConnectionsBetween } from '../../../model/connection/model'
import type { RelationshipModel } from '../../../model/RelationModel'
import type { AnyAux } from '../../../model/types'
import * as Expr from '../../../types/expression'
import { filter, flatten, isAncestor, isSameHierarchy, toArray, union } from '../../../utils'
import { elementExprToPredicate } from '../../utils/elementExpressionToPredicate'
import type { ConnectionWhere, Elem, ElementWhere, PredicateExecutor, Where } from '../_types'
import { resolveAndIncludeFromMemory, resolveElements } from './relation-direct'

export const IncomingExprPredicate: PredicateExecutor<Expr.IncomingExpr> = {
  include: ({ expr, scope, model, memory, stage, filterWhere }) => {
    const target = expr.incoming
    const connections = [] as ConnectionModel<AnyAux>[]
    if (Expr.isWildcard(target)) {
      if (!scope) {
        return
      }
      for (const sibling of scope.ascendingSiblings()) {
        connections.push(
          ...findConnection(
            sibling,
            scope,
            'directed'
          )
        )
      }
    } else {
      const targets = resolveAndIncludeFromMemory(target, { memory, model })
      const visibleElements = [...memory.elements]
      if (visibleElements.length === 0) {
        visibleElements.push(
          ...unique(
            targets.flatMap(el => [...el.ascendingSiblings()])
          )
        )
      }
      const ensureIncoming = incomingConnectionPredicate(model, target)
      for (const visible of visibleElements) {
        connections.push(
          ...findConnectionsBetween(
            visible,
            targets,
            'directed'
          ).filter(ensureIncoming)
        )
      }
    }

    stage.addConnections(
      filterWhere(connections)
    )

    return stage.patch()
  },
  exclude: ({ expr, model, scope, memory, stage, filterWhere }) => {
    const incoming = expr.incoming
    let satisfies: ConnectionWhere

    if (Expr.isWildcard(incoming)) {
      if (!scope) {
        return
      }
      satisfies = Connection.isIncoming(scope.id)
    } else {
      satisfies = incomingConnectionPredicate(model, incoming)
    }

    const connectionsToExclude = filterWhere(
      memory.connections.filter(satisfies)
    )

    return stage.excludeRelations(connectionsToExclude).patch()
  }
}

export function incomingConnectionPredicate(
  model: LikeC4Model,
  expr: Exclude<Expr.ElementExpression, Expr.WildcardExpr>
): ConnectionWhere {
  switch (true) {
    case Expr.isElementKindExpr(expr):
    case Expr.isElementTagExpr(expr): {
      const isElement = elementExprToPredicate(expr)
      return (connection) => isElement(connection.target)
    }
    case Expr.isElementRef(expr) && expr.isChildren: {
      return anyPass(
        [...model.children(expr.element)].map(
          el => Connection.isIncoming(el.id)
        )
      )
    }
    case Expr.isElementRef(expr) && expr.isDescendants: {
      return anyPass([
        Connection.isInside(expr.element),
        ...[...model.children(expr.element)].map(
          el => Connection.isIncoming(el.id)
        )
      ])
    }
    case Expr.isExpandedElementExpr(expr): {
      return anyPass([
        Connection.isIncoming(expr.expanded),
        Connection.isInside(expr.expanded)
      ])
    }
    case Expr.isElementRef(expr): {
      return Connection.isIncoming(expr.element)
    }
    default:
      nonexhaustive(expr)
  }
}
