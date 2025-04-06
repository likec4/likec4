import { type AstNode, type ValidationAcceptor, type ValidationCheck } from 'langium'
import { isPromise } from 'remeda'
import type { CancellationToken } from 'vscode-jsonrpc'
import { logger, logWarnError } from '../logger'

export const RESERVED_WORDS = [
  'this',
  'it',
  'self',
  'super',
  'likec4lib',
  'global',
]

export function tryOrLog<T extends AstNode>(fn: ValidationCheck<T>): ValidationCheck<T> {
  return async function tryOrLogFn(node: T, accept: ValidationAcceptor, cancelToken: CancellationToken) {
    try {
      const result = fn(node, accept, cancelToken)
      if (isPromise(result)) {
        await result
      }
      return
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e)
      accept('error', `Validation failed: ${message}`, { node })
      logger.debug(`Validation failed: ${message}`, { error: e })
    }
  }
}
