import { isSameHierarchy } from '../../../utils/fqn'
import { intersection } from '../../../utils/set'
import type { ElementModel } from '../../ElementModel'
import type { AnyAux } from '../../types'
import { ConnectionModel } from './ConnectionModel'

/**
 * Resolve connection from source to target
 *
 * @param direction - if 'both', also returns connection from target to source
 * @default `directed`
 */
export function findConnection<M extends AnyAux>(
  source: ElementModel<M>,
  target: ElementModel<M>,
  direction: 'directed' | 'both' = 'directed',
):
  | readonly [ConnectionModel<M>, ConnectionModel<M>]
  | readonly [ConnectionModel<M>]
  | readonly []
{
  if (source === target) {
    return []
  }
  if (isSameHierarchy(source, target)) {
    return []
  }

  const directedIntersection = intersection(source.allOutgoing, target.allIncoming)

  const directed = directedIntersection.size > 0
    ? [
      new ConnectionModel(
        source,
        target,
        directedIntersection,
      ),
    ] as const
    : [] as const

  if (direction === 'directed') {
    return directed
  }

  const reverseIntersection = intersection(source.allIncoming, target.allOutgoing)
  const reverse = reverseIntersection.size > 0
    ? [
      new ConnectionModel(
        target,
        source,
        reverseIntersection,
      ),
    ] as const
    : [] as const

  return [...directed, ...reverse] as const
}

/**
 * Resolve all connections between element and others
 * @param direction - if 'directed', only look for outgoing connections from the element to others
 * @default `both`
 */
export function findConnectionsBetween<M extends AnyAux>(
  element: ElementModel<M>,
  others: Iterable<ElementModel<NoInfer<M>>>,
  direction: 'directed' | 'both' = 'both',
): readonly ConnectionModel<M>[] {
  if (element.allIncoming.size === 0 && element.allOutgoing.size === 0) {
    return []
  }

  // We separate resolved connection,
  // because we want return outgoing first
  const outgoing = [] as ConnectionModel<M>[]
  const incoming = [] as ConnectionModel<M>[]
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
    ...incoming,
  ]
}

/**
 * Resolve all connections within a given set of elements
 */
export function findConnectionsWithin<M extends AnyAux>(
  elements: Iterable<ElementModel<M>>,
): readonly ConnectionModel<M>[] {
  return [...elements].reduce((acc, el, index, array) => {
    // skip for last element
    if (index === array.length - 1) {
      return acc
    }
    acc.push(
      ...findConnectionsBetween(el, array.slice(index + 1), 'both'),
    )
    return acc
  }, [] as ConnectionModel<M>[])
}
