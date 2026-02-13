import prettyMs from 'pretty-ms'

/**
 * High-resolution time (performance.now when available, else Date.now).
 * @returns Time in milliseconds
 */
export function now() {
  try {
    return performance.now()
  } catch {
    return Date.now()
  }
}

/**
 * Start a performance mark; returned object has .ms and .pretty for elapsed time.
 * @returns Object with get ms() and get pretty() for elapsed time
 */
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

/**
 * Check if path is a LikeC4 source file (.c4, .likec4, .like-c4).
 * @param path - File path (case-insensitive)
 * @returns True when extension is LikeC4 source
 */
export function isLikeC4Source(path: string) {
  const p = path.toLowerCase()
  return p.endsWith('.c4') || p.endsWith('.likec4') || p.endsWith('.like-c4')
}
