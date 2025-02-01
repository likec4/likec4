import { Disposable } from 'langium'
import { logError } from '../logger'

export abstract class ADisposable implements Disposable {
  protected toDispose: Disposable[] = []
  protected isDisposed = false

  onDispose(...disposable: Disposable[]): void {
    this.toDispose.push(...disposable)
  }

  dispose(): void {
    this.throwIfDisposed()
    this.isDisposed = true
    let item: Disposable | undefined
    while (item = this.toDispose.pop()) {
      try {
        item.dispose()
      } catch (e) {
        logError(e)
      }
    }
  }

  protected throwIfDisposed(): void {
    if (this.isDisposed) {
      throw new Error('This has already been disposed')
    }
  }
}
