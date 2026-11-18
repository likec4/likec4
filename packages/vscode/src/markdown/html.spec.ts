import { describe, expect, it } from 'vitest'
import { escapeHtml, escapeJsonForScript, jsonForScript } from './html.ts'

describe('html escaping helpers', () => {
  it('escapes script-breaking characters inside JSON strings', () => {
    const payload = jsonForScript({ title: '</script><script>alert(1)&</script>\u2028\u2029' })
    expect(payload).not.toContain('</script>')
    expect(payload).toContain('\\u003c/script\\u003e')
    expect(payload).toContain('\\u0026')
    expect(payload).toContain('\\u2028')
    expect(payload).toContain('\\u2029')
    expect(JSON.parse(payload)).toEqual({ title: '</script><script>alert(1)&</script>\u2028\u2029' })
  })

  it('escapes HTML special characters in attributes and text', () => {
    expect(escapeHtml(`<a href="x" data-k='y'>&</a>`)).toBe(
      '&lt;a href=&quot;x&quot; data-k=&#39;y&#39;&gt;&amp;&lt;/a&gt;',
    )
  })

  it('handles undefined safely in jsonForScript', () => {
    expect(jsonForScript(undefined)).toBe('null')
    expect(escapeJsonForScript('{"a":"<>"}')).toBe('{"a":"\\u003c\\u003e"}')
  })
})
