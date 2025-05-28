export function getOrCreate<K, V>(map: Map<K, V>, key: K, create: (key: K) => V): V {
  let entry = map.get(key)
  if (!entry) {
    entry = create(key)
    map.set(key, entry)
  }
  return entry
}
