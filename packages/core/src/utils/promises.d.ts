export declare function delay(): Promise<string>;
export declare function delay(ms: number): Promise<string>;
export declare function delay(randomFrom: number, randomTo: number): Promise<string>;
export declare function promiseNextTick(): Promise<void>;
export declare function onNextTick(fn: () => Promise<void> | void): void;
