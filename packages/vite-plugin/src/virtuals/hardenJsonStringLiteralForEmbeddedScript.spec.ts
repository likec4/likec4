import { describe, expect, it } from 'vitest'
import { hardenJsonStringLiteralForEmbeddedScript } from './hardenJsonStringLiteralForEmbeddedScript'

describe('hardenJsonStringLiteralForEmbeddedScript', () => {
  it('leaves literals unchanged when no script-breakout chars', () => {
    expect(hardenJsonStringLiteralForEmbeddedScript(JSON.stringify('likec4:icons'))).toBe(
      JSON.stringify('likec4:icons'),
    )
  })

  it('escapes slashes in URLs (joinURL) while remaining a valid JSON string literal', () => {
    const raw = JSON.stringify('likec4/icons/foo')
    const out = hardenJsonStringLiteralForEmbeddedScript(raw)
    expect(out).toContain('\\u002F')
    expect(JSON.parse(out)).toBe('likec4/icons/foo')
  })

  it('neutralises angle brackets and slash for script context', () => {
    const raw = JSON.stringify('a<b/c>')
    const out = hardenJsonStringLiteralForEmbeddedScript(raw)
    expect(out).not.toContain('<')
    expect(out).not.toContain('>')
    expect(out).toContain('\\u003C')
    expect(out).toContain('\\u003E')
    expect(out).toContain('\\u002F')
  })

  it('does not break JSON.stringify backslash escapes', () => {
    const raw = JSON.stringify('a\\b')
    expect(hardenJsonStringLiteralForEmbeddedScript(raw)).toBe(raw)
  })

  it('escapes line separator characters', () => {
    const raw = JSON.stringify('x\u2028y\u2029z')
    const out = hardenJsonStringLiteralForEmbeddedScript(raw)
    expect(out).toMatch(/\\u2028/)
    expect(out).toMatch(/\\u2029/)
  })

  it('rejects non-string input', () => {
    expect(() => hardenJsonStringLiteralForEmbeddedScript(1 as unknown as string)).toThrowError(
      /hardenJsonStringLiteralForEmbeddedScript: expected JSON\.stringify\(\.\.\.\) output as a string/,
    )
  })

  it('rejects strings that are not JSON.stringify-shaped output', () => {
    expect(() => hardenJsonStringLiteralForEmbeddedScript('not-a-json-literal')).toThrowError(
      /hardenJsonStringLiteralForEmbeddedScript: expected JSON\.stringify/,
    )
  })

  it('rejects malformed strings that start like JSON but are not valid', () => {
    for (const bad of ['"x";alert(1)//', '"abc', '"abc\\', '{"broken": ', '[1,']) {
      expect(() => hardenJsonStringLiteralForEmbeddedScript(bad)).toThrowError(
        /hardenJsonStringLiteralForEmbeddedScript: expected JSON\.stringify/,
      )
    }
  })

  it('accepts JSON.stringify of object and array roots', () => {
    const obj = JSON.stringify({ a: 1 })
    expect(hardenJsonStringLiteralForEmbeddedScript(obj)).toBe(obj)
    const arr = JSON.stringify([1, 2])
    expect(hardenJsonStringLiteralForEmbeddedScript(arr)).toBe(arr)
  })

  it('accepts JSON primitive roots', () => {
    expect(() => hardenJsonStringLiteralForEmbeddedScript(JSON.stringify(true))).not.toThrow()
    expect(() => hardenJsonStringLiteralForEmbeddedScript(JSON.stringify(null))).not.toThrow()
    expect(() => hardenJsonStringLiteralForEmbeddedScript(JSON.stringify(42))).not.toThrow()
    expect(() => hardenJsonStringLiteralForEmbeddedScript(JSON.stringify(-1.5e2))).not.toThrow()
  })
})
