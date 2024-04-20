const DELAY = 'LIKEC4_DELAY'

export function delay(ms: number = 100) {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve(DELAY)
    }, ms)
  })
}
