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
