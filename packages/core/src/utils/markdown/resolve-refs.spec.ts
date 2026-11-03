import { describe, expect, it } from 'vitest'
import { resolveMarkdownRefs } from './resolve-refs'
import { markdownToHtml } from './to-html'
import { markdownToText } from './to-text'
import type { MarkdownRefTitleResolver } from './types'

const titles: Record<string, string> = {
  'element:cloud.api': 'API',
  'view:index': 'Landscape',
}

const resolve: MarkdownRefTitleResolver = ref => titles[`${ref.kind}:${ref.target}`] ?? null

describe('resolveMarkdownRefs', () => {
  it('replaces refs with titles, labels or targets', () => {
    expect(
      resolveMarkdownRefs(
        'Calls [[cloud.api]], [[cloud.api|the API]], [[view:index]], [[cloud.missing]], [[deployment:prod]]',
        resolve,
      ),
    ).toBe('Calls API, the API, Landscape, cloud.missing, prod')
  })

  it('keeps the rest of the markdown as is', () => {
    const md = [
      '# Heading [[cloud.api]]',
      '',
      '- **bold** [[view:index]]',
      '- `[[cloud.api]]` in code',
      '- escaped \\[[cloud.api]]',
      '',
      '```',
      '[[cloud.api]]',
      '```',
    ].join('\n')
    expect(resolveMarkdownRefs(md, resolve)).toBe(
      [
        '# Heading API',
        '',
        '- **bold** Landscape',
        '- `[[cloud.api]]` in code',
        '- escaped \\[[cloud.api]]',
        '',
        '```',
        '[[cloud.api]]',
        '```',
      ].join('\n'),
    )
  })

  it('falls back to labels and targets without resolver', () => {
    expect(resolveMarkdownRefs('[[cloud.api]] and [[view:index|home]]')).toBe('cloud.api and home')
  })

  it('returns markdown without refs as is', () => {
    expect(resolveMarkdownRefs('plain **text**', resolve)).toBe('plain **text**')
  })
})

describe('markdownToText with resolver', () => {
  it('resolves titles', () => {
    expect(markdownToText('Calls [[cloud.api]] and [[cloud.api|the API]], see [[view:index]]', resolve)).toBe(
      'Calls API and the API, see Landscape',
    )
  })

  it('keeps fallback for missing targets and unknown namespaces', () => {
    expect(markdownToText('[[cloud.missing]] [[deployment:prod]]', resolve)).toBe('cloud.missing prod')
  })

  it('does not call resolver for labeled refs', () => {
    const calls: string[] = []
    markdownToText('[[cloud.api|label]] [[view:index]]', ref => {
      calls.push(ref.target)
      return null
    })
    expect(calls).toEqual(['index'])
  })
})

describe('markdownToHtml with resolver', () => {
  it('uses titles as anchor text and keeps attributes', () => {
    expect(markdownToHtml('[[cloud.api]] [[cloud.api|the API]] [[view:index]] [[cloud.missing]]', resolve)).toBe(
      '<p>'
        + '<a data-likec4-ref="cloud.api" data-likec4-ref-kind="element">API</a> '
        + '<a data-likec4-ref="cloud.api" data-likec4-ref-kind="element" data-likec4-ref-label>the API</a> '
        + '<a data-likec4-ref="index" data-likec4-ref-kind="view" data-likec4-ref-namespace="view">Landscape</a> '
        + '<a data-likec4-ref="cloud.missing" data-likec4-ref-kind="element">cloud.missing</a>'
        + '</p>',
    )
  })

  it('escapes resolved titles', () => {
    expect(markdownToHtml('[[cloud.api]]', () => '<b>API</b> & co')).toBe(
      '<p><a data-likec4-ref="cloud.api" data-likec4-ref-kind="element">&#x3C;b>API&#x3C;/b> &#x26; co</a></p>',
    )
  })

  it('is not affected by a previous call with resolver', () => {
    markdownToHtml('[[cloud.api]]', resolve)
    expect(markdownToHtml('[[cloud.api]]')).toBe(
      '<p><a data-likec4-ref="cloud.api" data-likec4-ref-kind="element">cloud.api</a></p>',
    )
  })
})

describe('resolveMarkdownRefs with escape', () => {
  const tricky: Record<string, string> = {
    'element:a': '*Star* and _under_',
    'element:b': 'A|B',
    'element:c': '[not a link](x) `code` <b>',
    'element:d': '# not a heading & ~~not struck~~ \\ back',
  }
  const resolveTricky: MarkdownRefTitleResolver = ref => tricky[`${ref.kind}:${ref.target}`] ?? null

  it('escapes inserted text', () => {
    expect(resolveMarkdownRefs('[[a]] [[b|x*y]]', resolveTricky, { escape: true })).toBe(
      '\\*Star\\* and \\_under\\_ x\\*y',
    )
  })

  it('does not escape by default', () => {
    expect(resolveMarkdownRefs('[[a]]', resolveTricky)).toBe('*Star* and _under_')
  })

  it.each(['a', 'c', 'd'])('renders title of %s literally', target => {
    const md = resolveMarkdownRefs(`Uses [[${target}]]`, resolveTricky, { escape: true })
    expect(markdownToText(md)).toBe(`Uses ${tricky[`element:${target}`]}`)
    expect(markdownToHtml(md)).not.toMatch(/<(em|strong|code|del|h1|a|b)\b/)
  })

  it('keeps a table cell intact', () => {
    const md = resolveMarkdownRefs(
      ['| Name | Uses |', '| --- | --- |', '| x | [[b]] and [[a]] |'].join('\n'),
      resolveTricky,
      { escape: true },
    )
    const html = markdownToHtml(md)
    expect(html).toContain('<td>A|B and *Star* and _under_</td>')
    expect(html.match(/<td>/g)).toHaveLength(2)
  })
})
