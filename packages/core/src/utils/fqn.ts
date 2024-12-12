import type { Element, Fqn } from '../types'
import { compareNatural } from './compare-natural'
import { isString } from './guards'

type Predicate<T> = (x: T) => boolean

export function parentFqn<E extends string>(fqn: E): E | null {
  const lastDot = fqn.lastIndexOf('.')
  if (lastDot > 0) {
    return fqn.slice(0, lastDot) as E
  }
  return null
}

export function parentFqnPredicate<T extends { parent: Fqn | null }>(parent: Fqn): Predicate<T> {
  const prefix = parent + '.'
  return (e: T) => !!e.parent && (e.parent === parent || e.parent.startsWith(prefix))
}

export function nameFromFqn<E extends string>(fqn: E) {
  const lastDot = fqn.lastIndexOf('.')
  if (lastDot > 0) {
    return fqn.slice(lastDot + 1)
  } else {
    return fqn
  }
}

export function isAncestor<E extends { id: string }>(
  ...args: [ancestor: string, another: string] | [ancestor: E, another: E]
) {
  const ancestor = isString(args[0]) ? args[0] : args[0].id
  const another = isString(args[1]) ? args[1] : args[1].id
  return another.startsWith(ancestor + '.')
}

export function isSameHierarchy<E extends string | { id: Fqn }>(one: E, another: E) {
  const first = isString(one) ? one : one.id
  const second = isString(another) ? another : another.id
  return first === second || second.startsWith(first + '.') || first.startsWith(second + '.')
}

export function isDescendantOf<E extends { id: Fqn }>(ancestors: E[]): (e: E) => boolean {
  const predicates = ancestors.flatMap(a => [(e: E) => e.id === a.id, (e: E) => isAncestor(a, e)])
  return (e: E) => predicates.some(p => p(e))
}

export function notDescendantOf(ancestors: Element[]): (e: Element) => boolean {
  const isDescendant = isDescendantOf(ancestors)
  return (e: Element) => !isDescendant(e)
}

/**
 * How deep in the hierarchy the element is.
 * Root element has depth 1
 */
export function hierarchyDepth<E extends string | { id: Fqn }>(elementOfFqn: E): number {
  const first = isString(elementOfFqn) ? elementOfFqn : elementOfFqn.id
  return first.split('.').length
}

/**
 * Calculate the distance as number of steps from one element to another, i.e.
 * going up to the common ancestor, then going down to the other element.
 * Sibling distance is always 1
 *
 * Can be used for hierarchical clustering
 */
export function hierarchyDistance<E extends string | { id: Fqn }>(one: E, another: E) {
  const first = isString(one) ? one as Fqn : one.id
  const second = isString(another) ? another as Fqn : another.id

  if (first === second) {
    return 0
  }

  const firstDepth = hierarchyDepth(first)
  const secondDepth = hierarchyDepth(second)

  if (isSameHierarchy(first, second)) {
    return Math.abs(firstDepth - secondDepth)
  }

  const ancestor = commonAncestor(first as Fqn, second as Fqn)
  const ancestorDepth = ancestor ? hierarchyDepth(ancestor) : 0

  return firstDepth + secondDepth - (2 * ancestorDepth + 1)
}

export function commonAncestor<E extends string>(first: E, second: E) {
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
  let ancestor: E | null = null

  while (a.length > 1 && b.length > 1 && !!a[0] && a[0] === b[0]) {
    ancestor = (ancestor ? `${ancestor}.${a[0]}` : a[0]) as E
    a.shift()
    b.shift()
  }
  return ancestor
}

/**
 * Get all ancestor elements (i.e. parent, parent’s parent, etc.)
 * going up from parent to the root
 */
export function ancestorsFqn<Id extends string>(fqn: Id): Id[] {
  const path = fqn.split('.') as Id[]
  path.pop()
  if (path.length === 0) {
    return []
  }
  return path.reduce((acc, part, idx) => {
    if (idx === 0) {
      acc.push(part)
      return acc
    }
    acc.unshift(`${acc[0]}.${part}` as Id)
    return acc
  }, [] as Id[])
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
export function compareFqnHierarchically<T extends string = string>(a: T, b: T): -1 | 0 | 1 {
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

export type IterableContainer<T = unknown> = ReadonlyArray<T> | readonly []
export type ReorderedArray<T extends IterableContainer> = {
  -readonly [P in keyof T]: T[number]
}

export function sortByFqnHierarchically<T extends { id: string }, A extends IterableContainer<T>>(
  array: A
): ReorderedArray<A> {
  return array
    .map(item => ({ item, fqn: item.id.split('.') }))
    .sort((a, b) => {
      return a.fqn.length - b.fqn.length
    })
    .map(({ item }) => item) as ReorderedArray<A>
}

/**
 * Keeps initial order of the elements, but ensures that parents are before children
 */
export function sortParentsFirst<T extends { id: string }, A extends IterableContainer<T>>(
  array: A
): ReorderedArray<A> {
  const result = [] as T[]
  const items = [...array]
  let item
  while ((item = items.shift())) {
    const itemId = item.id
    let parentIndx
    while ((parentIndx = items.findIndex(parent => isAncestor(parent.id, itemId))) !== -1) {
      result.push(...items.splice(parentIndx, 1))
    }
    result.push(item)
  }
  return result as ReorderedArray<A>
}

export function sortNaturalByFqn<T extends { id: string }, A extends IterableContainer<T>>(
  array: A
): ReorderedArray<A> {
  return array
    .map(item => ({ item, fqn: item.id.split('.') }))
    .sort((a, b) => {
      if (a.fqn.length !== b.fqn.length) {
        return a.fqn.length - b.fqn.length
      }
      for (let i = 0; i < a.fqn.length; i++) {
        const compare = compareNatural(a.fqn[i], b.fqn[i])
        if (compare !== 0) {
          return compare
        }
      }
      return 0
    })
    .map(({ item }) => item) as ReorderedArray<A>
}
