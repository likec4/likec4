export function getOrCreate(map, key, create) {
    let entry = map.get(key);
    if (!entry) {
        entry = create(key);
        map.set(key, entry);
    }
    return entry;
}
