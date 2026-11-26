import { purry } from 'remeda'
import { isome } from './iterable/some'

type WithId<Id> = {
  readonly id: Id
}
/**
 * Helper function to find an item by its id in an iterable.
 * @example
 * ```ts
 * const items = [{ id: 1 }, { id: 2 }, { id: 3 }];
 * const item = findById(items, 2);
 * // or
 * const item = pipe(items, findById(2))
 * ```
 * @see {@link byId}
 */
export function findById<Id, T extends WithId<Id>>(items: Iterable<T>, id: Id): T | undefined
export function findById<Id>(id: NoInfer<Id>): <T extends WithId<Id>>(items: Iterable<T>) => T | undefined
export function findById(...args: unknown[]) {
  return purry(_findById, args)
}

function _findById<T extends WithId<string>>(
  items: Iterable<T>,
  id: string,
): T | undefined {
  for (const item of items) {
    if (item.id === id) {
      return item
    }
  }
  return undefined
}

/**
 * Helper function to find an item by its id in an iterable.
 *
 * On data-first form it acts as {@link findById}
 * On data-last form it acts as {@link hasId}
 *
 * @example
 * ```ts
 * const items = [{ id: 1 }, { id: 2 }, { id: 3 }];
 * const item = byId(items, 2);
 * // or
 * const item = items.find(byId(2))
 * ```
 * @see {@link findById}
 * @see {@link hasId}
 */
export function byId<Id, T extends WithId<Id>>(items: Iterable<T>, id: Id): T | undefined
export function byId<Id>(id: NoInfer<Id>): (item: WithId<Id>) => boolean
export function byId(...args: [string] | [Iterable<WithId<string>>, string]) {
  if (args.length === 2) {
    return findById(args[0], args[1])
  } else {
    return hasId(args[0])
  }
}

/**
 * Helper function to check if an item has a specific id.
 * @xexample
 * ```ts
 * const item = { id: 1 };
 * const hasId = hasId(item, 1);
 * // or
 * const found = items.find(hasId(1))
 * ```
 */
export function hasId<Id>(item: WithId<Id>, id: Id): boolean
export function hasId<Id>(id: NoInfer<Id>): <T extends WithId<Id>>(item: T) => boolean
export function hasId(...args: [string] | [WithId<string>, string]) {
  if (args.length === 2) {
    return args[0].id === args[1]
  } else {
    const [id] = args as [string]
    return (item: WithId<string>) => item.id === id
  }
}

type WithTags = {
  readonly tags?: Iterable<string> | undefined | null
}
/**
 * Helper function to check if an item has a specific tag. (strict equality)
 * @xexample
 * ```ts
 * const item = { tags: ['tag1', 'tag2'] };
 * const hasTag = hasTag(item, 'tag1');
 * // or
 * const withTag = items.filter(hasTag('tag1'))
 * ```
 */
export function hasTag<T extends WithTags>(
  item: T,
  tag: string,
): item is T & { readonly tags: NonNullable<T['tags']> }
export function hasTag(
  tag: string,
): <T extends WithTags>(item: T) => item is T & { readonly tags: NonNullable<T['tags']> }
export function hasTag(...args: unknown[]) {
  return purry(_hasTag, args)
}

function _hasTag(
  item: { tags: Iterable<string> | undefined | null },
  tag: string,
): boolean {
  if (!item.tags) {
    return false
  }
  return isome(item.tags, (t) => t === tag)
}

/**
 * Helper function to check if an item includes a specific tag (case-insensitive partial match)
 * @xexample
 * ```ts
 * const item = { tags: ['tag1', 'tag2'] };
 * const hasTag = someTagIncludes(item, 'g1');
 * // or
 * const withTag = items.filter(someTagIncludes('g1'))
 * ```
 */
export function someTagIncludes<T extends WithTags>(
  item: T,
  tag: string,
): item is T & { readonly tags: NonNullable<T['tags']> }
export function someTagIncludes(
  tag: string,
): <T extends WithTags>(item: T) => item is T & { readonly tags: NonNullable<T['tags']> }
export function someTagIncludes(...args: [string] | [WithTags, string]) {
  if (args.length === 2) {
    const [item, tag] = args
    return !!item.tags && isome(item.tags, lowerCaseIncludes(tag))
  } else {
    const [tag] = args
    const predicate = lowerCaseIncludes(tag)
    return (item: WithTags) => !!item.tags && isome(item.tags, predicate)
  }
}

function lowerCaseIncludes(tag: string) {
  const lowerCaseTag = tag.toLowerCase()
  return (s: string) => s.toLowerCase().includes(lowerCaseTag)
}
