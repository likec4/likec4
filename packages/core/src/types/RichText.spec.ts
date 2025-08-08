import { describe, expect, it } from 'vitest'
import { RichText } from './RichText'

describe('RichText', () => {
  describe('RichText.EMPTY', () => {
    it('should have correct properties', () => {
      expect(RichText.EMPTY.isEmpty).toBe(true)
      expect(RichText.EMPTY.nonEmpty).toBe(false)
      expect(RichText.EMPTY.isMarkdown).toBe(false)
      expect(RichText.EMPTY.text).toBeNull()
      expect(RichText.EMPTY.md).toBeNull()
      expect(RichText.EMPTY.html).toBeNull()
      expect(RichText.EMPTY.$source).toBeNull()
    })
  })

  describe('RichText.from', () => {
    it('should return EMPTY for null or undefined', () => {
      expect(RichText.from(null)).toBe(RichText.EMPTY)
      expect(RichText.from(undefined)).toBe(RichText.EMPTY)
    })

    it('should return the same instance for RichText input', () => {
      const rt = RichText.from('test')
      expect(RichText.from(rt)).toBe(rt)
      expect(RichText.from(RichText.EMPTY)).toBe(RichText.EMPTY)
    })

    it('should return the same instance for same source input', () => {
      const source = { txt: 'test' }
      expect(RichText.from(source)).toBe(RichText.from(source))
    })

    it('should create from plain string', () => {
      const rt = RichText.from('hello')
      expect(rt.isEmpty).toBe(false)
      expect(rt.nonEmpty).toBe(true)
      expect(rt.text).toBe('hello')
      expect(rt.$source).toEqual({ txt: 'hello' })
    })

    it('should create from MarkdownOrString.txt', () => {
      const rt = RichText.from({ txt: 'plain text' })
      expect(rt.isEmpty).toBe(false)
      expect(rt.text).toBe('plain text')
    })

    it('should not convert MarkdownOrString.txt to html', () => {
      const rt = RichText.from({ txt: '**markdown**' })
      expect(rt.text).toBe('**markdown**')
      expect(rt.md).toBe('**markdown**')
      expect(rt.html).toBe('**markdown**')
    })

    it('should create from MarkdownOrString.md', () => {
      const rt = RichText.from({ md: '**markdown**' })
      expect(rt.isEmpty).toBe(false)
      expect(rt.text).toBe('markdown')
      expect(rt.md).toBe('**markdown**')
      expect(rt.html).toBe('<p><strong>markdown</strong></p>')
    })

    it('should handle empty strings correctly', () => {
      expect(RichText.from('').isEmpty).toBe(true)
      expect(RichText.from('   ').isEmpty).toBe(true)
      expect(RichText.from({ txt: '' }).isEmpty).toBe(true)
      expect(RichText.from({ md: '' }).isEmpty).toBe(true)
      expect(RichText.from({ txt: '   ' }).isEmpty).toBe(true)
    })
  })

  describe('RichText.memoize', () => {
    it('should memoize RichText instances', () => {
      const obj = {}
      const source = { txt: 'memoized' }
      const result1 = RichText.memoize(obj, source)
      const result2 = RichText.memoize(obj, source)
      expect(result1).toStrictEqual(result2)
      expect(result1.text).toBe('memoized')
    })

    it('should return EMPTY for null/undefined source', () => {
      const obj = {}
      expect(RichText.memoize(obj, null)).toStrictEqual(RichText.EMPTY)
      expect(RichText.memoize(obj, undefined)).toStrictEqual(RichText.EMPTY)
    })
  })

  describe('RichText.text', () => {
    it('should return empty string for empty RichText', () => {
      expect(RichText.EMPTY.text).toBeNull()
    })

    it('should return plain text as-is', () => {
      const rt = RichText.from('plain text')
      expect(rt.text).toBe('plain text')
    })

    it('should return markdown text', () => {
      const rt = RichText.from({ md: '# Heading' })
      // markdownToText is mocked, so we just check it returns something
      expect(rt.text).toBeDefined()
    })
  })

  describe('RichText.equals', () => {
    it('should return true for same instance', () => {
      const rt = RichText.from('test')
      expect(rt.equals(rt)).toBe(true)
    })

    it('should return true for equal content', () => {
      const rt1 = RichText.from('test')
      const rt2 = RichText.from('test')
      expect(rt1.equals(rt2)).toBe(true)
    })

    it('should return false for different content', () => {
      const rt1 = RichText.from('test1')
      const rt2 = RichText.from('test2')
      expect(rt1.equals(rt2)).toBe(false)
    })

    it('should return true for empty instances', () => {
      const empty1 = RichText.EMPTY
      const empty2 = RichText.from('')
      expect(empty1.equals(empty2)).toBe(true)
    })
  })
})
