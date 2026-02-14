export function ihead(iterable) {
    if (!iterable) {
        return _head;
    }
    return _head(iterable);
}
function _head(iter) {
    const iterator = iter[Symbol.iterator]();
    const { value } = iterator.next();
    return value;
}
