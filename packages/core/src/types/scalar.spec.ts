import { describe, expect, it } from 'vitest'
import { type MarkdownOrString, flattenMarkdownOrString } from './scalar'

describe('flattenMarkdownOrString', () => {
  describe('with string input', () => {
    it('returns the string when input is a non-empty string', () => {
      expect(flattenMarkdownOrString('Hello world')).toBe('Hello world')
    })

    it('returns null for empty string or whitespace', () => {
      expect(flattenMarkdownOrString('')).toBeNull()
      expect(flattenMarkdownOrString(' ')).toBeNull()
      expect(flattenMarkdownOrString('  \t\n  ')).toBeNull()
    })
  })

  describe('with MarkdownOrString input', () => {
    it('returns the txt property when present', () => {
      const withTxt: MarkdownOrString = { txt: 'Plain text' }
      expect(flattenMarkdownOrString(withTxt)).toBe('Plain text')
    })

    it('returns null when txt is empty or whitespace', () => {
      expect(flattenMarkdownOrString({ txt: '' })).toBeNull()
      expect(flattenMarkdownOrString({ txt: ' ' })).toBeNull()
      expect(flattenMarkdownOrString({ txt: '  \t\n  ' })).toBeNull()
    })

    it('returns the md property when present', () => {
      const withMd: MarkdownOrString = { md: '**Markdown**' }
      expect(flattenMarkdownOrString(withMd)).toBe('**Markdown**')
    })

    it('returns null when md is empty or whitespace', () => {
      expect(flattenMarkdownOrString({ md: '' })).toBeNull()
      expect(flattenMarkdownOrString({ md: ' ' })).toBeNull()
      expect(flattenMarkdownOrString({ md: '  \t\n  ' })).toBeNull()
    })
  })

  describe('with null or undefined input', () => {
    it('returns null for null input', () => {
      const result = flattenMarkdownOrString(null as unknown as string | MarkdownOrString)
      expect(result).toBeNull()
    })

    it('returns null for undefined input', () => {
      const result = flattenMarkdownOrString(undefined as unknown as string | MarkdownOrString)
      expect(result).toBeNull()
    })
  })

  it('returns null for empty or whitespace values', () => {
    // Test with empty string
    expect(flattenMarkdownOrString('')).toBeNull()
    // Test with whitespace string
    expect(flattenMarkdownOrString(' ')).toBeNull()
    // Test with empty MarkdownOrString (invalid case, should be handled by type system)
    const emptyObj = {} as unknown as MarkdownOrString
    expect(flattenMarkdownOrString(emptyObj)).toBeNull()
  })
})

describe('stepEdgePath', () => {
  describe('single index paths', () => {
    it('should format single numeric index with padding', () => {
      expect(stepEdgePath([1])).toBe('step-01')
      expect(stepEdgePath([5])).toBe('step-05')
      expect(stepEdgePath([10])).toBe('step-10')
      expect(stepEdgePath([99])).toBe('step-99')
    })

    it('should handle large single indices', () => {
      expect(stepEdgePath([100])).toBe('step-100')
      expect(stepEdgePath([999])).toBe('step-999')
      expect(stepEdgePath([1234])).toBe('step-1234')
    })

    it('should handle single string numeric index', () => {
      expect(stepEdgePath(['1'])).toBe('step-01')
      expect(stepEdgePath(['42'])).toBe('step-42')
    })

    it('should handle single non-numeric string index', () => {
      expect(stepEdgePath(['abc'])).toBe('step-abc')
      expect(stepEdgePath(['custom'])).toBe('step-custom')
    })
  })

  describe('multi-segment paths', () => {
    it('should format numeric segments with dots', () => {
      expect(stepEdgePath([1, 1])).toBe('step-01.01')
      expect(stepEdgePath([1, 2])).toBe('step-01.02')
      expect(stepEdgePath([5, 3])).toBe('step-05.03')
    })

    it('should handle three-segment paths', () => {
      expect(stepEdgePath([1, 2, 3])).toBe('step-01.02.03')
      expect(stepEdgePath([10, 20, 30])).toBe('step-10.20.30')
    })

    it('should handle deeply nested paths', () => {
      expect(stepEdgePath([1, 2, 3, 4])).toBe('step-01.02.03.04')
      expect(stepEdgePath([1, 2, 3, 4, 5])).toBe('step-01.02.03.04.05')
    })

    it('should pad numeric string segments', () => {
      expect(stepEdgePath([1, '2'])).toBe('step-01.02')
      expect(stepEdgePath(['1', '2'])).toBe('step-01.02')
    })

    it('should handle mixed numeric and non-numeric segments', () => {
      expect(stepEdgePath([1, 'alt'])).toBe('step-01alt')
      expect(stepEdgePath([1, 2, 'retry'])).toBe('step-01.02retry')
    })

    it('should append non-numeric strings without dots', () => {
      expect(stepEdgePath([1, 'success'])).toBe('step-01success')
      expect(stepEdgePath([5, 3, 'fallback'])).toBe('step-05.03fallback')
    })
  })

  describe('edge cases', () => {
    it('should handle zero indices', () => {
      expect(stepEdgePath([0])).toBe('step-00')
      expect(stepEdgePath([1, 0])).toBe('step-01.00')
    })

    it('should handle very large indices', () => {
      expect(stepEdgePath([9999])).toBe('step-9999')
      expect(stepEdgePath([1, 9999])).toBe('step-01.9999')
    })

    it('should handle complex path patterns', () => {
      expect(stepEdgePath([1, 2, 3, 'retry', 4])).toBe('step-01.02.03retry.04')
    })

    it('should preserve string formatting for custom identifiers', () => {
      expect(stepEdgePath([1, 'path-a'])).toBe('step-01path-a')
      expect(stepEdgePath([1, 'success-route'])).toBe('step-01success-route')
    })
  })

  describe('backward compatibility with stepEdgeId', () => {
    it('should produce same output as stepEdgeId for simple cases', () => {
      expect(stepEdgePath([1])).toBe(stepEdgeId(1))
      expect(stepEdgePath([5])).toBe(stepEdgeId(5))
    })

    it('should produce same output for parallel step patterns', () => {
      expect(stepEdgePath([1, 1])).toBe(stepEdgeId(1, 1))
      expect(stepEdgePath([3, 2])).toBe(stepEdgeId(3, 2))
    })
  })

  describe('type safety', () => {
    it('should return StepEdgeId type', () => {
      const id = stepEdgePath([1])
      // Type assertion test - if this compiles, the type is correct
      const _typed: StepEdgeId = id
      expect(id).toBe('step-01')
    })
  })
})

describe('stepEdgeId', () => {
  describe('single parameter', () => {
    it('should create simple step IDs', () => {
      expect(stepEdgeId(1)).toBe('step-01')
      expect(stepEdgeId(5)).toBe('step-05')
      expect(stepEdgeId(10)).toBe('step-10')
    })
  })

  describe('with parallel step parameter', () => {
    it('should create parallel step IDs', () => {
      expect(stepEdgeId(1, 1)).toBe('step-01.01')
      expect(stepEdgeId(1, 2)).toBe('step-01.02')
      expect(stepEdgeId(5, 3)).toBe('step-05.03')
    })

    it('should handle undefined parallel step', () => {
      expect(stepEdgeId(1, undefined)).toBe('step-01')
    })
  })
})