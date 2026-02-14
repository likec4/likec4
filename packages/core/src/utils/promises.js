import { randomInteger } from 'remeda';
const DELAY = 'LIKEC4_DELAY';
export function delay(...args) {
    let ms = 100;
    if (args.length === 2) {
        ms = randomInteger(args[0], args[1]);
    }
    else if (args.length === 1) {
        ms = args[0];
    }
    return new Promise(resolve => {
        setTimeout(() => {
            resolve(DELAY);
        }, ms ?? 100);
    });
}
export function promiseNextTick() {
    return Promise.resolve().then(() => void 0);
}
export function onNextTick(fn) {
    void Promise.resolve().then(fn);
}
