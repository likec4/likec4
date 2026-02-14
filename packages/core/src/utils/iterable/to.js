export function toArray(iterable) {
    if (iterable) {
        return Array.from(iterable);
    }
    return (it) => Array.from(it);
}
export function toSet(iterable) {
    if (iterable) {
        return new Set(iterable);
    }
    return (it) => new Set(it);
}
