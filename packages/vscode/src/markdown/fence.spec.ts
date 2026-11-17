import { describe, expect, it } from 'vitest'
import { DEFAULT_OPTIONS, isLikeC4Fence, NAME_RE, parseFenceOptions, parseViewId } from './fence.ts'

describe('isLikeC4Fence', () => {
  it('matches backtick likec4-view fences with optional whitespace/options', () => {
    expect(isLikeC4Fence('likec4-view')).toBe(true)
    expect(isLikeC4Fence('  likec4-view browser=false ')).toBe(true)
    expect(isLikeC4Fence('likec4-view\tdynamic-variant=sequence', '````')).toBe(true)
  })

  it('rejects tilde fences and unrelated language tags', () => {
    expect(isLikeC4Fence('likec4-view', '~~~')).toBe(false)
    expect(isLikeC4Fence('likec4-view2')).toBe(false)
    expect(isLikeC4Fence('likec4')).toBe(false)
    expect(isLikeC4Fence('mermaid')).toBe(false)
  })
})

describe('parseFenceOptions', () => {
  it('returns default options when none are provided', () => {
    expect(parseFenceOptions('likec4-view')).toEqual(DEFAULT_OPTIONS)
    expect(parseFenceOptions('likec4-view', 'dark')).toEqual({ ...DEFAULT_OPTIONS, scheme: 'dark' })
  })

  it('parses all mkdocs-likec4 options with first-match-wins semantics', () => {
    expect(
      parseFenceOptions(
        'likec4-view project=shop browser=false dynamic-variant=sequence color-scheme=dark project=other',
      ),
    ).toEqual({
      browser: false,
      variant: 'sequence',
      project: 'shop',
      scheme: 'dark',
    })
  })

  it('ignores invalid or wrong-cased values', () => {
    expect(
      parseFenceOptions('likec4-view browser=TRUE dynamic-variant=seq color-scheme=sepia unknown=1'),
    ).toEqual(DEFAULT_OPTIONS)
  })
})

describe('parseViewId', () => {
  it('extracts trimmed single-line view ids', () => {
    expect(parseViewId('  landscape  \n')).toEqual({ ok: true, viewId: 'landscape' })
    expect(parseViewId('index\r\n')).toEqual({ ok: true, viewId: 'index' })
  })

  it('rejects empty and multi-line blocks', () => {
    expect(parseViewId('\n').ok).toBe(false)
    expect(parseViewId('   ').ok).toBe(false)
    expect(parseViewId('index\nsecond\n').ok).toBe(false)
  })

  it('validates view and project identifier syntax', () => {
    expect(NAME_RE.test('cloud_view-1')).toBe(true)
    expect(NAME_RE.test('1invalid')).toBe(false)
    expect(NAME_RE.test('bad.id')).toBe(false)
    expect(NAME_RE.test('bad/id')).toBe(false)
  })
})
