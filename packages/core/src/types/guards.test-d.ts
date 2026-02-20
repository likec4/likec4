import { expectTypeOf, test } from 'vitest'
import { hasProp, isAnyOf, isString } from './guards'

test('hasProp', () => {
  const obj = { a: 'a' } as {
    a: string | undefined | null
    // optional properties
    b?: number | null
  }
  expectTypeOf(obj.a).toEqualTypeOf<string | undefined | null>()
  if (hasProp(obj, 'a')) {
    expectTypeOf(obj.a).toEqualTypeOf<string>()
  }

  expectTypeOf(obj.b).toEqualTypeOf<number | undefined | null>()
  if (hasProp(obj, 'b')) {
    expectTypeOf(obj.b).toEqualTypeOf<number>()
  }

  if (hasProp('b')(obj)) {
    expectTypeOf(obj.b).toEqualTypeOf<number>()
  }
})

test('isAnyOf', () => {
  // Type guards for testing
  const isNumber = (value: unknown): value is number => typeof value === 'number'
  const isBoolean = (value: unknown): value is boolean => typeof value === 'boolean'
  const isObject = (value: unknown): value is object => typeof value === 'object' && value !== null

  // Test with single predicate
  const checkString = isAnyOf(isString)
  expectTypeOf(checkString).toEqualTypeOf<<T>(value: T) => value is T & string>()

  // Test with multiple predicates - should return union type
  const checkStringOrNumber = isAnyOf(isString, isNumber)
  expectTypeOf(checkStringOrNumber).toEqualTypeOf<<T>(value: T) => value is T & (string | number)>()

  // Test with three predicates
  const checkStringOrNumberOrBoolean = isAnyOf(isString, isNumber, isBoolean)
  expectTypeOf(checkStringOrNumberOrBoolean).toEqualTypeOf<<T>(value: T) => value is T & (string | number | boolean)>()

  // Test type narrowing behavior
  const unknownValue: unknown = undefined

  if (checkString(unknownValue)) {
    expectTypeOf(unknownValue).toEqualTypeOf<string>()
  }

  if (checkStringOrNumber(unknownValue)) {
    expectTypeOf(unknownValue).toEqualTypeOf<string | number>()
  }

  if (checkStringOrNumberOrBoolean(unknownValue)) {
    expectTypeOf(unknownValue).toEqualTypeOf<string | number | boolean>()
  }

  // Test with more complex types
  const checkStringOrObject = isAnyOf(isString, isObject)
  expectTypeOf(checkStringOrObject).toEqualTypeOf<<T>(value: T) => value is T & (string | object)>()

  if (checkStringOrObject(unknownValue)) {
    expectTypeOf(unknownValue).toEqualTypeOf<string | object>()
  }

  // Test that the predicates array must be non-empty (should be compile-time enforced)
  // This should cause a type error if uncommented:
  // @ts-expect-error
  const empty = isAnyOf()

  // Test that predicates must be type guards
  const notAGuard = (value: unknown): boolean => value !== null
  // @ts-expect-error
  const invalid = isAnyOf(notAGuard)
})
