import { omitBy } from 'remeda';
/**
 * Allows only exact properties of `U` to be present in `T` and omits undefined values
 *
 * See {@link Exact} for more details (this version is non-deep)
 */
export function exact(a) {
    return omitBy(a, v => v === undefined);
}
