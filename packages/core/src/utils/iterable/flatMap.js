import { isFunction } from 'remeda';
import { invariant } from '../../utils/invariant';
export function iflatMap(arg1, arg2) {
    const mapper = (arg2 ?? arg1);
    invariant(isFunction(mapper));
    function* _flatMap(iter) {
        for (const value of iter) {
            const mapped = mapper(value);
            yield* mapped;
        }
        return;
    }
    if (!arg2) {
        return _flatMap;
    }
    return _flatMap(arg1);
}
