import { randomInteger } from 'remeda'

const DELAY = 'LIKEC4_DELAY'

export function delay(): Promise<string>
export function delay(ms: number): Promise<string>
export function delay(randomFrom: number, randomTo: number): Promise<string>
export function delay(...args: number[]): Promise<string> {
  let ms = 100
  if (args.length === 2) {
    ms = randomInteger(args[0]!, args[1]!)
  } else if (args.length === 1) {
    ms = args[0]!
  }
  return new Promise(resolve => {
    setTimeout(() => {
      resolve(DELAY)
    }, ms ?? 100)
  })
}

export function promiseNextTick(): Promise<void> {
  return Promise.resolve().then(() => void 0)
}

export function onNextTick(fn: () => Promise<void> | void): void {
  void Promise.resolve().then(fn)
}
