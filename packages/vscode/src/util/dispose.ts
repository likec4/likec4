import vscode from 'vscode'
import { logError } from '../logger'
/* eslint-disable @typescript-eslint/no-explicit-any */

// export class MultiDisposeError extends Error {
//   constructor(public readonly errors: any[]) {
//     super(`Encountered errors while disposing of store. Errors: [${errors.join(', ')}]`)
//   }
// }

export function disponsable(callOnDispose: () => void) {
  let isDisposed = false
  return new vscode.Disposable(() => {
    if (isDisposed) return
    try {
      isDisposed = true
      callOnDispose()
    } catch (e) {
      logError(e)
    }
  })
}

export function disposeAll(disposables: vscode.Disposable[]) {
  // const localCopy = Array.from(disposables)
  for (const disposable of disposables) {
    try {
      disposable.dispose()
    } catch (e) {
      logError(e)
    }
  }
  disposables.length = 0
}
