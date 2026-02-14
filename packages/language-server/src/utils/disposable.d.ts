import type { Disposable } from 'langium';
export declare abstract class ADisposable implements Disposable {
    protected toDispose: Disposable[];
    protected isDisposed: boolean;
    onDispose(...disposable: Disposable[]): void;
    dispose(): void;
    protected throwIfDisposed(): void;
}
