import { isFunction } from 'remeda';
import { invariant } from '../../utils/invariant';
export function isome(arg1, arg2) {
    const pred = (arg2 ?? arg1);
    invariant(isFunction(pred));
    function _some(iter) {
        for (const value of iter) {
            if (pred(value)) {
                return true;
            }
        }
        return false;
    }
    if (!arg2) {
        return _some;
    }
    return _some(arg1);
}
