export function queueMicrotask(cb: () => void) {
  return void Promise.resolve().then(cb)
}
