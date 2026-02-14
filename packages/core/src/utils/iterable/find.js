import { isFunction } from 'remeda';
import { invariant } from '../../utils/invariant';
export function ifind(arg1, arg2) {
    const pred = (arg2 ?? arg1);
    invariant(isFunction(pred));
    function _find(iter) {
        for (const value of iter) {
            if (pred(value)) {
                return value;
            }
        }
        return;
    }
    if (!arg2) {
        return _find;
    }
    return _find(arg1);
}
