import { describe, expect, it } from 'vitest'
import type { NonEmptyArray } from '../_common'
import { stepEdgeId, stepEdgePath } from '../scalar'

describe('stepEdgePath', () => {
  describe('single index', () => {
    it('should format single numeric index', () => {
      expect(stepEdgePath([1])).toBe('step-01')
      expect(stepEdgePath([5])).toBe('step-05')
      expect(stepEdgePath([10])).toBe('step-10')
      expect(stepEdgePath([99])).toBe('step-99')
    })

    it('should format single string numeric index', () => {
      expect(stepEdgePath(['1'])).toBe('step-01')
      expect(stepEdgePath(['5'])).toBe('step-05')
      expect(stepEdgePath(['10'])).toBe('step-10')
    })

    it('should handle non-numeric string index', () => {
      expect(stepEdgePath(['a'])).toBe('step-a')
      expect(stepEdgePath(['foo'])).toBe('step-foo')
      expect(stepEdgePath(['test-id'])).toBe('step-test-id')
    })

    it('should handle large numbers', () => {
      expect(stepEdgePath([100])).toBe('step-100')
      expect(stepEdgePath([999])).toBe('step-999')
      expect(stepEdgePath([1000])).toBe('step-1000')
    })

    it('should pad numbers less than 10', () => {
      expect(stepEdgePath([0])).toBe('step-00')
      expect(stepEdgePath([1])).toBe('step-01')
      expect(stepEdgePath([9])).toBe('step-09')
    })
  })

  describe('multiple indices', () => {
    it('should format two numeric indices', () => {
      expect(stepEdgePath([1, 1])).toBe('step-01.01')
      expect(stepEdgePath([5, 3])).toBe('step-05.03')
      expect(stepEdgePath([10, 20])).toBe('step-10.20')
    })

    it('should format three numeric indices', () => {
      expect(stepEdgePath([1, 2, 3])).toBe('step-01.02.03')
      expect(stepEdgePath([5, 10, 15])).toBe('step-05.10.15')
    })

    it('should format deeply nested indices', () => {
      expect(stepEdgePath([1, 2, 3, 4, 5])).toBe('step-01.02.03.04.05')
    })

    it('should handle mixed numeric and string indices', () => {
      expect(stepEdgePath([1, 'a'])).toBe('step-01a')
      expect(stepEdgePath([1, 2, 'branch'])).toBe('step-01.02branch')
    })

    it('should handle string numeric indices', () => {
      expect(stepEdgePath(['1', '2'])).toBe('step-01.02')
      expect(stepEdgePath(['10', '20'])).toBe('step-10.20')
    })

    it('should handle non-numeric strings in tail', () => {
      expect(stepEdgePath([1, 'alternate'])).toBe('step-01alternate')
      expect(stepEdgePath([5, 3, 'path-a'])).toBe('step-05.03path-a')
    })
  })

  describe('edge cases', () => {
    it('should handle zero indices', () => {
      expect(stepEdgePath([0])).toBe('step-00')
      expect(stepEdgePath([0, 0])).toBe('step-00.00')
    })

    it('should handle large index paths', () => {
      const longPath: NonEmptyArray<number> = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
      expect(stepEdgePath(longPath)).toBe('step-01.02.03.04.05.06.07.08.09.10')
    })

    it('should handle alphanumeric strings', () => {
      expect(stepEdgePath(['step1'])).toBe('step-step1')
      expect(stepEdgePath(['1a'])).toBe('step-1a')
    })

    it('should handle special characters in strings', () => {
      expect(stepEdgePath(['path-1'])).toBe('step-path-1')
      expect(stepEdgePath(['alt_branch'])).toBe('step-alt_branch')
    })
  })

  describe('padding behavior', () => {
    it('should pad first segment if numeric', () => {
      expect(stepEdgePath([1])).toBe('step-01')
      expect(stepEdgePath([9])).toBe('step-09')
    })

    it('should pad subsequent numeric segments', () => {
      expect(stepEdgePath([1, 2])).toBe('step-01.02')
      expect(stepEdgePath([10, 5])).toBe('step-10.05')
    })

    it('should not pad three-digit numbers', () => {
      expect(stepEdgePath([100])).toBe('step-100')
      expect(stepEdgePath([1, 100])).toBe('step-01.100')
    })

    it('should not pad non-numeric strings', () => {
      expect(stepEdgePath(['a'])).toBe('step-a')
      expect(stepEdgePath([1, 'b'])).toBe('step-01b')
    })
  })
})

describe('stepEdgeId', () => {
  describe('single step', () => {
    it('should create ID for single step', () => {
      expect(stepEdgeId(1)).toBe('step-01')
      expect(stepEdgeId(5)).toBe('step-05')
      expect(stepEdgeId(10)).toBe('step-10')
    })

    it('should handle large step numbers', () => {
      expect(stepEdgeId(100)).toBe('step-100')
      expect(stepEdgeId(999)).toBe('step-999')
    })

    it('should pad single digit steps', () => {
      expect(stepEdgeId(0)).toBe('step-00')
      expect(stepEdgeId(9)).toBe('step-09')
    })
  })

  describe('parallel steps', () => {
    it('should create ID for parallel steps', () => {
      expect(stepEdgeId(1, 1)).toBe('step-01.01')
      expect(stepEdgeId(5, 3)).toBe('step-05.03')
      expect(stepEdgeId(10, 20)).toBe('step-10.20')
    })

    it('should handle zero as parallel step', () => {
      expect(stepEdgeId(1, 0)).toBe('step-01.00')
      expect(stepEdgeId(0, 0)).toBe('step-00.00')
    })

    it('should pad both components', () => {
      expect(stepEdgeId(1, 2)).toBe('step-01.02')
      expect(stepEdgeId(9, 9)).toBe('step-09.09')
    })
  })

  describe('undefined parallel step', () => {
    it('should treat undefined as single step', () => {
      expect(stepEdgeId(5, undefined)).toBe('step-05')
    })

    it('should differentiate from explicit zero', () => {
      expect(stepEdgeId(5)).not.toBe(stepEdgeId(5, 0))
      expect(stepEdgeId(5)).toBe('step-05')
      expect(stepEdgeId(5, 0)).toBe('step-05.00')
    })
  })

  describe('consistency with stepEdgePath', () => {
    it('should produce same result as stepEdgePath for single step', () => {
      expect(stepEdgeId(1)).toBe(stepEdgePath([1]))
      expect(stepEdgeId(10)).toBe(stepEdgePath([10]))
    })

    it('should produce same result as stepEdgePath for parallel steps', () => {
      expect(stepEdgeId(1, 2)).toBe(stepEdgePath([1, 2]))
      expect(stepEdgeId(10, 20)).toBe(stepEdgePath([10, 20]))
    })
  })

  describe('edge cases', () => {
    it('should handle maximum safe integer', () => {
      const maxSafe = Number.MAX_SAFE_INTEGER
      expect(stepEdgeId(maxSafe)).toContain('step-')
    })

    it('should handle zero values', () => {
      expect(stepEdgeId(0)).toBe('step-00')
      expect(stepEdgeId(0, 0)).toBe('step-00.00')
    })
  })
})