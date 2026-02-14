import { isFunction } from 'remeda';
import { invariant } from '../../utils/invariant';
export function imap(arg1, arg2) {
    const mapper = (arg2 ?? arg1);
    invariant(isFunction(mapper));
    function* _map(iter) {
        for (const value of iter) {
            yield mapper(value);
        }
        return;
    }
    if (!arg2) {
        return _map;
    }
    return _map(arg1);
}
