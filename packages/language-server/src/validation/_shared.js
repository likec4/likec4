import { isPromise } from 'remeda';
import { logger } from '../logger';
export const RESERVED_WORDS = [
    'this',
    'it',
    'self',
    'super',
    'likec4lib',
    'global',
];
export function tryOrLog(fn) {
    return async function tryOrLogFn(node, accept, cancelToken) {
        try {
            const result = fn(node, accept, cancelToken);
            if (isPromise(result)) {
                await result;
            }
            return;
        }
        catch (e) {
            const message = e instanceof Error ? e.message : String(e);
            accept('error', `Validation failed: ${message}`, { node });
            logger.debug(`Validation failed: ${message}`, { error: e });
        }
    };
}
