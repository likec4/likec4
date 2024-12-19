import { map, pipe, prop } from 'remeda'
import type { Fqn } from '../../types'
import { isAncestor, type IterableContainer, type ReorderedArray, sortNaturalByFqn } from '../../utils'

export interface Connection<Elem = unknown, Id = unknown> {
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

/**
 * Check if connection is nested inside another connection
 */
export function isNestedConnection<C extends Connection<{ id: string }, any>>(nested: C, parent: C) {
  const isSameSource = nested.source === parent.source
  const isSameTarget = nested.target === parent.target
  if (isSameSource && isSameTarget) {
    return false
  }
  const isSourceNested = isAncestor(parent.source.id, nested.source.id)
  const isTargetNested = isAncestor(parent.target.id, nested.target.id)
  return (
    (isSourceNested && isTargetNested)
    || (isSameSource && isTargetNested)
    || (isSameTarget && isSourceNested)
  )
}

type WithElemId = Connection<{ readonly id: string }, any>

export function findDeepestNestedConnection<C extends Connection<{ id: string }, any>>(
  connections: ReadonlyArray<C>,
  connection: C,
): C | null {
  let deepest = connection
  for (const c of connections) {
    if (isNestedConnection(c, deepest)) {
      deepest = c
    }
  }
  return deepest !== connection ? deepest : null
}

export function sortDeepestFirst<C extends Connection<{ id: string }, any>>(
  connections: ReadonlyArray<C>,
): ReadonlyArray<C> {
  const sorted = [] as C[]
  const unsorted = connections.slice()
  let next
  while (next = unsorted.shift()) {
    let deepest
    while (deepest = findDeepestNestedConnection(unsorted, next)) {
      const index = unsorted.indexOf(deepest)
      sorted.push(unsorted.splice(index, 1)[0]!)
    }
    sorted.push(next)
  }
  return sorted
}

/**
 * To make {@link compareFqnHierarchically} work correctly we add '.' to boundary
 * Othwerwise connection without boundary considered same level as connection with top-levelboundary
 */
const boundaryHierarchy = <C extends Connection<{ id: string }>>(conn: C) =>
  conn.boundary?.id ? `.${conn.boundary.id}` : ''

export function sortConnectionsByBoundaryHierarchy<C extends Connection<{ id: string }>>(
  connections: ReadonlyArray<C>,
  order: 'asc' | 'desc' = 'asc',
): C[] {
  return pipe(
    connections,
    map(conn => ({
      id: boundaryHierarchy(conn),
      conn,
    })),
    sortNaturalByFqn(order),
    map(prop('conn')),
  )
}

/**
 * Find connections that includes given connection (i.e betwen it's ancestors)
 */
export function findAscendingConnections<C extends WithElemId>(
  connections: ReadonlyArray<C>,
  connection: NoInfer<C>,
): Array<C> {
  return connections.filter(c => isNestedConnection(connection, c))
}

export function mergeConnections<C extends Connection>(
  connections: ReadonlyArray<C>,
): C[] {
  const map = new Map<C['id'], C>()
  for (const conn of connections) {
    const existing = map.get(conn.id)
    if (existing) {
      map.set(conn.id, conn.mergeWith(existing) as C)
    } else {
      map.set(conn.id, conn)
    }
  }
  return [...map.values()]
}

/**
 * Excludes the values existing in `other` array.
 * The output maintains the same order as the input.
 */
export function differenceConnections<C extends Connection>(
  source: ReadonlyArray<C>,
  exclude: ReadonlyArray<C>,
): C[] {
  const minus = new Map(exclude.map(c => [c.id, c]))
  return source.reduce((acc, c) => {
    const other = minus.get(c.id)
    if (!other) {
      acc.push(c)
      return acc
    }
    const updated = c.difference(other) as C
    if (updated.nonEmpty()) {
      acc.push(updated)
    }
    return acc
  }, [] as C[])
}
