import { describe, expect, it } from 'vitest'
import { ifirst } from './first'

describe('ifirst', () => {
  it('should take first N elements in data-first style', () => {
    const input = [1, 2, 3, 4, 5]
    const result = [...ifirst(input, 3)]
    expect(result).toEqual([1, 2, 3])
  })

  it('should take first N elements in composition style', () => {
    const input = [1, 2, 3, 4, 5]
    const result = [...ifirst(3)(input)]
    expect(result).toEqual([1, 2, 3])
  })

  it('should work with Set', () => {
    const input = new Set([1, 2, 3, 4, 5])
    const result = [...ifirst(input, 2)]
    expect(result).toEqual([1, 2])
  })

  it('should handle empty iterables', () => {
    const input: number[] = []
    const result = [...ifirst(input, 3)]
    expect(result).toEqual([])
  })

  it('should handle count larger than iterable length', () => {
    const input = [1, 2, 3]
    const result = [...ifirst(input, 10)]
    expect(result).toEqual([1, 2, 3])
  })

  it('should handle zero count', () => {
    const input = [1, 2, 3, 4, 5]
    const result = [...ifirst(input, 0)]
    expect(result).toEqual([])
  })

  it('should work with strings', () => {
    const input = 'hello'
    const result = [...ifirst(input, 3)]
    expect(result).toEqual(['h', 'e', 'l'])
  })

  it('should work with generators', () => {
    function* numbers() {
      yield 1
      yield 2
      yield 3
      yield 4
      yield 5
    }
    const result = [...ifirst(numbers(), 3)]
    expect(result).toEqual([1, 2, 3])
  })
})
