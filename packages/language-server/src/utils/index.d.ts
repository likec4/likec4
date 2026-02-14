export * from './disposable';
export * from './elementRef';
export * from './fqnRef';
export * from './projectId';
export * from './stringHash';
export declare function safeCall<T>(fn: () => T): T | undefined;
export declare function performanceNow(): number;
export declare function performanceMark(): {
    readonly ms: number;
    readonly pretty: string;
};
