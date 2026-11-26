import type { IteratorLike } from '@likec4/core/types'
import { ifilter } from '@likec4/core/utils'

const NonUnique = Symbol.for('non_unique')
type NonUnique = typeof NonUnique
const isUnique = <V>(value: V | NonUnique): value is V => value !== NonUnique
const isUniqueEntry = <K, V>(value: [K, V | NonUnique]): value is [K, V] => value[1] !== NonUnique

/**
 * A map that only stores unique single values.
 * If a key is set again, the previous value is replaced with the `NonUnique` marker
 * and the key stays non-unique forever (third `set` does not bring it back).
 *
 * Non-unique keys are still tracked:
 * - `has(key)` returns `true` and `size` counts them
 * - `get`, `entries`, `forEach` and the default iterator expose the marker
 *
 * Use `values()`/`uniqueValues()`/`uniqueEntries()` to iterate over unique ones only.
 */
export class UniqueSingleMap<K, V> extends Map<K, V | NonUnique> {
  constructor() {
    super()
  }

  override set(key: K, value: V): this {
    if (this.has(key)) {
      super.set(key, NonUnique)
    } else {
      super.set(key, value)
    }
    return this
  }

  override values(): IteratorLike<V> {
    return ifilter(super.values(), isUnique)
  }

  uniqueValues(): IteratorLike<V> {
    return ifilter(super.values(), isUnique)
  }

  uniqueEntries(): IteratorLike<[K, V]> {
    return ifilter(super.entries(), isUniqueEntry)
  }
}

/**
 * Returns items whose key occurs exactly once (all items sharing a key are dropped),
 * in order of their appearance.
 */
export function uniqueSingles<T>(items: Iterable<T>, key: (item: T) => string): T[] {
  const map = new UniqueSingleMap<string, T>()
  for (const desc of items) {
    map.set(key(desc), desc)
  }
  return Array.from(map.uniqueValues())
}
