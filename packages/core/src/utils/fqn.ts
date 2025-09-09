import type { Fqn, IterableContainer, ReorderedArray } from '../types'
import { compareNatural } from './compare-natural'
import { isString } from './guards'

export type Predicate<T> = (x: T) => boolean

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
 * Composable version
 * @signature
 *  isAncestor(another)(ancestor)
 */
export function isAncestor<A extends string | { id: string }>(another: NoInfer<A>): (ancestor: A) => boolean
/**
 * Check if one element is an ancestor of another
 * @signature
 *   isAncestor(ancestor, another)
 */
export function isAncestor<A extends string | { id: string }>(ancestor: A, another: A): boolean

export function isAncestor<T extends string>(
  arg1: T | WithId<T>,
  arg2?: NoInfer<T> | WithId<NoInfer<T>>,
) {
  const arg1Id = asString(arg1)
  if (arg2) {
    const arg2Id = asString(arg2)
    return arg2Id.startsWith(arg1Id + '.')
  }
  return (ancestor: T | WithId<T>) => {
    const ancestorId = asString(ancestor)
    return arg1Id.startsWith(ancestorId + '.')
  }
}

export function isSameHierarchy<T extends string>(
  one: NoInfer<T> | WithId<NoInfer<T>>,
): (another: T | WithId<T>) => boolean
export function isSameHierarchy<T extends string>(one: T | WithId<T>, another: T | WithId<T>): boolean
export function isSameHierarchy<T extends string>(one: T | WithId<T>, another?: T | WithId<T>) {
  if (!another) {
    return (b: T | WithId<T>) => isSameHierarchy(one, b)
  }
  const first = asString(one)
  const second = asString(another)
  return first === second || second.startsWith(first + '.') || first.startsWith(second + '.')
}

type WithId<T = string> = { id: T }

export function isDescendantOf<T extends string>(ancestor: WithId<T>): (descedant: WithId<T>) => boolean
export function isDescendantOf<T extends string>(descedant: WithId<T>, ancestor: WithId<T>): boolean
export function isDescendantOf<T extends string>(descedant: WithId<T>, ancestor?: WithId<T>) {
  if (!ancestor) {
    return (d: WithId<T>) => isAncestor(descedant, d)
  }
  return isAncestor(ancestor, descedant)
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
  const a = first.split('.')
  if (a.length < 2) {
    return null
  }
  const b = second.split('.')
  if (b.length < 2) {
    return null
  }
  let ancestor = [] as string[]
  for (let i = 0; i < Math.min(a.length, b.length) - 1 && a[i] === b[i]; i++) {
    ancestor.push(a[i]!)
  }
  if (ancestor.length === 0) {
    return null
  }
  return ancestor.join('.') as E
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
): <I extends WithId<string>, A extends IterableContainer<I>>(array: A) => ReorderedArray<A>
export function sortNaturalByFqn<A extends IterableContainer<WithId>>(
  array: A,
  sort?: 'asc' | 'desc',
): ReorderedArray<A>
export function sortNaturalByFqn<A extends IterableContainer<WithId>>(
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
