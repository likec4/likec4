import { describe, expect, it } from 'vitest'
import { extractRefs } from './extract-refs'

/**
 * Returns refs with sliced ranges, to verify offsets
 */
function refs(md: string) {
  return extractRefs(md).map(ref => ({
    kind: ref.kind,
    namespace: ref.namespace,
    target: ref.target,
    label: ref.label,
    source: md.slice(ref.range.start, ref.range.end),
    targetSource: md.slice(ref.targetRange.start, ref.targetRange.end),
  }))
}

/**
 * Returns sources of found refs
 */
function sources(md: string) {
  return refs(md).map(ref => ref.source)
}

describe('extractRefs', () => {
  it('returns empty array if there are no refs', () => {
    expect(extractRefs('')).toEqual([])
    expect(extractRefs('plain text')).toEqual([])
    expect(extractRefs('[link](https://example.com) and [x]')).toEqual([])
  })

  it('extracts plain ref', () => {
    const md = 'Calls [[cloud.backend.api]] to get data'
    expect(extractRefs(md)).toEqual([
      {
        kind: 'element',
        namespace: null,
        target: 'cloud.backend.api',
        label: null,
        range: { start: 6, end: 27 },
        targetRange: { start: 8, end: 25 },
      },
    ])
    expect(refs(md)).toEqual([
      {
        kind: 'element',
        namespace: null,
        target: 'cloud.backend.api',
        label: null,
        source: '[[cloud.backend.api]]',
        targetSource: 'cloud.backend.api',
      },
    ])
  })

  it('extracts ref at the start and at the end', () => {
    expect(sources('[[a]]')).toEqual(['[[a]]'])
    expect(sources('[[a]] text [[b]]')).toEqual(['[[a]]', '[[b]]'])
  })

  it('extracts ref with label', () => {
    const md = 'See [[cloud.api|Public API]].'
    expect(refs(md)).toEqual([
      {
        kind: 'element',
        namespace: null,
        target: 'cloud.api',
        label: 'Public API',
        source: '[[cloud.api|Public API]]',
        targetSource: 'cloud.api',
      },
    ])
  })

  it('trims label and decodes escapes and entities in label', () => {
    expect(refs('[[a|  spaced label  ]]')[0]).toMatchObject({ label: 'spaced label' })
    expect(refs('[[a|1 \\* 2 \\] 3]]')[0]).toMatchObject({ label: '1 * 2 ] 3', source: '[[a|1 \\* 2 \\] 3]]' })
    expect(refs('[[a|Q&amp;A]]')[0]).toMatchObject({ label: 'Q&A' })
    expect(refs('[[a|**bold**]]')[0]).toMatchObject({ label: '**bold**' })
  })

  it('treats empty label as no label', () => {
    expect(refs('[[a|]]')).toEqual([
      { kind: 'element', namespace: null, target: 'a', label: null, source: '[[a|]]', targetSource: 'a' },
    ])
    expect(refs('[[a|   ]]')).toMatchObject([{ target: 'a', label: null, source: '[[a|   ]]' }])
  })

  it('extracts view ref', () => {
    expect(refs('Open [[view:index]] or [[view:index|landscape]]')).toEqual([
      {
        kind: 'view',
        namespace: 'view',
        target: 'index',
        label: null,
        source: '[[view:index]]',
        targetSource: 'index',
      },
      {
        kind: 'view',
        namespace: 'view',
        target: 'index',
        label: 'landscape',
        source: '[[view:index|landscape]]',
        targetSource: 'index',
      },
    ])
  })

  it('extracts ref with unknown namespace', () => {
    expect(refs('[[deployment:prod.eu]] [[a:b:c]]')).toEqual([
      {
        kind: 'unknown',
        namespace: 'deployment',
        target: 'prod.eu',
        label: null,
        source: '[[deployment:prod.eu]]',
        targetSource: 'prod.eu',
      },
      {
        kind: 'unknown',
        namespace: 'a',
        target: 'b:c',
        label: null,
        source: '[[a:b:c]]',
        targetSource: 'b:c',
      },
    ])
  })

  it('namespace is case-sensitive', () => {
    expect(refs('[[View:index]]')).toMatchObject([{ kind: 'unknown', namespace: 'View', target: 'index' }])
  })

  it('extracts several refs in one paragraph', () => {
    const md = 'From [[a.b]] to [[c.d|D]],\nthen [[view:v1]] and [[e]].'
    expect(refs(md).map(r => [r.source, r.targetSource])).toEqual([
      ['[[a.b]]', 'a.b'],
      ['[[c.d|D]]', 'c.d'],
      ['[[view:v1]]', 'v1'],
      ['[[e]]', 'e'],
    ])
  })

  it('extracts refs adjacent to each other and to punctuation', () => {
    expect(sources('[[a]][[b]]')).toEqual(['[[a]]', '[[b]]'])
    expect(sources('([[a]]), "[[b]]".')).toEqual(['[[a]]', '[[b]]'])
    expect(sources('[[a]]]')).toEqual(['[[a]]'])
    expect(sources('[[[a]]]')).toEqual(['[[a]]'])
  })

  it('extracts refs across Markdown blocks and formatting', () => {
    const md = [
      '# Heading [[h.one]]',
      '',
      '- item [[li.one]]',
      '  - nested **[[li.two]]**',
      '1. ordered _[[li.three|Three]]_',
      '',
      '> quote',
      '> with [[q.one]]',
      '',
      '***[[strong.em]]*** ~~[[deleted]]~~',
    ].join('\n')
    expect(refs(md).map(r => [r.source, r.targetSource])).toEqual([
      ['[[h.one]]', 'h.one'],
      ['[[li.one]]', 'li.one'],
      ['[[li.two]]', 'li.two'],
      ['[[li.three|Three]]', 'li.three'],
      ['[[q.one]]', 'q.one'],
      ['[[strong.em]]', 'strong.em'],
      ['[[deleted]]', 'deleted'],
    ])
  })

  it('extracts refs with CRLF line endings', () => {
    const md = 'line one\r\n> [[a.b]]\r\n> next [[c|C]]\r\n'
    expect(refs(md).map(r => [r.source, r.targetSource])).toEqual([
      ['[[a.b]]', 'a.b'],
      ['[[c|C]]', 'c'],
    ])
  })

  it('ignores refs in inline code and code blocks', () => {
    const md = [
      'Inline `[[a]]` and ``[[b]]``',
      '',
      '```',
      '[[c]]',
      '```',
      '',
      '    [[indented.code]]',
      '',
      'but [[d]]',
    ].join('\n')
    expect(sources(md)).toEqual(['[[d]]'])
  })

  it('ignores escaped refs', () => {
    expect(sources('\\[[a]]')).toEqual([])
    expect(sources('[\\[a]]')).toEqual([])
    expect(sources('text \\[[a]] and [[b]]')).toEqual(['[[b]]'])
    // Escaped backslash does not escape the ref
    expect(sources('\\\\[[a]]')).toEqual(['[[a]]'])
  })

  it('ignores refs inside links', () => {
    expect(sources('[see [[a]]](https://example.com) [[b]]')).toEqual(['[[b]]'])
  })

  it('ignores refs inside autolinks and html', () => {
    expect(sources('<https://example.com/[[a]]> <span title="[[b]]">[[c]]</span>')).toEqual(['[[c]]'])
  })

  it('takes precedence over link references', () => {
    const md = '[[a]]\n\n[a]: https://example.com'
    expect(sources(md)).toEqual(['[[a]]'])
  })

  it('does not treat image-like syntax as ref', () => {
    expect(sources('![[a]]')).toEqual([])
  })

  it.each([
    ['unclosed', '[[a'],
    ['unclosed with one bracket', '[[a]'],
    ['unclosed with label', '[[a|label'],
    ['empty', '[[]]'],
    ['empty with label', '[[|label]]'],
    ['whitespace in target', '[[a b]]'],
    ['leading whitespace', '[[ a]]'],
    ['trailing whitespace', '[[a ]]'],
    ['tab in target', '[[a\tb]]'],
    ['line break in target', '[[a\nb]]'],
    ['line break in label', '[[a|b\nc]]'],
    ['nested brackets in target', '[[a[b]]]'],
    ['nested brackets in label', '[[a|b[c]]]'],
    ['empty namespace', '[[:a]]'],
    ['empty target after namespace', '[[view:]]'],
    ['single brackets', '[a]'],
    ['backslash in target', '[[a\\b]]'],
  ])('ignores invalid ref: %s', (_, md) => {
    expect(extractRefs(md)).toEqual([])
  })

  it('unclosed ref does not swallow the following ref', () => {
    expect(sources('[[a and [[b]]')).toEqual(['[[b]]'])
    expect(sources('[[a\n[[b]]')).toEqual(['[[b]]'])
  })

  describe('GFM tables', () => {
    it('extracts refs in table cells', () => {
      const md = [
        '| Component | Notes |',
        '| --------- | ----- |',
        '| [[a.b]]   | see [[view:index]] |',
      ].join('\n')
      expect(refs(md).map(r => [r.source, r.targetSource])).toEqual([
        ['[[a.b]]', 'a.b'],
        ['[[view:index]]', 'index'],
      ])
    })

    it('unescaped | splits the cell, so ref with label is not recognized', () => {
      const md = [
        '| Component |',
        '| --------- |',
        '| [[a.b|Label]] |',
      ].join('\n')
      expect(extractRefs(md)).toEqual([])
    })

    it('supports \\| as label separator', () => {
      const md = [
        '| Component | Notes |',
        '| --------- | ----- |',
        '| [[a.b\\|Label]] | [[c\\|C \\| D]] |',
      ].join('\n')
      expect(refs(md)).toEqual([
        {
          kind: 'element',
          namespace: null,
          target: 'a.b',
          label: 'Label',
          source: '[[a.b\\|Label]]',
          targetSource: 'a.b',
        },
        {
          kind: 'element',
          namespace: null,
          target: 'c',
          label: 'C | D',
          source: '[[c\\|C \\| D]]',
          targetSource: 'c',
        },
      ])
    })

    it('supports \\| as label separator outside tables', () => {
      expect(refs('[[a.b\\|Label]]')).toMatchObject([{ target: 'a.b', label: 'Label', source: '[[a.b\\|Label]]' }])
    })
  })

  it('offsets are correct after escapes and entities', () => {
    const md = '\\*not em\\* &amp; &#91;&#91;x]] [[a.b|L]]'
    expect(refs(md)).toEqual([
      { kind: 'element', namespace: null, target: 'a.b', label: 'L', source: '[[a.b|L]]', targetSource: 'a.b' },
    ])
  })

  it('accepts any non-whitespace chars in target', () => {
    // Validation reports invalid targets, parser does not reject them
    expect(refs('[[cloud.back-end_1.api]] [[ünïcode]] [[a/b]]').map(r => r.target)).toEqual([
      'cloud.back-end_1.api',
      'ünïcode',
      'a/b',
    ])
  })
})
