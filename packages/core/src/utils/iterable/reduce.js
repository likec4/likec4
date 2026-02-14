import { isDefined, isFunction } from 'remeda';
import { invariant } from '../../utils/invariant';
export function ireduce(arg1, arg2, arg3) {
    const reducer = (isDefined(arg3) ? arg2 : arg1);
    const initialValue = arg3 ?? arg2;
    invariant(isFunction(reducer));
    function _reduce(iter) {
        let acc = initialValue;
        for (const value of iter) {
            acc = reducer(acc, value);
        }
        return acc;
    }
    return isDefined(arg3) ? _reduce(arg1) : _reduce;
}
