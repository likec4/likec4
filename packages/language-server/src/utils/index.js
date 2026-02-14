import prettyMs from 'pretty-ms';
import { logger } from '../logger';
export * from './disposable';
export * from './elementRef';
export * from './fqnRef';
export * from './projectId';
export * from './stringHash';
export function safeCall(fn) {
    try {
        return fn();
    }
    catch (e) {
        logger.trace(`Safe call failed`, { error: e });
        return undefined;
    }
}
export function performanceNow() {
    try {
        return globalThis.performance.now();
    }
    catch {
        return Date.now();
    }
}
export function performanceMark() {
    const t0 = performanceNow();
    return {
        get ms() {
            return performanceNow() - t0;
        },
        get pretty() {
            return prettyMs(performanceNow() - t0);
        },
    };
}
