import { prop } from 'remeda'
import type { OverrideProperties } from 'type-fest'
import { expectTypeOf, test } from 'vitest'
import { type GuardedBy, hasProp, isAnyOf, isString } from './guards'

test('hasProp', () => {
  const obj = { a: 'a' } as {
    a: string | undefined | null
    // optional properties
    b?: number | null
  }
  // Data first
  if (hasProp(obj, 'a')) {
    expectTypeOf(obj.a).toEqualTypeOf<string>()
  }
  // Curried
  if (hasProp('a')(obj)) {
    expectTypeOf(obj.a).toEqualTypeOf<string>()
  }
  expectTypeOf(obj.a).toEqualTypeOf<string | undefined | null>()

  // Test with optional property
  if (hasProp(obj, 'b')) {
    expectTypeOf(obj.b).toEqualTypeOf<number>()
  }
  // Curried
  if (hasProp('b')(obj)) {
    expectTypeOf(obj.b).toEqualTypeOf<number>()
  }
  expectTypeOf(obj.b).toEqualTypeOf<number | undefined | null>()
})

test('guardedTo', () => {
  const isStringGuard = (value: unknown): value is string => true
  const isNumberGuard = (value: unknown): value is number => true
  const isPropGuard = (value: unknown): value is { prop: number } => true
  const isAnyGuard = (value: unknown): value is any => true
  const isUnknownGuard = (value: unknown): value is unknown => true

  expectTypeOf<GuardedBy<typeof isStringGuard>>().toEqualTypeOf<string>()
  expectTypeOf<GuardedBy<typeof isNumberGuard>>().toEqualTypeOf<number>()
  expectTypeOf<GuardedBy<typeof isPropGuard>>().toEqualTypeOf<{ prop: number }>()
  expectTypeOf<GuardedBy<typeof isAnyGuard>>().toBeNever()
  expectTypeOf<GuardedBy<typeof isUnknownGuard>>().toBeNever()
})

test('isAnyOf', () => {
  // Type guards for testing
  const isNumber = (value: unknown): value is number => typeof value === 'number'
  const isBoolean = (value: string | number | boolean): value is boolean => typeof value === 'boolean'
  const isObject = (value: any): value is object => typeof value === 'object' && value !== null

  // Test with single predicate
  const checkString = isAnyOf(isString)
  expectTypeOf(checkString).guards.toBeString()

  // Test with multiple predicates - should return union type
  const checkStringOrNumber = isAnyOf(isString, isNumber)
  expectTypeOf(checkStringOrNumber).guards.toEqualTypeOf<string | number>()

  // Test with three predicates
  const checkStringOrNumberOrBoolean = isAnyOf(isString, isNumber, isBoolean)
  expectTypeOf(checkStringOrNumberOrBoolean).guards.toEqualTypeOf<string | number | boolean>()

  // Test type narrowing behavior
  const unknownValue = 0 as unknown

  expectTypeOf(unknownValue).toBeUnknown()

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
  expectTypeOf(checkStringOrObject).guards.toEqualTypeOf<string | object>()

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
