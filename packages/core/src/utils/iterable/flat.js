export function iflat(iterable) {
    return iterable ? _iflat(iterable) : _iflat;
}
function* _iflat(iterable) {
    for (const inner of iterable) {
        yield* inner;
    }
    return;
}
