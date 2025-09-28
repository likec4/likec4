import { expectTypeOf, test } from 'vitest'
import { hasProp } from './guards'

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
})
