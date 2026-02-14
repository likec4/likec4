export declare function getOrCreate<K, V>(map: Map<K, V>, key: K, create: (key: K) => V): V;
export declare function getOrCreate<K extends WeakKey, V>(map: WeakMap<K, V>, key: K, create: (key: K) => V): V;
