import { describe, expect, it } from 'vitest'
import { ifind } from './find'

describe('ifind', () => {
  const numbers = [1, 2, 3, 4, 5]
  const isEven = (n: number) => n % 2 === 0

  it('should find first match - data first version', () => {
    expect(ifind(numbers, isEven)).toBe(2)
  })

  it('should find first match - composable version', () => {
    expect(ifind(isEven)(numbers)).toBe(2)
  })

  it('should return undefined for empty iterable', () => {
    expect(ifind([], isEven)).toBeUndefined()
    expect(ifind(isEven)([])).toBeUndefined()
  })

  it('should return undefined when no match found', () => {
    const odds = [1, 3, 5]
    expect(ifind(odds, isEven)).toBeUndefined()
  })

  it('should return first match when multiple matches exist', () => {
    const multipleEvens = [1, 2, 4, 6]
    expect(ifind(multipleEvens, isEven)).toBe(2)
  })

  it('should work with Set', () => {
    const numberSet = new Set(numbers)
    expect(ifind(numberSet, isEven)).toBe(2)
  })
})
