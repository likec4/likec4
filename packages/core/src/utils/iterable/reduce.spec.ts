import { describe, expect, it } from 'vitest'
import { ireduce } from './reduce'

describe('ireduce', () => {
  it('works in curry mode', () => {
    const sum = ireduce((acc: number, x: number) => acc + x, 0)
    expect(sum([1, 2, 3])).toBe(6)
  })

  it('works in direct mode', () => {
    const result = ireduce([1, 2, 3], (acc: number, x: number) => acc + x, 0)
    expect(result).toBe(6)
  })

  it('works with strings', () => {
    const concat = ireduce((acc: string, x: string) => acc + x, '')
    expect(concat(['a', 'b', 'c'])).toBe('abc')
  })

  it('works with empty iterables', () => {
    const sum = ireduce((acc: number, x: number) => acc + x, 0)
    expect(sum([])).toBe(0)
  })

  it('throws if reducer is not a function', () => {
    expect(() => ireduce(42 as any, 0)).toThrow()
  })
})
