import { isFunction } from 'remeda';
import { invariant } from '../../utils/invariant';
export function ifilter(arg1, arg2) {
    const pred = (arg2 ?? arg1);
    invariant(isFunction(pred));
    function* _filter(iter) {
        for (const value of iter) {
            if (pred(value)) {
                yield value;
            }
        }
        return;
    }
    if (!arg2) {
        return _filter;
    }
    return _filter(arg1);
}
