export function isIterable(something) {
    return something != null && typeof something === 'object' && Symbol.iterator in something;
}
