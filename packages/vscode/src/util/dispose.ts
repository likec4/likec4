import { Disposable as VSDisposable } from 'vscode'
/* eslint-disable @typescript-eslint/no-explicit-any */

// export class MultiDisposeError extends Error {
//   constructor(public readonly errors: any[]) {
//     super(`Encountered errors while disposing of store. Errors: [${errors.join(', ')}]`)
//   }
// }

export interface Disposable {
  dispose(): any
}

export function disponsable(callOnDispose: () => void) {
  let isDisposed = false
  return VSDisposable.from({
    dispose() {
      if (!isDisposed) {
        isDisposed = true
        Promise.resolve(1)
          .then(() => callOnDispose())
          .catch(e => console.error(e))
      }
    }
  })
}

export async function disposeAll(disposables: Disposable[]) {
  // const localCopy = Array.from(disposables)
  for (const disposable of disposables) {
    try {
      await Promise.resolve(1).then(() => disposable.dispose())
    } catch (e) {
      console.error(e)
    }
  }
}

export abstract class ADisposable implements Disposable {
  private _isDisposed = false

  protected _disposables: Disposable[] = []

  public dispose(): any {
    if (this._isDisposed) {
      return
    }
    this._isDisposed = true
    if (this._disposables.length > 0) {
      void disposeAll([...this._disposables])
    }
    this._disposables = []
  }

  protected _register<T extends Disposable>(value: T): T {
    if (this._isDisposed) {
      value.dispose()
    } else {
      this._disposables.push(value)
    }
    return value
  }

  protected get isDisposed() {
    return this._isDisposed
  }
}
