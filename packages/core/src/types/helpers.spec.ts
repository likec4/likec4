import { describe, it } from 'vitest'
import { exact } from './helpers'

describe('exact', () => {
  it('extract types', ({ expect }) => {
    type A = {
      str?: string
      num?: number | undefined
    }

    const a = {
      str: '1',
      num: 1,
    }

    // Should retain same reference when no changes needed
    expect(exact(a) satisfies A).toBe(a)

    expect(
      exact({
        ...a,
      }) satisfies A,
    ).toEqual(a)

    expect(
      exact({
        ...a,
        num: undefined,
      }) satisfies A,
      'must remove undefined values',
    ).toEqual({
      str: '1',
    })

    expect(
      exact({
        ...a,
        // @ts-expect-error validate that null is not acceptable
        num: null,
      }) satisfies A,
    ).toEqual({
      str: '1',
      num: null,
    })

    // Type validation
    exact({
      ...a,
      // @ts-expect-error should fail for extra properties
      arc: 'any' as any,
    }) satisfies A
  })
})
