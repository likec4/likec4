import { commonAncestor, compareFqnHierarchically } from './fqn'

export type RelationshipLike = {
  source: {
    id: string
  }
  target: {
    id: string
  }
}

export type RelationPredicate = (rel: RelationshipLike) => boolean

/**
 * Compares two relations hierarchically.
 * From the most general (implicit) to the most specific (deepest in the tree)
 */
export const compareRelations = <T extends RelationshipLike>(a: T, b: T): number => {
  const parentA = commonAncestor(a.source.id, a.target.id)
  const parentB = commonAncestor(b.source.id, b.target.id)
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
  const compareSource = compareFqnHierarchically(a.source.id, b.source.id)
  if (compareSource !== 0) {
    return compareSource
  }
  return compareFqnHierarchically(a.target.id, b.target.id)
}
