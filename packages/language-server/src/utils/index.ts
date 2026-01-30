import prettyMs from 'pretty-ms'
import { logger } from '../logger'
export * from './disposable'
export * from './elementRef'
export * from './fqnRef'
export * from './projectId'
export * from './stringHash'

export function safeCall<T>(fn: () => T): T | undefined {
  try {
    return fn()
  } catch (e) {
    logger.trace(`Safe call failed`, { error: e })
    return undefined
  }
}

export function performanceNow() {
  try {
    return globalThis.performance.now()
  } catch {
    return Date.now()
  }
}

export function performanceMark() {
  const t0 = performanceNow()
  return {
    get ms(): number {
      return performanceNow() - t0
    },
    get pretty(): string {
      return prettyMs(performanceNow() - t0)
    },
  }
}
