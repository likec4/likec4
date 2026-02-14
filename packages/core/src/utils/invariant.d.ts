export declare function nonNullable<T>(value: T, message?: string | (() => string)): NonNullable<T>;
export declare function invariant(condition: any, message?: string): asserts condition;
export declare function nonexhaustive(value: never): never;
