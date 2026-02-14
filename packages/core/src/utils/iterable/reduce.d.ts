export declare function ireduce<T, R>(reducer: (acc: R, item: T) => R, initialValue: R): (iterable: Iterable<T>) => R;
export declare function ireduce<T, R>(iterable: Iterable<T>, reducer: (acc: R, item: T) => R, initialValue: R): R;
