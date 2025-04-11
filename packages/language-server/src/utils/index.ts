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
    logger.debug(`Safe call failed`, { error: e })
    return undefined
  }
}
