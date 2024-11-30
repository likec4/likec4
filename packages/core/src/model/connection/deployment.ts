import { isSameHierarchy } from '../../utils/fqn'
import { DeploymentConnectionModel } from '../DeploymentConnectionModel'
import type { DeploymentElementModel } from '../DeploymentElementModel'
import type { AnyAux } from '../types'

export function mergeConnections<M extends AnyAux>(
  connections: Iterable<DeploymentConnectionModel<M>>
): DeploymentConnectionModel<M>[] {
  const map = new Map<string, DeploymentConnectionModel<M>>()
  for (const conn of connections) {
    const existing = map.get(conn.id)
    if (existing) {
      map.set(conn.id, existing.mergeWith(conn))
    } else {
      map.set(conn.id, conn)
    }
  }
  return [...map.values()]
}

export function findConnection<M extends AnyAux>(
  source: DeploymentElementModel<M>,
  target: DeploymentElementModel<NoInfer<M>>,
  direction: 'directed' | 'both' = 'directed'
): readonly DeploymentConnectionModel<M>[] {
  if (source === target) {
    return []
  }
  if (isSameHierarchy(source, target)) {
    return []
  }

  const directedIntersection = source.allOutgoing.intersect(target.allIncoming)

  const directed = directedIntersection.nonEmpty
    ? [
      new DeploymentConnectionModel(
        source,
        target,
        directedIntersection
      )
    ] as const
    : [] as const

  if (direction === 'directed') {
    return directed
  }

  const reverseIntersection = source.allIncoming.intersect(target.allOutgoing)
  const reverse = reverseIntersection.nonEmpty
    ? [
      new DeploymentConnectionModel(
        target,
        source,
        reverseIntersection
      )
    ] as const
    : [] as const

  return [...directed, ...reverse] as const
}

/**
 * Resolve all connection between element and others (any direction)
 */
export function findConnectionsBetween<M extends AnyAux>(
  element: DeploymentElementModel<M>,
  others: Iterable<DeploymentElementModel<NoInfer<M>>>
): readonly DeploymentConnectionModel<M>[] {
  const otherElements = [...others]
  if (otherElements.length === 0) {
    return []
  }
  if (element.allIncoming.isEmpty && element.allOutgoing.isEmpty) {
    return []
  }

  const result = [] as DeploymentConnectionModel<M>[]
  for (const _other of others) {
    result.push(
      ...findConnection(element, _other, 'both')
    )
  }
  return result
}

export function findConnectionsWithin<M extends AnyAux>(
  elements: Iterable<DeploymentElementModel<M>>
): readonly DeploymentConnectionModel<M>[] {
  return [...elements].reduce((acc, el, index, array) => {
    // return acc if last element
    if (index === array.length - 1) {
      return acc
    }
    const connections = findConnectionsBetween(el, array.slice(index + 1))
    // We reverse connect
    acc.push(...connections)
    return acc
  }, [] as DeploymentConnectionModel<M>[])
}
