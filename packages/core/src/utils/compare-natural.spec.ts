import { sort as remedaSort } from 'remeda'
import { describe, expect, it } from 'vitest'
import { compareNatural, compareNaturalHierarchically } from './compare-natural'

describe('compareNatural', () => {
  const sort = (array: Array<string | undefined>) => remedaSort(array, compareNatural)

  it('should move undefined to the end', () => {
    expect(
      sort([
        undefined,
        'apple',
        undefined,
        'banana',
      ]),
    ).toEqual([
      'apple',
      'banana',
      undefined,
      undefined,
    ])
  })

  it('should sort array of strings', () => {
    expect(sort([
      'apple1',
      'apple11',
      'apple2',
      'apple10',
    ])).toEqual([
      'apple1',
      'apple2',
      'apple10',
      'apple11',
    ])
  })
})

describe('compareNaturalHierarchically', () => {
  const sortHierarchically = (array: Array<string | undefined>, separator = '.') =>
    remedaSort(array, compareNaturalHierarchically(separator))

  it('should sort strings hierarchically', () => {
    expect(
      sortHierarchically([
        'a.b.c',
        'a',
        'a.b',
        'a.c.c',
      ]),
    ).toEqual([
      'a',
      'a.b',
      'a.b.c',
      'a.c.c',
    ])
  })

  it('should handle custom separators', () => {
    expect(
      sortHierarchically(
        [
          'a/b/c',
          'a',
          'a/b',
          'a/c/c',
        ],
        '/',
      ),
    ).toEqual([
      'a',
      'a/b',
      'a/b/c',
      'a/c/c',
    ])
  })

  it('should handle mixed depths', () => {
    expect(
      sortHierarchically([
        'b',
        'a.b',
        'a',
        'a.b.c',
        'a.a',
      ]),
    ).toEqual([
      'a',
      'b',
      'a.a',
      'a.b',
      'a.b.c',
    ])
  })

  it('should sort numerically within hierarchies', () => {
    expect(
      sortHierarchically([
        'a.2',
        'a.10',
        'a.1',
      ]),
    ).toEqual([
      'a.1',
      'a.2',
      'a.10',
    ])
  })

  it('should handle empty strings', () => {
    expect(
      sortHierarchically([
        'a.b',
        '',
        'a',
        'b',
      ]),
    ).toEqual([
      '',
      'a',
      'b',
      'a.b',
    ])
  })

  it('should handle undefined values', () => {
    expect(
      sortHierarchically([
        'a.b',
        undefined,
        'a',
        'b',
        undefined,
      ]),
    ).toEqual([
      'a',
      'b',
      'a.b',
      undefined,
      undefined,
    ])
  })

  it('should handle equal strings', () => {
    expect(
      sortHierarchically([
        'a',
        'a',
        'a',
      ]),
    ).toEqual([
      'a',
      'a',
      'a',
    ])
  })
})
