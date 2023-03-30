
import { either } from 'rambdax'
import type { Fqn, Relation } from '../types'

export const isBetween = (source: Fqn, target: Fqn = source) => {
  const sourcePrefix = source + '.'
  const targetPrefix = target + '.'
  return (rel: Relation) => {
    return (rel.source + '.').startsWith(sourcePrefix) && (rel.target + '.').startsWith(targetPrefix)
  }
}

export const isAnyBetween = (source: Fqn, target: Fqn) => {
  return either(
    isBetween(source, target),
    isBetween(target, source),
  )
}

export const isIncoming = (target: Fqn) => {
  const targetPrefix = target + '.'
  return (rel: Relation) => {
    return !(rel.source + '.').startsWith(targetPrefix) && (rel.target + '.').startsWith(targetPrefix)
  }
}

export const isOutgoing = (source: Fqn) => {
  const sourcePrefix = source + '.'
  return (rel: Relation) => {
    return (rel.source + '.').startsWith(sourcePrefix) && !(rel.target + '.').startsWith(sourcePrefix)
  }
}


export const isAnyInOut = (source: Fqn) => {
  return either(
    isIncoming(source),
    isOutgoing(source)
  )
}
