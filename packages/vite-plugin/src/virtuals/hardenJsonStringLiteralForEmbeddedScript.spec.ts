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
})
