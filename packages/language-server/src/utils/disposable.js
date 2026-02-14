import { logWarnError } from '../logger';
export class ADisposable {
    toDispose = [];
    isDisposed = false;
    onDispose(...disposable) {
        this.toDispose.push(...disposable);
    }
    dispose() {
        this.throwIfDisposed();
        this.isDisposed = true;
        let item;
        while ((item = this.toDispose.pop())) {
            try {
                item.dispose();
            }
            catch (e) {
                logWarnError(e);
            }
        }
    }
    throwIfDisposed() {
        if (this.isDisposed) {
            throw new Error('This has already been disposed');
        }
    }
}
