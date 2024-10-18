import { type AstNode, interruptAndCheck, type ValidationAcceptor, type ValidationCheck } from 'langium'
import type { CancellationToken } from 'vscode-jsonrpc'
import { logWarnError } from '../logger'

export const RESERVED_WORDS = [
  'this',
  'it',
  'self',
  'super',
  'likec4lib',
  'global'
]

export function tryOrLog<T extends AstNode>(fn: ValidationCheck<T>): ValidationCheck<T> {
  return async (node: T, accept: ValidationAcceptor, cancelToken: CancellationToken) => {
    if (cancelToken) {
      await interruptAndCheck(cancelToken)
    }
    try {
      await fn(node, accept, cancelToken)
    } catch (e) {
      logWarnError(e)
    }
  }
}
