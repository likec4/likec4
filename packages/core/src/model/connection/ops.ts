import { map, pipe, prop } from 'remeda'
import { isString } from '../../utils'
import {
  isAncestor,
  isDescendantOf,
  type IterableContainer,
  type ReorderedArray,
  sortNaturalByFqn,
} from '../../utils/fqn'
import type { Connection } from './Connection'

/**
 * Check if connection is nested inside another connection
 * (i.e. between descendants)
 */
export function isNestedConnection<T extends { id: string }>(
  parent: WithSourceTarget<NoInfer<T>>,
): (nested: WithSourceTarget<T>) => boolean
export function isNestedConnection<T extends { id: string }>(
  nested: WithSourceTarget<T>,
  parent: WithSourceTarget<T>,
): boolean
export function isNestedConnection<T extends { id: string }>(
  nested: WithSourceTarget<T>,
  parent?: WithSourceTarget<T>,
) {
  if (!parent) {
    const p = nested
    return (n: WithSourceTarget<T>) => isNestedConnection(n, p)
  }
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

type ConnectionElemId = Connection<{ readonly id: string }, any>

export function findDeepestNestedConnection<C extends ConnectionElemId>(
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

export function sortDeepestFirst<C extends ConnectionElemId>(
  connections: ReadonlyArray<C>,
): C[] {
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
 * To make {@link sortConnectionsByBoundaryHierarchy} work correctly we add '.' to boundary
 * Othwerwise connection without boundary will be considered same level as connection with top-level boundary
 */
export const boundaryHierarchy = <C extends WithBoundary>(conn: C) => conn.boundary?.id ? `.${conn.boundary.id}` : ''

type WithBoundary = {
  boundary: null | { id: string }
}
export function sortConnectionsByBoundaryHierarchy(
  sort?: 'asc' | 'desc',
): <T extends WithBoundary, A extends IterableContainer<T>>(array: A) => ReorderedArray<A>
export function sortConnectionsByBoundaryHierarchy<T extends WithBoundary, A extends IterableContainer<T>>(
  array: A,
  sort?: 'asc' | 'desc',
): ReorderedArray<A>
export function sortConnectionsByBoundaryHierarchy<T extends WithBoundary, A extends IterableContainer<T>>(
  connections?: A | 'asc' | 'desc',
  sort?: 'asc' | 'desc',
) {
  if (!connections || isString(connections)) {
    const dir = connections ?? 'asc'
    return (arr: A) => _sortByBoundary(arr, dir)
  }
  return _sortByBoundary(connections, sort ?? 'asc')
}

function _sortByBoundary<C extends WithBoundary>(
  connections: ReadonlyArray<C>,
  order: 'asc' | 'desc',
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
 * Find connections that includes given connection (i.e between it's ancestors)
 */
export function findAscendingConnections<C extends ConnectionElemId>(
  connections: ReadonlyArray<C>,
  connection: C,
): Array<C> {
  return connections.filter(c => isNestedConnection(connection, c))
}

/**
 * Find connections that includes given connection (i.e between it's descendants)
 */
export function findDescendantConnections<C extends ConnectionElemId>(
  connections: ReadonlyArray<C>,
  connection: C,
): Array<C> {
  return connections.filter(isNestedConnection(connection))
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
  source: Iterable<C>,
  exclude: Iterable<C>,
): C[] {
  const minus = new Map([...exclude].map(c => [c.id, c]))
  return [...source].reduce((acc, c) => {
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

type WithSourceTarget<T = unknown> = {
  source: T
  target: T
}

export function hasSameSourceTarget<T>(a: WithSourceTarget<NoInfer<T>>): (b: WithSourceTarget<T>) => boolean
export function hasSameSourceTarget<T>(a: WithSourceTarget<T>, b: WithSourceTarget<T>): boolean
export function hasSameSourceTarget(a: WithSourceTarget, b?: WithSourceTarget) {
  if (b) {
    return a.source === b.source && a.target === b.target
  }
  return (b: WithSourceTarget) => a.source === b.source && a.target === b.target
}

export function hasSameSource<T>(a: WithSourceTarget<NoInfer<T>>): (b: WithSourceTarget<T>) => boolean
export function hasSameSource<T>(a: WithSourceTarget<T>, b: WithSourceTarget<T>): boolean
export function hasSameSource(a: WithSourceTarget, b?: WithSourceTarget) {
  if (b) {
    return a.source === b.source
  }
  return (b: WithSourceTarget) => a.source === b.source
}

export function hasSameTarget<T>(a: WithSourceTarget<NoInfer<T>>): (b: WithSourceTarget<T>) => boolean
export function hasSameTarget<T>(a: WithSourceTarget<T>, b: WithSourceTarget<T>): boolean
export function hasSameTarget(a: WithSourceTarget, b?: WithSourceTarget) {
  if (b) {
    return a.target === b.target
  }
  return (b: WithSourceTarget) => a.target === b.target
}

type WithId<T> = {
  id: T
}
export function isOutgoing<T extends string>(source: WithId<NoInfer<T>>): (a: WithSourceTarget<WithId<T>>) => boolean
export function isOutgoing<T extends string>(a: WithSourceTarget<WithId<T>>, source: WithId<T>): boolean
export function isOutgoing<T extends string>(a: WithSourceTarget<WithId<T>> | WithId<T>, source?: WithId<T>) {
  if (!source) {
    const _source = a as WithId<T>
    return (b: WithSourceTarget<WithId<T>>) => isOutgoing(b, _source)
  }
  const at = a as WithSourceTarget<WithId<T>>
  return isDescendantOf(at.source, source) && !isDescendantOf(at.target, source)
}

export function isIncoming<T extends string>(target: WithId<NoInfer<T>>): (a: WithSourceTarget<WithId<T>>) => boolean
export function isIncoming<T extends string>(a: WithSourceTarget<WithId<T>>, target: WithId<T>): boolean
export function isIncoming<T extends string>(a: WithSourceTarget<WithId<T>> | WithId<T>, target?: WithId<T>) {
  if (!target) {
    const _target = a as WithId<T>
    return (b: WithSourceTarget<WithId<T>>) => isIncoming(b, _target)
  }
  const at = a as WithSourceTarget<WithId<T>>
  return isDescendantOf(at.target, target) && !isDescendantOf(at.source, target)
}

export function isAnyInOut<T extends string>(source: WithId<NoInfer<T>>): (a: WithSourceTarget<WithId<T>>) => boolean
export function isAnyInOut<T extends string>(a: WithSourceTarget<WithId<T>>, source: WithId<T>): boolean
export function isAnyInOut<T extends string>(a: WithSourceTarget<WithId<T>> | WithId<T>, source?: WithId<T>) {
  if (!source) {
    const _source = a as WithId<T>
    return (b: WithSourceTarget<WithId<T>>) => isAnyInOut(b, _source)
  }
  const at = a as WithSourceTarget<WithId<T>>
  return isDescendantOf(at.source, source) !== isDescendantOf(at.target, source)
}

// export function isIncoming<T>(target: NoInfer<T>): (a: WithSourceTarget<T>) => boolean
// export function isIncoming<T>(a: WithSourceTarget<T>, target: T): boolean
// export function isIncoming<T = unknown>(a: WithSourceTarget<T> | T, target?: T) {
//   if (target) {
//     return (a as WithSourceTarget<T>).target === target
//   }
//   const _target = a as T
//   return (b: WithSourceTarget) => b.target === _target
// }

// export function isAnyInOut<T>(source: NoInfer<T>): (a: WithSourceTarget<T>) => boolean
// export function isAnyInOut<T>(a: WithSourceTarget<T>, source: T): boolean
// export function isAnyInOut<T = unknown>(a: WithSourceTarget<T> | T, source?: T) {
//   if (source) {
//     return hasSameSource(a as WithSourceTarget<T>, source) || hasSameTarget(a as WithSourceTarget<T>, source)
//   }
//   const _source = a as T
//   return (b: WithSourceTarget) => hasSameSource(b, _source) || hasSameTarget(b, _source)
// }
