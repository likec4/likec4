import type { TestFunction } from 'vitest';
export declare function likec4(strings: TemplateStringsArray, ...expr: string[]): any;
export declare function valid(strings: TemplateStringsArray, ...expr: string[]): TestFunction;
export declare function invalid(strings: TemplateStringsArray, ...expr: string[]): TestFunction;
export declare function test(name: string): {
    valid: (strings: TemplateStringsArray, ...expr: string[]) => void;
    invalid: (strings: TemplateStringsArray, ...expr: string[]) => void;
};
