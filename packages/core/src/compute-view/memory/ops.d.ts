import type { AnyCtx, ComputeMemory, CtxElement } from './_types';
export declare function treeFromMemoryState<T extends AnyCtx, M extends ComputeMemory<T> = ComputeMemory<T>>(memory: M, filter?: 'all' | 'final'): {
    root: ReadonlySet<CtxElement<T>>;
    connected: ReadonlySet<CtxElement<T>>;
    hasInOut: (el: CtxElement<T>) => boolean;
    parent: (el: CtxElement<T>) => any;
    children: (el: CtxElement<T>) => any;
};
