import { invariant } from '@likec4/core'
import vscode from 'vscode'
import { logError } from '../logger'
/* eslint-disable @typescript-eslint/no-explicit-any */

// export class MultiDisposeError extends Error {
//   constructor(public readonly errors: any[]) {
//     super(`Encountered errors while disposing of store. Errors: [${errors.join(', ')}]`)
//   }
// }

export function disposable(callOnDispose: () => void) {
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

type DisposableLike = vscode.Disposable | (() => void)

export abstract class AbstractDisposable implements vscode.Disposable {
  private _disposables: vscode.Disposable[] = []

  private _isDisposed = false

  protected onDispose<T extends DisposableLike>(...disposables: T[]) {
    invariant(!this._isDisposed, 'Is alredy disposed')
    for (const item of disposables) {
      if ('dispose' in item) {
        this._disposables.push(item)
      } else {
        this._disposables.push(disposable(item))
      }
    }
  }

  public dispose() {
    if (this._isDisposed) return
    this._isDisposed = true
    disposeAll(this._disposables)
    this._disposables.length = 0
  }
}
