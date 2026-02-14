import { invariant } from '../../utils/invariant';
export function ifirst(arg1, arg2) {
    const count = (arg2 ?? arg1);
    invariant(typeof count === 'number' && count >= 0, 'Count must be a non-negative number');
    function* _first(iter) {
        let taken = 0;
        for (const value of iter) {
            if (taken >= count) {
                break;
            }
            yield value;
            taken++;
        }
        return;
    }
    if (arg2 === undefined) {
        // Composable version: ifirst(count)(iterable)
        return (iterable) => _first(iterable);
    }
    // Data-first version: ifirst(iterable, count)
    return _first(arg1);
}
