import prettyMs from 'pretty-ms'

export function now() {
  try {
    return performance.now()
  } catch {
    return Date.now()
  }
}

export function performanceMark() {
  const t0 = now()
  return {
    get ms(): number {
      return now() - t0
    },
    get pretty(): string {
      return prettyMs(now() - t0)
    },
  }
}
