import { sort as remedaSort } from 'remeda'
import { describe, expect, it } from 'vitest'
import { compareNatural } from './compare-natural'

describe('compareNatural', () => {
  const sort = (array: Array<string | undefined>) => remedaSort(array, compareNatural)

  it('should move undefined to the end', () => {
    expect(
      sort([
        undefined,
        'apple',
        undefined,
        'banana'
      ])
    ).toEqual([
      'apple',
      'banana',
      undefined,
      undefined
    ])
  })

  it('should sort array of strings', () => {
    expect(sort([
      'apple1',
      'apple11',
      'apple2',
      'apple10'
    ])).toEqual([
      'apple1',
      'apple2',
      'apple10',
      'apple11'
    ])
  })
})
