import { describe, expect, it } from 'vitest'
import { stepEdgeId, stepEdgePath } from '../scalar'

describe('stepEdgePath', () => {
  it('matches legacy stepEdgeId for single indices', () => {
    expect(stepEdgePath([1])).toBe(stepEdgeId(1))
    expect(stepEdgePath([7])).toBe('step-07')
  })

  it('matches legacy stepEdgeId for parallel numbering', () => {
    expect(stepEdgePath([3, 2])).toBe(stepEdgeId(3, 2))
    expect(stepEdgePath([12, 5])).toBe('step-12.05')
  })

  it('builds hierarchical ids for nested branches', () => {
    expect(stepEdgePath([4, 1, 2])).toBe('step-04.01.02')
    expect(stepEdgePath([5, 2, 3, 1])).toBe('step-05.02.03.01')
  })

  it('supports alphanumeric suffix segments', () => {
    expect(stepEdgePath([6, 2, 'b'])).toBe('step-06.02b')
  })
})
