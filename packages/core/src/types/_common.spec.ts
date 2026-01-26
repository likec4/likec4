import { describe, it } from 'vitest'
import { exact } from './_common'

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
  })
})
