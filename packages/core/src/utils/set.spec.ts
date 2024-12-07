import { map } from 'remeda'
import { describe, expect, it } from 'vitest'
import { difference, equals, intersection, symmetricDifference, union } from './set'

const [
  a1,
  a2,
  a3,
  a4,
  a5,
  a6,
  a7,
  a8
] = map([1, 2, 3, 4, 5, 6, 7, 8], (value) => ({ value }))

describe('Set Utility Functions', () => {
  describe('union', () => {
    it('should return the union of multiple sets and keep order', () => {
      const setA = new Set([a1, a3, a5])
      const setB = new Set([a3, a2, a4])
      const setC = new Set([a5, a6, a7])
      const result = [...union(setA, setB, setC)]
      expect(result).toEqual([a1, a3, a5, a2, a4, a6, a7])
    })
  })

  describe('intersection', () => {
    it('should return the intersection of multiple sets, and keep order from first', () => {
      const setA = new Set([a1, a2, a3, a5])
      const setB = new Set([a2, a5, a3])
      const setC = new Set([a3, a4, a5])
      const result = [...intersection(setA, setB, setC)]
      expect(result).toEqual([
        a3,
        a5
      ])
    })
  })

  describe('difference', () => {
    it('should return the difference of two sets', () => {
      const setA = new Set([a1, a2, a3, a4])
      const setB = new Set([a1, a5, a3])
      const result = [...difference(setA, setB)]
      expect(result).toEqual([
        a2,
        a4
      ])
    })
  })

  describe('equals', () => {
    it('should return true if two sets are equal', () => {
      const setA = new Set([a1, a2, a3])
      const setB = new Set([a1, a2, a3])
      const result = equals(setA, setB)
      expect(result).toBe(true)
    })

    it('should return false if two sets are not equal', () => {
      const setA = new Set([a1, a2, a3])
      const setB = new Set([a1, a2, a4])
      const result = equals(setA, setB)
      expect(result).toBe(false)
    })
  })

  describe('symmetricDifference', () => {
    it('should return the symmetric difference of two sets', () => {
      const setA = new Set([a1, a2, a3])
      const setB = new Set([a2, a3, a4, a5])
      const result = symmetricDifference(setA, setB)
      expect(result).toEqual(new Set([a1, a4, a5]))
    })
  })
})
