import { anyPass } from 'remeda'
import { model } from '../../../builder/Builder.model'
import { nonexhaustive } from '../../../errors'
import { Connection, type ConnectionModel } from '../../../model/connection/ConnectionModel'
import { findConnectionsBetween } from '../../../model/connection/model'
import type { AnyAux } from '../../../model/types'
import * as Expr from '../../../types/expression'
import { filter, isAncestor, isSameHierarchy } from '../../../utils'
import { elementExprToPredicate } from '../../utils/elementExpressionToPredicate'
import type { ConnectionWhere, Elem, ElementWhere, PredicateExecutor, Where } from '../_types'
import { resolveAndIncludeFromMemory, resolveElements } from './relation-direct'

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
          scope.ascendingSiblings()
        )
      )
    } else {
      const elements = resolveAndIncludeFromMemory(inout, { memory, model })
      const visibleElements = new Set(filter(memory.elements, (el) => !elements.some(el2 => isSameHierarchy(el, el2))))
      for (const el of elements) {
        connections.push(
          ...findConnectionsBetween(
            el,
            visibleElements
          )
        )
      }
    }

    stage.addConnections(
      filterWhere(connections)
    )

    return stage.patch()
  },
  exclude: ({ expr: { inout }, model, scope, memory, stage, filterWhere }) => {
    let satisfies: ConnectionWhere
    switch (true) {
      case Expr.isWildcard(inout): {
        if (!scope) {
          return
        }
        satisfies = Connection.isAnyInOut(scope.id)
        break
      }
      case Expr.isElementKindExpr(inout):
      case Expr.isElementTagExpr(inout): {
        const isElement = elementExprToPredicate(inout)
        satisfies = (connection) => isElement(connection.source) || isElement(connection.target)
        break
      }
      case Expr.isElementRef(inout) && inout.isChildren: {
        satisfies = anyPass(
          [...model.children(inout.element)]
            .map((el) => Connection.isAnyInOut(el.id))
        )
        break
      }
      case Expr.isElementRef(inout) && inout.isDescendants:
      case Expr.isExpandedElementExpr(inout): {
        const target = inout.element ?? inout.expanded
        satisfies = anyPass([
          Connection.isAnyInOut(target),
          Connection.isInside(target)
        ])
        break
      }
      case Expr.isElementRef(inout): {
        satisfies = Connection.isAnyInOut(inout.element)
        break
      }
      default:
        nonexhaustive(inout)
    }

    const connectionsToExclude = filterWhere(
      memory.connections.filter(satisfies)
    )

    return stage.excludeConnections(connectionsToExclude).patch()
  }
}
