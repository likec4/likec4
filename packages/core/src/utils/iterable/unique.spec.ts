import { describe, expect, it } from 'vitest'
import { toArray } from './to'
import { iunique } from './unique'

describe('iunique', () => {
  it('should return unique values from iterable', () => {
    const input = [1, 2, 2, 3, 3, 3]
    const result = toArray(iunique(input))
    expect(result).toEqual([1, 2, 3])
  })

  it('should work with empty iterable', () => {
    const input: number[] = []
    const result = toArray(iunique(input))
    expect(result).toEqual([])
  })

  it('should work as a curried function', () => {
    const uniqueFilter = iunique()
    const input = [1, 1, 2, 2, 3]
    const result = toArray(uniqueFilter(input))
    expect(result).toEqual([1, 2, 3])
  })

  it('should work with strings', () => {
    const input = ['a', 'b', 'b', 'c', 'c', 'c']
    const result = toArray(iunique(input))
    expect(result).toEqual(['a', 'b', 'c'])
  })
})
