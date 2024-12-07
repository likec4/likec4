import { type AstNode, type ValidationAcceptor, type ValidationCheck } from 'langium'
import { isPromise } from 'remeda'
import type { CancellationToken } from 'vscode-jsonrpc'
import { logWarnError } from '../logger'

export const RESERVED_WORDS = [
  'this',
  'it',
  'self',
  'super',
  'instance',
  'likec4lib',
  'global'
]

export function tryOrLog<T extends AstNode>(fn: ValidationCheck<T>): ValidationCheck<T> {
  return async (node: T, accept: ValidationAcceptor, cancelToken: CancellationToken) => {
    try {
      const result = fn(node, accept, cancelToken)
      if (isPromise(result)) {
        await result
      }
    } catch (e) {
      logWarnError(e)
    }
  }
}
