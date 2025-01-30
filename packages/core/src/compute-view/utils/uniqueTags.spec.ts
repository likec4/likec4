import { describe, expect, it } from 'vitest'
import { uniqueTags } from './uniqueTags'

describe('uniqueTags function', () => {
  it('returns unique tags from an array of elements', () => {
    const input = [
      { tags: ['tag1', 'tag2', 'tag3'] },
      { tags: ['tag2', 'tag3', 'tag4'] },
      { tags: ['tag3', 'tag4', 'tag5'] },
    ] as const
    const result = uniqueTags(input)
    expect(result).toEqual(['tag1', 'tag2', 'tag3', 'tag4', 'tag5'])
  })

  it('should return unique tags naturally sorted', () => {
    const input = [
      { tags: ['tag1', 'tag20', 'tag30'] },
      { tags: ['tag2', 'tag23', 'tag34'] },
      { tags: ['tag3'] },
    ] as const
    const result = uniqueTags(input)
    expect(result).toEqual([
      'tag1',
      'tag2',
      'tag3',
      'tag20',
      'tag23',
      'tag30',
      'tag34',
    ])
    // ].sort(compareNatural))
  })

  it('returns null if the tags array is null', () => {
    const input = [
      { tags: null },
      {},
    ]
    const result = uniqueTags(input)
    expect(result).toBeNull()
  })
})
