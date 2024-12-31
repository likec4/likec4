// export function getOrCreate<K, V>(map: Map<K, V>): Map<K, V> & {
//   get(key: K, create: (key: K) => V): V
//   get(key: K): V | undefined
// }
// export function getOrCreate<K, V>(map: Map<K, V>, key: K, create: (key: K) => V): V
// export function getOrCreate<K, V>(map: Map<K, V>, key?: K, create?: (key: K) => V) {
export function getOrCreate<K, V>(map: Map<K, V>, key: K, create: (key: K) => V): V {
  let entry = map.get(key)
  if (!entry) {
    entry = create(key)
    map.set(key, entry)
  }
  return entry
}

// export class BetterMap<K, V> extends Map<K, V> {
//   constructor(iterable?: Iterable<readonly [K, V]> | null) {
//     super(iterable)
//   }

//   /**
//    * Returns the element associated with the specified key.
//    * If no element is associated with the specified key, and a create function is provided, a new element will be created and stored.
//    * @example
//    * ```ts
//    * const map = new BetterMap<Fqn, Element>()
//    *
//    * map.get(fqn, () => factory.createElement(fqn))
//    *
//    */
//   override get(key: K, create: (key: K) => V): V
//   override get(key: K): V | undefined
//   override get(key: K, create?: (key: K) => V) {
//     const entry = super.get(key)
//     if (!entry && create) {
//       const newEntry = create(key)
//       this.set(key, newEntry)
//       return newEntry
//     }
//     return entry
//   }
// }
