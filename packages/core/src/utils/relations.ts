import type { Fqn } from '../types'
import { commonAncestor, compareFqnHierarchically, isAncestor } from './fqn'

type Relation = {
  source: string
  target: string
}

type RelationPredicate = (rel: Relation) => boolean

/**
 * Compares two relations hierarchically.
 * From the most general (implicit) to the most specific.
 */
export const compareRelations = <T extends { source: string; target: string }>(a: T, b: T) => {
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

export const isInside = (parent: Fqn): RelationPredicate => {
  const prefix = parent + '.'
  return (rel: Relation) => {
    return rel.source.startsWith(prefix) && rel.target.startsWith(prefix)
  }
}

export const isBetween = (source: Fqn, target: Fqn): RelationPredicate => {
  const sourcePrefix = source + '.'
  const targetPrefix = target + '.'
  return (rel: Relation) => {
    return (
      (rel.source === source || (rel.source + '.').startsWith(sourcePrefix))
      && (rel.target === target || (rel.target + '.').startsWith(targetPrefix))
    )
  }
}

export const isAnyBetween = (source: Fqn, target: Fqn): RelationPredicate => {
  const predicates = [isBetween(source, target), isBetween(target, source)]
  return (rel) => predicates.some(p => p(rel))
}

export const isIncoming = (target: Fqn): RelationPredicate => {
  const targetPrefix = target + '.'
  return (rel: Relation) => {
    return (
      !(rel.source + '.').startsWith(targetPrefix)
      && (rel.target === target || (rel.target + '.').startsWith(targetPrefix))
    )
  }
}

export const isOutgoing = (source: Fqn): RelationPredicate => {
  const sourcePrefix = source + '.'
  return (rel: Relation) => {
    return (
      (rel.source === source || (rel.source + '.').startsWith(sourcePrefix))
      && !(rel.target + '.').startsWith(sourcePrefix)
    )
  }
}

export const isAnyInOut = (source: Fqn): RelationPredicate => {
  const predicates = [isIncoming(source), isOutgoing(source)]
  return (rel: Relation) => {
    return predicates.some(p => p(rel))
  }
}

export const hasRelation = <R extends { source: Fqn; target: Fqn }>(rel: R) => {
  return <E extends { id: Fqn }>(element: E) => {
    return (
      rel.source === element.id
      || rel.target === element.id
      || isAncestor(element.id, rel.source)
      || isAncestor(element.id, rel.target)
    )
  }
}
