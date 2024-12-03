import { isSameHierarchy } from '../../utils/fqn'
import type { DeploymentElementModel } from '../DeploymentElementModel'
import type { AnyAux } from '../types'
import { DeploymentConnectionModel } from './DeploymentConnectionModel'

export { mergeConnections } from './model'

/**
 * Resolve connection from source to target
 * If direction is `both`, also look for reverse connection
 */
export function findConnection<M extends AnyAux>(
  source: DeploymentElementModel<M>,
  target: DeploymentElementModel<NoInfer<M>>,
  direction: 'directed' | 'both' = 'directed'
):
  | readonly [DeploymentConnectionModel<M>, DeploymentConnectionModel<M>]
  | readonly [DeploymentConnectionModel<M>]
  | readonly []
{
  if (source === target) {
    return []
  }
  if (isSameHierarchy(source, target)) {
    return []
  }

  const directedIntersection = source.allOutgoing.intersect(target.allIncoming)

  const directed = directedIntersection.nonEmpty
    ? [
      new DeploymentConnectionModel<M>(
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
 * Resolve all connections between element and others
 * By default, look for both directions.
 */
export function findConnectionsBetween<M extends AnyAux>(
  element: DeploymentElementModel<M>,
  others: Iterable<DeploymentElementModel<NoInfer<M>>>,
  direction: 'directed' | 'both' = 'both'
): readonly DeploymentConnectionModel<M>[] {
  if (element.allIncoming.isEmpty && element.allOutgoing.isEmpty) {
    return []
  }

  // We separate resolved connection,
  // because we want return outgoing first
  const outgoing = [] as DeploymentConnectionModel<M>[]
  const incoming = [] as DeploymentConnectionModel<M>[]
  for (const _other of others) {
    if (element === _other) {
      continue
    }
    for (const found of findConnection(element, _other, direction)) {
      if (found.source === element) {
        outgoing.push(found)
      } else {
        incoming.push(found)
      }
    }
  }
  return [
    ...outgoing,
    ...incoming
  ]
}

/**
 * Resolve all connections within a given set of elements
 */
export function findConnectionsWithin<M extends AnyAux>(
  elements: Iterable<DeploymentElementModel<M>>
): readonly DeploymentConnectionModel<M>[] {
  return [...elements].reduce((acc, el, index, array) => {
    // skip for last element
    if (index === array.length - 1) {
      return acc
    }
    acc.push(
      ...findConnectionsBetween(el, array.slice(index + 1), 'both')
    )
    return acc
  }, [] as DeploymentConnectionModel<M>[])
}
