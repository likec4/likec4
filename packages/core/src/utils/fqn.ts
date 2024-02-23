import { anyPass } from 'remeda'
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

export function isAncestor<E extends { id: Fqn }>(
  ...args: [ancestor: string, another: string] | [ancestor: E, another: E]
) {
  const ancestor = isString(args[0]) ? args[0] : args[0].id
  const another = isString(args[1]) ? args[1] : args[1].id
  return another.startsWith(ancestor + '.')
}

export function isSameHierarchy<E extends { id: Fqn }>(one: E | Fqn, another: E | Fqn) {
  const first = isString(one) ? one : one.id
  const second = isString(another) ? another : another.id
  return first === second || second.startsWith(first + '.') || first.startsWith(second + '.')
}

export function isDescendantOf<E extends { id: Fqn }>(ancestors: E[]): (e: E) => boolean {
  const predicates = ancestors.flatMap(a => [(e: E) => e.id === a.id, (e: E) => isAncestor(a, e)])
  return anyPass(predicates)
}

export function notDescendantOf(ancestors: Element[]): (e: Element) => boolean {
  const isDescendant = isDescendantOf(ancestors)
  return (e: Element) => !isDescendant(e)
}

export function commonAncestor(first: Fqn, second: Fqn) {
  const parentA = parentFqn(first)
  const parentB = parentFqn(second)
  if (parentA === parentB) {
    return parentA
  }
  if (!parentA || !parentB) {
    return null
  }

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

/**
 * Get all ancestor elements (i.e. parent, parent’s parent, etc.)
 * (from closest to root)
 */
export function ancestorsFqn(fqn: Fqn): Fqn[] {
  const path = fqn.split('.')
  path.pop()
  if (path.length === 0) {
    return []
  }
  return path.reduce((acc, _, idx) => {
    const ancestor = path.slice(0, idx + 1).join('.')
    acc.unshift(ancestor as Fqn)
    return acc
  }, [] as Fqn[])
}

/**
 * Compares two fully qualified names (fqns) hierarchically based on their depth.
 * From parent nodes to leaves
 *
 * @param {string} a - The first fqn to compare.
 * @param {string} b - The second fqn to compare.
 * @returns {number} - 0 if the fqns have the same depth.
 *                    - Positive number if a is deeper than b.
 *                    - Negative number if b is deeper than a.
 */
export function compareFqnHierarchically<T extends string = string>(a: T, b: T): number {
  const depthA = a.split('.').length
  const depthB = b.split('.').length
  switch (true) {
    case depthA > depthB: {
      return 1
    }
    case depthA < depthB: {
      return -1
    }
    default: {
      return 0
    }
  }
}

export function compareByFqnHierarchically<T extends { id: string }>(a: T, b: T) {
  return compareFqnHierarchically(a.id, b.id)
}
