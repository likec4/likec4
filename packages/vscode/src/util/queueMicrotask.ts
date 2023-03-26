export const queueMicrotask = (cb: () => void) => void Promise.resolve().then(cb)
