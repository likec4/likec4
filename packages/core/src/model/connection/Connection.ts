import type { Fqn } from '../../types'
import { isAncestor } from '../../utils'
import type { DeploymentElementModel } from '../DeploymentElementModel'
import type { ElementModel } from '../ElementModel'

export interface Connection<Elem = ElementModel | DeploymentElementModel, Id = string> {
  readonly id: Id
  readonly source: Elem
  readonly target: Elem

  /**
   * Common ancestor of the source and target elements.
   * Represents the boundary of the connection.
   */
  readonly boundary: Elem | null

  /**
   * Human readable expression of the connection
   * Mostly used for testing and debugging
   */
  readonly expression: string

  mergeWith(this: Connection<Elem, Id>, other: typeof this): typeof this

  nonEmpty(): boolean

  difference(this: Connection<Elem, Id>, other: typeof this): typeof this

  intersect(this: Connection<Elem, Id>, other: typeof this): typeof this

  equals(other: Connection): boolean
}

export namespace Connection {
  type ConnectionPredicate = <C extends Connection<{ id: string }, any>>(connection: C) => boolean

  type ElementId = Fqn | string

  export const isInside = (fqn: ElementId): ConnectionPredicate => {
    return (connection) => isAncestor(fqn, connection.source.id) && isAncestor(fqn, connection.target.id)
  }

  export const isDirectedBetween = (source: ElementId, target: ElementId): ConnectionPredicate => {
    return (connection) =>
      (connection.source.id === source || isAncestor(source, connection.source.id))
      && (connection.target.id === target || isAncestor(target, connection.target.id))
  }

  export const isAnyBetween = (source: ElementId, target: ElementId): ConnectionPredicate => {
    const forward = isDirectedBetween(source, target),
      backward = isDirectedBetween(target, source)
    return (connection) => forward(connection) || backward(connection)
  }

  export const isIncoming = (target: ElementId): ConnectionPredicate => {
    return (connection) =>
      (connection.target.id === target || isAncestor(target, connection.target.id))
      && !isAncestor(target, connection.source.id)
  }

  export const isOutgoing = (source: ElementId): ConnectionPredicate => {
    return (connection) =>
      (connection.source.id === source || isAncestor(source, connection.source.id))
      && !isAncestor(source, connection.target.id)
  }

  export const isAnyInOut = (source: ElementId): ConnectionPredicate => {
    const isIn = isIncoming(source),
      isOut = isOutgoing(source)
    return (connection) => isIn(connection) || isOut(connection)
  }
}
