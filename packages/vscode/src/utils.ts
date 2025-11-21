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

export function isLikeC4Source(path: string) {
  const p = path.toLowerCase()
  return p.endsWith('.c4') || p.endsWith('.likec4') || p.endsWith('.like-c4')
}
