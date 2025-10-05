export function getOrCreate<K, V>(map: Map<K, V>, key: K, create: (key: K) => V): V
export function getOrCreate<K extends WeakKey, V>(map: WeakMap<K, V>, key: K, create: (key: K) => V): V
export function getOrCreate(map: Map<any, any> | WeakMap<any, any>, key: any, create: (key: any) => any): any {
  let entry = map.get(key)
  if (!entry) {
    entry = create(key)
    map.set(key, entry)
  }
  return entry
}
