import { anyPass, unique } from 'remeda'
import { nonexhaustive } from '../../../errors'
import type { LikeC4Model } from '../../../model'
import { Connection, type ConnectionModel, findConnectionsBetween } from '../../../model/connection/model'
import type { RelationshipModel } from '../../../model/RelationModel'
import type { AnyAux } from '../../../model/types'
import * as Expr from '../../../types/expression'
import { toSet } from '../../../utils/iterable/to'
import { elementExprToPredicate } from '../../utils/elementExpressionToPredicate'
import type { ConnectionWhere, PredicateExecutor } from '../_types'
import { resolveAndIncludeFromMemory, resolveElements } from './_utils'

export const OutgoingExprPredicate: PredicateExecutor<Expr.OutgoingExpr> = {
  include: ({ expr, scope, model, memory, stage, filterWhere }) => {
    const target = expr.outgoing
    const connections = [] as ConnectionModel<AnyAux>[]
    if (Expr.isWildcard(target)) {
      if (!scope) {
        return
      }

      connections.push(
        ...findConnectionsBetween(
          scope,
          scope.ascendingSiblings(),
          'directed'
        )
      )
    } else {
      const elements = resolveAndIncludeFromMemory(target, { memory, model })
      const visibleElements = [...memory.elements]
      if (visibleElements.length === 0) {
        visibleElements.push(
          ...unique(
            elements.flatMap(el => [...el.ascendingSiblings()])
          )
        )
      }
      const ensureOutgoing = outgoingConnectionPredicate(model, target)

      for (const source of elements) {
        connections.push(
          ...findConnectionsBetween(
            source,
            visibleElements,
            'directed'
          ).filter(ensureOutgoing)
        )
      }
    }

    stage.addConnections(
      filterWhere(connections)
    )

    return stage
  },
  exclude: ({ expr: { outgoing }, model, scope, stage, where }) => {
    const excluded = [] as RelationshipModel[]
    if (Expr.isWildcard(outgoing)) {
      if (!scope) {
        return
      }
      excluded.push(...scope.allOutgoing)
    } else {
      const elements = resolveElements(model, outgoing)
      excluded.push(
        ...elements.flatMap(e => [...e.allOutgoing])
      )
    }
    stage.excludeRelations(
      toSet(excluded.filter(where))
    )

    return stage
  }
}

export function outgoingConnectionPredicate(
  model: LikeC4Model,
  expr: Exclude<Expr.ElementExpression, Expr.WildcardExpr>
): ConnectionWhere {
  switch (true) {
    case Expr.isElementKindExpr(expr):
    case Expr.isElementTagExpr(expr): {
      const isElement = elementExprToPredicate(expr)
      return (connection) => isElement(connection.source)
    }
    case Expr.isElementRef(expr) && expr.isChildren: {
      return anyPass(
        [...model.children(expr.element)].map(
          el => Connection.isOutgoing(el.id)
        )
      )
    }
    case Expr.isElementRef(expr) && expr.isDescendants: {
      return anyPass([
        Connection.isInside(expr.element),
        ...[...model.children(expr.element)].map(
          el => Connection.isOutgoing(el.id)
        )
      ])
    }
    case Expr.isExpandedElementExpr(expr): {
      return anyPass([
        Connection.isOutgoing(expr.expanded),
        Connection.isInside(expr.expanded)
      ])
    }
    case Expr.isElementRef(expr): {
      return Connection.isOutgoing(expr.element)
    }
    default:
      nonexhaustive(expr)
  }
}
