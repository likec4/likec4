import type { Fqn } from '../types'
import { commonAncestor, compareFqnHierarchically, isAncestor } from './fqn'

export type Relation = {
  source: string
  target: string
}

export type RelationPredicate = (rel: Relation) => boolean

/**
 * Compares two relations hierarchically.
 * From the most general (implicit) to the most specific.
 */
export const compareRelations = <T extends { source: string; target: string }>(a: T, b: T): number => {
  const parentA = commonAncestor(a.source as Fqn, a.target as Fqn)
  const parentB = commonAncestor(b.source as Fqn, b.target as Fqn)
  if (parentA && !parentB) {
    return 1
  }
  if (!parentA && parentB) {
    return -1
  }
  const compareParents = parentA && parentB ? compareFqnHierarchically(parentA, parentB) : 0
  if (compareParents !== 0) {
    return compareParents
  }
  const compareSource = compareFqnHierarchically(a.source, b.source)
  if (compareSource !== 0) {
    return compareSource
  }
  return compareFqnHierarchically(a.target, b.target)
}
