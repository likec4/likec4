import { either } from 'rambdax'
import type { Fqn, Element } from '../types'
import { compareFqnHierarchically, isAncestor } from './fqn'

type Relation = {
  source: Fqn
  target: Fqn
}

export const compareRelations = <T extends { source: Fqn; target: Fqn }>(a: T, b: T) => {
  return (
    compareFqnHierarchically(a.source, b.source) || compareFqnHierarchically(a.target, b.target)
  )
}

export const isInside = (parent: Fqn) => {
  const prefix = parent + '.'
  return (rel: Relation) => {
    return rel.source.startsWith(prefix) && rel.target.startsWith(prefix)
  }
}

export const isBetween = (source: Fqn, target: Fqn) => {
  const sourcePrefix = source + '.'
  const targetPrefix = target + '.'
  return (rel: Relation) => {
    return (
      (rel.source + '.').startsWith(sourcePrefix) && (rel.target + '.').startsWith(targetPrefix)
    )
  }
}

export const isAnyBetween = (source: Fqn, target: Fqn) => {
  return either(isBetween(source, target), isBetween(target, source))
}

export const isIncoming = (target: Fqn) => {
  const targetPrefix = target + '.'
  return (rel: Relation) => {
    return (
      !(rel.source + '.').startsWith(targetPrefix) && (rel.target + '.').startsWith(targetPrefix)
    )
  }
}

export const isOutgoing = (source: Fqn) => {
  const sourcePrefix = source + '.'
  return (rel: Relation) => {
    return (
      (rel.source + '.').startsWith(sourcePrefix) && !(rel.target + '.').startsWith(sourcePrefix)
    )
  }
}

export const isAnyInOut = (source: Fqn) => {
  return either(isIncoming(source), isOutgoing(source))
}

export const hasRelation = (rel: Relation) => {
  return (element: Element) => {
    return isAncestor(rel.source, element.id) || isAncestor(rel.target, element.id)
  }
}
