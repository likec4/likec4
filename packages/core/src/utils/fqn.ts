import type { Element, Fqn } from '../types'
import { isString } from './guards'

export function nameFromFqn(fqn: Fqn) {
  const lastDot = fqn.lastIndexOf('.')
  if (lastDot > 0) {
    return fqn.slice(lastDot + 1)
  } else {
    return fqn
  }
}

export function isAncestor(...args: [ancestor: Fqn, another: Fqn] | [ancestor: Element, another: Element]) {
  const ancestor = isString(args[0]) ? args[0] : args[0].id
  const another = isString(args[1]) ? args[1] : args[1].id
  return another.startsWith(ancestor + '.')
}

export function isSameHierarchy(...args: [one: Fqn, another: Fqn] | [one: Element, another: Element]) {
  const one = isString(args[0]) ? args[0] : args[0].id
  const another = isString(args[1]) ? args[1] : args[1].id
  return one === another || another.startsWith(one + '.') || one.startsWith(another + '.')
}

export function commonAncestor(first: Fqn, second: Fqn) {
  const a = first.split('.')
  const b = second.split('.')
  let ancestor: Fqn | null = null

  while (a.length > 1 && b.length > 1 && !!a[0] && a[0] === b[0]) {
    ancestor = (ancestor ? `${ancestor}.${a[0]}` : a[0]) as Fqn
    a.shift()
    b.shift()
  }
  return ancestor
}

export function parentFqn(fqn: Fqn): Fqn | null {
  const lastDot = fqn.lastIndexOf('.')
  if (lastDot > 0) {
    return fqn.substring(0, lastDot) as Fqn
  }
  return null
}

export const compareFqnHierarchically = (a: string, b: string) => {
  const depthA = a.split('.').length
  const depthB = b.split('.').length
  if (depthA === depthB) {
    return a.localeCompare(b)
  } else {
    return depthA - depthB
  }
}

export const compareByFqnHierarchically = <T extends {id: Fqn}>(a: T, b: T) => {
  return compareFqnHierarchically(a.id, b.id)
}
