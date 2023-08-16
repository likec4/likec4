import { anyPass } from 'remeda'
import type { Fqn } from '../types'
import { compareFqnHierarchically, isAncestor } from './fqn'
import { either } from 'rambdax'

type Relation = {
  source: string
  target: string
}

type RelationPredicate = (rel: Relation) => boolean

export const compareRelations = <T extends { source: string; target: string }>(a: T, b: T) => {
  return (
    compareFqnHierarchically(a.source, b.source) || compareFqnHierarchically(a.target, b.target)
  )
}

const isInside = (parent: Fqn): RelationPredicate => {
  const prefix = parent + '.'
  return (rel: Relation) => {
    return rel.source.startsWith(prefix) && rel.target.startsWith(prefix)
  }
}

const isBetween = (source: Fqn, target: Fqn): RelationPredicate => {
  const sourcePrefix = source + '.'
  const targetPrefix = target + '.'
  return (rel: Relation) => {
    return (
      (rel.source === source || (rel.source + '.').startsWith(sourcePrefix)) &&
      (rel.target === target || (rel.target + '.').startsWith(targetPrefix))
    )
  }
}

const isAnyBetween = (source: Fqn, target: Fqn): RelationPredicate => {
  return anyPass([isBetween(source, target), isBetween(target, source)])
}

const isIncoming = (target: Fqn): RelationPredicate => {
  const targetPrefix = target + '.'
  return (rel: Relation) => {
    return (
      !(rel.source + '.').startsWith(targetPrefix) &&
      (rel.target === target || (rel.target + '.').startsWith(targetPrefix))
    )
  }
}

const isOutgoing = (source: Fqn): RelationPredicate => {
  const sourcePrefix = source + '.'
  return (rel: Relation) => {
    return (
      (rel.source === source || (rel.source + '.').startsWith(sourcePrefix)) &&
      !(rel.target + '.').startsWith(sourcePrefix)
    )
  }
}

const isAnyInOut = (source: Fqn): RelationPredicate => {
  return either(isIncoming(source), isOutgoing(source))
}

const hasRelation = <R extends { source: Fqn; target: Fqn }>(rel: R) => {
  return <E extends { id: Fqn }>(element: E) => {
    return (
      rel.source === element.id ||
      rel.target === element.id ||
      isAncestor(element.id, rel.source) ||
      isAncestor(element.id, rel.target)
    )
  }
}

export const Relations = {
  isInside,
  isBetween,
  isAnyBetween,
  isIncoming,
  isOutgoing,
  isAnyInOut,
  hasRelation
} as const
