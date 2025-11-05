import { describe, expect, it } from 'vitest'
import { stepEdgeId, stepEdgePath } from '../scalar'

describe('scalar - stepEdgePath', () => {
  describe('single index', () => {
    it('should format a single numeric index with padding', () => {
      expect(stepEdgePath([1])).toBe('step-01')
      expect(stepEdgePath([5])).toBe('step-05')
      expect(stepEdgePath([10])).toBe('step-10')
      expect(stepEdgePath([99])).toBe('step-99')
    })

    it('should handle numbers larger than 99', () => {
      expect(stepEdgePath([100])).toBe('step-100')
      expect(stepEdgePath([999])).toBe('step-999')
    })

    it('should handle string numeric indices', () => {
      expect(stepEdgePath(['1'])).toBe('step-01')
      expect(stepEdgePath(['05'])).toBe('step-05')
      expect(stepEdgePath(['99'])).toBe('step-99')
    })

    it('should preserve non-numeric string indices', () => {
      expect(stepEdgePath(['a'])).toBe('step-a')
      expect(stepEdgePath(['branch'])).toBe('step-branch')
      expect(stepEdgePath(['path1'])).toBe('step-path1')
    })
  })

  describe('multiple indices', () => {
    it('should format multiple numeric indices with dots', () => {
      expect(stepEdgePath([1, 1])).toBe('step-01.01')
      expect(stepEdgePath([1, 2])).toBe('step-01.02')
      expect(stepEdgePath([5, 10])).toBe('step-05.10')
      expect(stepEdgePath([12, 3])).toBe('step-12.03')
    })

    it('should format deeply nested paths', () => {
      expect(stepEdgePath([1, 1, 1])).toBe('step-01.01.01')
      expect(stepEdgePath([2, 3, 4, 5])).toBe('step-02.03.04.05')
      expect(stepEdgePath([10, 20, 30])).toBe('step-10.20.30')
    })

    it('should handle mixed numeric and string indices', () => {
      expect(stepEdgePath([1, 'a'])).toBe('step-01a')
      expect(stepEdgePath([1, 'branch', 2])).toBe('step-01branch.02')
      expect(stepEdgePath([5, '3'])).toBe('step-05.03')
    })

    it('should handle string indices in nested paths', () => {
      expect(stepEdgePath([1, 2, 'alt'])).toBe('step-01.02alt')
      expect(stepEdgePath(['main', 1, 2])).toBe('step-main.01.02')
    })

    it('should not add dots before non-numeric segments', () => {
      expect(stepEdgePath([1, 'suffix'])).toBe('step-01suffix')
      expect(stepEdgePath([2, '-branch'])).toBe('step-02-branch')
    })
  })

  describe('edge cases', () => {
    it('should handle zero', () => {
      expect(stepEdgePath([0])).toBe('step-00')
      expect(stepEdgePath([1, 0])).toBe('step-01.00')
    })

    it('should handle very large numbers', () => {
      expect(stepEdgePath([9999])).toBe('step-9999')
      expect(stepEdgePath([1, 9999])).toBe('step-01.9999')
    })

    it('should handle numeric strings with leading zeros', () => {
      expect(stepEdgePath(['001'])).toBe('step-001')
      expect(stepEdgePath(['0'])).toBe('step-00')
    })

    it('should handle alphanumeric strings', () => {
      expect(stepEdgePath(['path1'])).toBe('step-path1')
      expect(stepEdgePath(['branch2'])).toBe('step-branch2')
      expect(stepEdgePath(['1a'])).toBe('step-1a')
    })

    it('should handle special characters in string indices', () => {
      expect(stepEdgePath(['path-1'])).toBe('step-path-1')
      expect(stepEdgePath(['branch_a'])).toBe('step-branch_a')
    })
  })

  describe('compatibility with stepEdgeId', () => {
    it('should produce same output as stepEdgeId for single step', () => {
      expect(stepEdgePath([1])).toBe(stepEdgeId(1))
      expect(stepEdgePath([5])).toBe(stepEdgeId(5))
      expect(stepEdgePath([99])).toBe(stepEdgeId(99))
    })

    it('should produce same output as stepEdgeId for parallel steps', () => {
      expect(stepEdgePath([1, 1])).toBe(stepEdgeId(1, 1))
      expect(stepEdgePath([5, 3])).toBe(stepEdgeId(5, 3))
      expect(stepEdgePath([12, 7])).toBe(stepEdgeId(12, 7))
    })

    it('should extend beyond stepEdgeId for deeper nesting', () => {
      // stepEdgeId only supports 2 levels, stepEdgePath supports arbitrary depth
      expect(stepEdgePath([1, 2, 3])).toBe('step-01.02.03')
      expect(stepEdgePath([1, 2, 3, 4])).toBe('step-01.02.03.04')
    })
  })

  describe('real-world scenarios', () => {
    it('should handle typical sequential step IDs', () => {
      expect(stepEdgePath([1])).toBe('step-01')
      expect(stepEdgePath([2])).toBe('step-02')
      expect(stepEdgePath([3])).toBe('step-03')
    })

    it('should handle parallel branch paths', () => {
      // Step 1, path 1, substep 1
      expect(stepEdgePath([1, 1, 1])).toBe('step-01.01.01')
      // Step 1, path 2, substep 1
      expect(stepEdgePath([1, 2, 1])).toBe('step-01.02.01')
      // Step 1, path 2, substep 2
      expect(stepEdgePath([1, 2, 2])).toBe('step-01.02.02')
    })

    it('should handle nested branch collections', () => {
      // Root step 2, branch path 1, nested branch path 2, substep 3
      expect(stepEdgePath([2, 1, 2, 3])).toBe('step-02.01.02.03')
    })

    it('should handle legacy parallel step format', () => {
      // Legacy parallel: step 5, parallel substep 2
      expect(stepEdgePath([5, 2])).toBe('step-05.02')
    })
  })

  describe('formatting behavior', () => {
    it('should pad first segment to 2 digits', () => {
      expect(stepEdgePath([1]).startsWith('step-01')).toBe(true)
      expect(stepEdgePath([9]).startsWith('step-09')).toBe(true)
    })

    it('should pad subsequent numeric segments to 2 digits', () => {
      expect(stepEdgePath([1, 1])).toBe('step-01.01')
      expect(stepEdgePath([1, 9])).toBe('step-01.09')
      expect(stepEdgePath([1, 10])).toBe('step-01.10')
    })

    it('should not truncate numbers longer than 2 digits', () => {
      expect(stepEdgePath([100])).toBe('step-100')
      expect(stepEdgePath([1, 100])).toBe('step-01.100')
    })
  })
})