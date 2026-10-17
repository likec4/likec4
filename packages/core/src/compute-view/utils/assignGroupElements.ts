import type { NodeId } from '../../types'
import { nonNullable, sortParentsFirst } from '../../utils'
import { DefaultMap } from '../../utils/mnemonist'

interface GroupElement<E> {
  id: string
  ancestors(): Iterable<E>
  descendants?(order: 'asc'): Iterable<E>
}

export function assignGroupElements<E extends GroupElement<E>>(
  explicitFirstSeenIn: ReadonlyMap<E, NodeId>,
  lastSeenIn: ReadonlyMap<E, NodeId>,
): ReadonlyMap<NodeId, ReadonlySet<E>> {
  const assignments = new DefaultMap<NodeId, Set<E>>(() => new Set())
  const assignedTo = new Map<E, NodeId>()

  const assignFrom = (element: E, relatives: Iterable<E>) => {
    for (const relative of relatives) {
      const groupId = assignedTo.get(relative)
      if (groupId) {
        assignedTo.set(element, groupId)
        assignments.get(groupId).add(element)
        return true
      }
    }
    return false
  }

  for (const element of sortParentsFirst([...explicitFirstSeenIn.keys()])) {
    if (!assignFrom(element, element.ancestors())) {
      const groupId = nonNullable(explicitFirstSeenIn.get(element))
      assignedTo.set(element, groupId)
      assignments.get(groupId).add(element)
    }
  }
  for (const element of sortParentsFirst([...lastSeenIn.keys()])) {
    if (
      assignedTo.has(element)
      || assignFrom(element, element.ancestors())
      || assignFrom(element, element.descendants?.('asc') ?? [])
    ) {
      continue
    }
    const groupId = nonNullable(lastSeenIn.get(element))
    assignedTo.set(element, groupId)
    assignments.get(groupId).add(element)
  }
  return new Map(assignments)
}
