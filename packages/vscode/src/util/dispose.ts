import { Disposable as VSDisposable } from 'vscode'
/* eslint-disable @typescript-eslint/no-explicit-any */

export class MultiDisposeError extends Error {
  constructor(public readonly errors: any[]) {
    super(`Encountered errors while disposing of store. Errors: [${errors.join(', ')}]`)
  }
}

export interface Disposable {
  dispose(): any
}

export function disponsable(callOnDispose: () => void) {
  let isDisposed = false
  return VSDisposable.from({
    dispose() {
      if (!isDisposed) {
        isDisposed = true
        callOnDispose()
      }
    }
  })
}

export function disposeAll(disposables: Iterable<Disposable>) {
  const errors: any[] = []
  const localCopy = Array.from(disposables)
  for (const disposable of localCopy) {
    try {
      void disposable.dispose()
    } catch (e) {
      errors.push(e)
    }
  }

  if (errors.length === 1) {
    throw errors[0]
  } else if (errors.length > 1) {
    throw new MultiDisposeError(errors)
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
    disposeAll(this._disposables)
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
