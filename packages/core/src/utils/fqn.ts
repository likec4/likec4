import { anyPass } from 'remeda'
import type { Fqn } from '../types'
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

export function nameFromFqn<E extends string>(fqn: E): string {
  const lastDot = fqn.lastIndexOf('.')
  if (lastDot > 0) {
    return fqn.slice(lastDot + 1)
  } else {
    return fqn
  }
}

const asString: <E extends string | { id: string }>(e: E) => string = e => (isString(e) ? e : e.id)

/**
 * Check if one element is an ancestor of another
 * @signature
 *   isAncestor(ancestor, another)
 */
export function isAncestor<A extends string | { id: string }>(ancestor: A, another: A): boolean
/**
 * Check if one element is an ancestor of another
 * Composable version
 * @signature
 *  isAncestor(another)(ancestor)
 */
export function isAncestor<A extends string | { id: string }>(another: NoInfer<A>): (ancestor: A) => boolean

export function isAncestor<E extends string | { id: string }>(
  arg1: E,
  arg2?: NoInfer<E>,
) {
  const arg1Id = asString(arg1)
  if (arg2) {
    const arg2Id = asString(arg2)
    return arg2Id.startsWith(arg1Id + '.')
  }
  return (ancestor: E) => {
    const ancestorId = asString(ancestor)
    return arg1Id.startsWith(ancestorId + '.')
  }
}

export function isSameHierarchy<E extends string | { id: Fqn }>(one: E, another: E): boolean {
  const first = asString(one)
  const second = asString(another)
  return first === second || second.startsWith(first + '.') || first.startsWith(second + '.')
}

export function isDescendantOf<E extends string | { id: Fqn }>(ancestors: E[]): (e: E) => boolean {
  const predicates = ancestors.map(a => {
    const ancestorPrefix = asString(a) + '.'
    return (e: E) => asString(e).startsWith(ancestorPrefix)
  })
  return anyPass(predicates)
}

export function notDescendantOf<E extends string | { id: Fqn }>(ancestors: E[]): (e: E) => boolean {
  const ancestorIds = ancestors.map(asString)
  const isDescendant = isDescendantOf(ancestors)
  return (e) => !isDescendant(e) && !ancestorIds.includes(asString(e))
}

/**
 * How deep in the hierarchy the element is.
 * Root element has depth 1
 */
export function hierarchyLevel<E extends string | { id: Fqn }>(elementOfFqn: E): number {
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
export function hierarchyDistance<E extends string | { id: Fqn }>(one: E, another: E): number {
  const first = isString(one) ? one as Fqn : one.id
  const second = isString(another) ? another as Fqn : another.id

  if (first === second) {
    return 0
  }

  const firstDepth = hierarchyLevel(first)
  const secondDepth = hierarchyLevel(second)

  if (isSameHierarchy(first, second)) {
    return Math.abs(firstDepth - secondDepth)
  }

  const ancestor = commonAncestor(first as Fqn, second as Fqn)
  const ancestorDepth = ancestor ? hierarchyLevel(ancestor) : 0

  return firstDepth + secondDepth - (2 * ancestorDepth + 1)
}

export function commonAncestor<E extends string>(first: E, second: E): E | null {
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

export function compareByFqnHierarchically<T extends { id: string }>(a: T, b: T): -1 | 0 | 1 {
  return compareFqnHierarchically(a.id, b.id)
}

export type IterableContainer<T = unknown> = ReadonlyArray<T> | readonly []
export type ReorderedArray<T extends IterableContainer> = {
  -readonly [P in keyof T]: T[number]
}

/**
 * Sorts an array of objects hierarchically based on their fully qualified names (FQN).
 * Objects are sorted by the number of segments in their FQN (defined by dot-separated ID).
 *
 * @typeParam T - Object type that contains an 'id' string property
 * @typeParam A - Type extending IterableContainer of T
 *
 * @param array - Array of objects to be sorted
 * @returns A new array with items sorted by their FQN hierarchy depth (number of segments)
 *
 * @example
 * ```ts
 * const items = [
 *   { id: "a.b.c" },
 *   { id: "a" },
 *   { id: "a.b" }
 * ];
 * sortByFqnHierarchically(items);
 * // Result: [
 * //   { id: "a" },
 * //   { id: "a.b" },
 * //   { id: "a.b.c" }
 * // ]
 * ```
 */
export function sortByFqnHierarchically<T extends { id: string }, A extends IterableContainer<T>>(
  array: A,
): ReorderedArray<A> {
  return array
    .map(item => ({ item, fqn: item.id.split('.') }))
    .sort((a, b) => {
      return a.fqn.length - b.fqn.length
    })
    .map(({ item }) => item) as ReorderedArray<A>
}

function findTopAncestor<T extends { id: string }>(items: T[], item: T): T | null {
  let parent = item
  for (const e of items) {
    if (isAncestor(e, parent)) {
      parent = e
    }
  }
  return parent !== item ? parent : null
}

/**
 * Keeps initial order of the elements, but ensures that parents are before children
 */
export function sortParentsFirst<T extends { id: string }, A extends IterableContainer<T>>(
  array: A,
): ReorderedArray<A> {
  const result = [] as T[]
  const items = [...array]
  let item
  while ((item = items.shift())) {
    let parent
    while ((parent = findTopAncestor(items, item))) {
      result.push(items.splice(items.indexOf(parent), 1)[0]!)
    }
    result.push(item)
  }
  return result as ReorderedArray<A>
}

/**
 * Sorts an array of objects naturally by their fully qualified name (FQN) identifier.
 *
 * @template T - Type of objects containing an 'id' string property
 * @template A - Type extending IterableContainer of T
 *
 * @param first - Optional. Either the array to sort or the sort direction ('asc'|'desc')
 * @param sort - Optional. The sort direction ('asc'|'desc'). Defaults to 'asc' if not specified
 *
 * @example
 * // As a function that returns a sorting function
 * const sorted = sortNaturalByFqn('desc')(myArray);
 *
 * // Direct array sorting
 * const sorted = sortNaturalByFqn(myArray, 'desc');
 */
export function sortNaturalByFqn(
  sort?: 'asc' | 'desc',
): <T extends { id: string }, A extends IterableContainer<T>>(array: A) => ReorderedArray<A>
export function sortNaturalByFqn<T extends { id: string }, A extends IterableContainer<T>>(
  array: A,
  sort?: 'asc' | 'desc',
): ReorderedArray<A>
export function sortNaturalByFqn<T extends { id: string }, A extends IterableContainer<T>>(
  array?: A | 'asc' | 'desc',
  sort?: 'asc' | 'desc',
) {
  if (!array || isString(array)) {
    const dir = array ?? 'asc'
    return (arr: A) => sortNaturalByFqn(arr, dir)
  }
  const dir = sort === 'desc' ? -1 : 1
  return array
    .map(item => ({ item, fqn: item.id.split('.') }))
    .sort((a, b) => {
      if (a.fqn.length !== b.fqn.length) {
        return (a.fqn.length - b.fqn.length) * dir
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
