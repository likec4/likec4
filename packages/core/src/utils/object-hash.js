import { hash } from 'ohash';
import { isNonNullish } from 'remeda';
import { invariant } from '../utils/invariant';
export function objectHash(value) {
    invariant(typeof value === 'object' && isNonNullish(value), 'objectHash: value must be an object');
    return hash(value);
}
