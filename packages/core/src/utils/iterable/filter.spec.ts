import { describe, expect, it } from 'vitest'
import { ifilter } from './filter'

describe('ifilter', () => {
  it('should filter values in data-first style', () => {
    const input = [1, 2, 3, 4, 5]
    const isOdd = (n: number) => n % 2 === 1
    const result = [...ifilter(input, isOdd)]
    expect(result).toEqual([1, 3, 5])
  })

  it('should filter values in composition style', () => {
    const input = [1, 2, 3, 4, 5]
    const isEven = (n: number) => n % 2 === 0
    const result = [...ifilter(isEven)(input)]
    expect(result).toEqual([2, 4])
  })

  it('should work with Set', () => {
    const input = new Set([1, 2, 3, 4, 5])
    const isOdd = (n: number) => n % 2 === 1
    const result = [...ifilter(input, isOdd)]
    expect(result).toEqual([1, 3, 5])
  })

  it('should handle empty iterables', () => {
    const input: number[] = []
    const isOdd = (n: number) => n % 2 === 1
    const result = [...ifilter(input, isOdd)]
    expect(result).toEqual([])
  })

  it('should work with type predicates', () => {
    const input = [1, 'a', 2, 'b', 3]
    const isNumber = (x: unknown): x is number => typeof x === 'number'
    const result = ifilter(input, isNumber)
    expect(result).to.have.members([1, 2, 3])
  })
})
