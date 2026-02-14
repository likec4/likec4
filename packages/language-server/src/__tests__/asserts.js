/* eslint-disable @typescript-eslint/no-non-null-assertion */
import stripIndent from 'strip-indent';
import { test as viTest } from 'vitest';
import { createTestServices } from '../test';
export function likec4(strings, ...expr) {
    const result = [''];
    for (let i = 0; i < strings.length; i++) {
        result.push(strings[i]);
        if (i < expr.length) {
            result.push(expr[i]);
        }
    }
    return stripIndent(result.join(''));
}
export function valid(strings, ...expr) {
    return async ({ expect }) => {
        expect.hasAssertions();
        const { validate } = createTestServices();
        const { diagnostics } = await validate(likec4(strings, ...expr));
        const errors = diagnostics.map(d => d.message).join('\n');
        expect(errors).toEqual('');
    };
}
export function invalid(strings, ...expr) {
    return async ({ expect }) => {
        expect.hasAssertions();
        const { validate } = createTestServices();
        const { diagnostics } = await validate(likec4(strings, ...expr));
        const errors = diagnostics.map(d => d.message).join('\n');
        expect(errors).not.toEqual('');
    };
}
const runValidTest = valid;
const runInvalidTest = invalid;
export function test(name) {
    return {
        valid: (strings, ...expr) => {
            viTest(`valid: ${name}`, runValidTest(strings, ...expr));
        },
        invalid: (strings, ...expr) => {
            viTest(`invalid: ${name}`, runInvalidTest(strings, ...expr));
        },
    };
}
