import { expectTypeOf, test } from 'vitest';
import { hasProp, isAnyOf, isString } from './guards';
test('hasProp', () => {
    const obj = { a: 'a' };
    expectTypeOf(obj.a).toEqualTypeOf();
    if (hasProp(obj, 'a')) {
        expectTypeOf(obj.a).toEqualTypeOf();
    }
    expectTypeOf(obj.b).toEqualTypeOf();
    if (hasProp(obj, 'b')) {
        expectTypeOf(obj.b).toEqualTypeOf();
    }
});
test('isAnyOf', () => {
    // Type guards for testing
    const isNumber = (value) => typeof value === 'number';
    const isBoolean = (value) => typeof value === 'boolean';
    const isObject = (value) => typeof value === 'object' && value !== null;
    // Test with single predicate
    const checkString = isAnyOf(isString);
    expectTypeOf(checkString).toEqualTypeOf();
    // Test with multiple predicates - should return union type
    const checkStringOrNumber = isAnyOf(isString, isNumber);
    expectTypeOf(checkStringOrNumber).toEqualTypeOf();
    // Test with three predicates
    const checkStringOrNumberOrBoolean = isAnyOf(isString, isNumber, isBoolean);
    expectTypeOf(checkStringOrNumberOrBoolean).toEqualTypeOf();
    // Test type narrowing behavior
    const unknownValue = undefined;
    if (checkString(unknownValue)) {
        expectTypeOf(unknownValue).toEqualTypeOf();
    }
    if (checkStringOrNumber(unknownValue)) {
        expectTypeOf(unknownValue).toEqualTypeOf();
    }
    if (checkStringOrNumberOrBoolean(unknownValue)) {
        expectTypeOf(unknownValue).toEqualTypeOf();
    }
    // Test with more complex types
    const checkStringOrObject = isAnyOf(isString, isObject);
    expectTypeOf(checkStringOrObject).toEqualTypeOf();
    if (checkStringOrObject(unknownValue)) {
        expectTypeOf(unknownValue).toEqualTypeOf();
    }
    // Test that the predicates array must be non-empty (should be compile-time enforced)
    // This should cause a type error if uncommented:
    // @ts-expect-error
    const empty = isAnyOf();
    // Test that predicates must be type guards
    const notAGuard = (value) => value !== null;
    // @ts-expect-error
    const invalid = isAnyOf(notAGuard);
});
