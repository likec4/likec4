import Fuse, { type FuseOptionKeyObject } from 'fuse.js'

type FuzzyKey<T> = FuseOptionKeyObject<T> & { name: string }

/**
 * Fuzzy search over `items`, with the same settings as the `search-element` tool of the MCP server:
 * a word still matches with a typo ("chekout" finds "checkout") and it may match any of the `keys`.
 *
 * The index is built once. The returned function takes a search string and gives back the items that
 * match every word of it, in their original order (the callers build a tree from the result).
 */
export function createFuzzySearch<T>(items: readonly T[], keys: FuzzyKey<T>[]) {
  const fuse = new Fuse(items, {
    useExtendedSearch: true,
    ignoreLocation: true,
    threshold: 0.2,
    keys,
  })

  return (search: string): T[] => {
    // Same split as the Fuse tokenizer. It also keeps the operators of the extended search
    // (`!`, `^`, `'`, `=` ...) out of the query: they are what the user types, not what they mean.
    const words = search.match(/[\p{L}\p{M}\p{N}_]+/gu)
    if (!words) {
      return []
    }
    const found = new Set(
      fuse.search({
        $and: words.map(word => ({ $or: keys.map(key => ({ [key.name]: word })) })),
      }).map(result => result.item),
    )
    return items.filter(item => found.has(item))
  }
}
