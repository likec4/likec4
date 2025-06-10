import { commonAncestor, compareFqnHierarchically } from './fqn'

export type RelationshipLike = {
  source: {
    model: string
  }
  target: {
    model: string
  }
}

export type RelationPredicate = (rel: RelationshipLike) => boolean

/**
 * Compares two relations hierarchically.
 * From the most general (implicit) to the most specific.
 */
export const compareRelations = <T extends RelationshipLike>(a: T, b: T): number => {
  const parentA = commonAncestor(a.source.model, a.target.model)
  const parentB = commonAncestor(b.source.model, b.target.model)
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
  const compareSource = compareFqnHierarchically(a.source.model, b.source.model)
  if (compareSource !== 0) {
    return compareSource
  }
  return compareFqnHierarchically(a.target.model, b.target.model)
}
