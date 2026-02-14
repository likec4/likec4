export function iunique(iterable) {
    return iterable ? _iunique(iterable) : _iunique;
}
function* _iunique(iterable) {
    const seen = new Set();
    for (const item of iterable) {
        if (!seen.has(item)) {
            seen.add(item);
            yield item;
        }
    }
    return;
}
