import { Builder } from '@likec4/core/builder'
import { markdownToHtml } from '@likec4/core/utils'
import { describe, expect, it } from 'vitest'
import { createMarkdownRefResolver, resolveMarkdownRefs } from './markdown-refs'

const model = Builder.specification({
  elements: ['system', 'component'],
})
  .model((m, _) =>
    _(
      m.system('cloud', 'Cloud').with(
        m.component('api', 'Public <API> & "Co"'),
      ),
    )
  )
  .views((v, _) =>
    _(
      v.view('index', 'Landscape').with(v.$include('*')),
      v.view('untitled').with(v.$include('*')),
    )
  )
  .toLikeC4Model()

const interactive = createMarkdownRefResolver(model, { elements: true, views: true })

function render(md: string, resolver = interactive) {
  return resolveMarkdownRefs(markdownToHtml(md), resolver)
}

describe('createMarkdownRefResolver', () => {
  it('resolves element title and kind', () => {
    expect(interactive({ kind: 'element', target: 'cloud.api', hasLabel: false })).toEqual({
      state: 'link',
      kind: 'element',
      fqn: 'cloud.api',
      text: 'Public <API> & "Co"',
      tooltip: 'Public <API> & "Co" · component',
    })
  })

  it('resolves view title, or id if untitled', () => {
    expect(interactive({ kind: 'view', target: 'index', hasLabel: false })).toMatchObject({
      state: 'link',
      kind: 'view',
      viewId: 'index',
      text: 'Landscape',
    })
    expect(interactive({ kind: 'view', target: 'untitled', hasLabel: false })).toMatchObject({
      state: 'link',
      text: 'untitled',
    })
  })

  it('reports missing targets and unknown namespaces', () => {
    expect(interactive({ kind: 'element', target: 'cloud.db', hasLabel: false })).toEqual({
      state: 'missing',
      text: null,
      tooltip: `Element 'cloud.db' not found`,
    })
    expect(interactive({ kind: 'view', target: 'nope', hasLabel: false })).toEqual({
      state: 'missing',
      text: null,
      tooltip: `View 'nope' not found`,
    })
    expect(interactive({ kind: 'unknown', target: 'cloud', hasLabel: false })).toMatchObject({
      state: 'missing',
      text: null,
    })
  })

  it('resolves to plain text when opening is not available', () => {
    const resolver = createMarkdownRefResolver(model, { elements: false, views: true })
    expect(resolver({ kind: 'element', target: 'cloud', hasLabel: false })).toMatchObject({
      state: 'text',
      text: 'Cloud',
    })
    expect(resolver({ kind: 'view', target: 'index', hasLabel: false })).toMatchObject({
      state: 'link',
    })
  })

  it('keeps targets without a model', () => {
    const resolver = createMarkdownRefResolver(null, { elements: true, views: true })
    expect(resolver({ kind: 'element', target: 'cloud', hasLabel: false })).toMatchObject({
      state: 'text',
      text: 'cloud',
    })
  })
})

describe('resolveMarkdownRefs', () => {
  it('substitutes the element title and escapes it', () => {
    expect(render('Calls [[cloud.api]].')).toBe(
      '<p>Calls <a data-likec4-ref="cloud.api" data-likec4-ref-kind="element" data-likec4-ref-state="link" role="link" tabindex="0">Public &lt;API&gt; &amp; &quot;Co&quot;</a>.</p>',
    )
  })

  it('keeps the label', () => {
    expect(render('[[cloud|The cloud]] and [[cloud.api|cloud.api]]')).toBe(
      '<p><a data-likec4-ref="cloud" data-likec4-ref-kind="element" data-likec4-ref-label data-likec4-ref-state="link" role="link" tabindex="0">The cloud</a>'
        + ' and <a data-likec4-ref="cloud.api" data-likec4-ref-kind="element" data-likec4-ref-label data-likec4-ref-state="link" role="link" tabindex="0">cloud.api</a></p>',
    )
  })

  it('keeps the encoded label as is', () => {
    expect(render('[[cloud|<b>bold</b> & co]]')).toContain('>&#x3C;b>bold&#x3C;/b> &#x26; co</a>')
  })

  it('substitutes the view title', () => {
    expect(render('See [[view:index]]')).toBe(
      '<p>See <a data-likec4-ref="index" data-likec4-ref-kind="view" data-likec4-ref-state="link" role="link" tabindex="0">Landscape</a></p>',
    )
  })

  it('renders missing targets and unknown namespaces as dimmed text with the fallback', () => {
    expect(render('[[cloud.db]] [[view:nope|Nope]] [[deployment:prod]]')).toBe(
      '<p><span data-likec4-ref="cloud.db" data-likec4-ref-kind="element" data-likec4-ref-state="missing">cloud.db</span>'
        + ' <span data-likec4-ref="nope" data-likec4-ref-kind="view" data-likec4-ref-label data-likec4-ref-state="missing">Nope</span>'
        + ' <span data-likec4-ref="prod" data-likec4-ref-kind="unknown" data-likec4-ref-state="missing">prod</span></p>',
    )
  })

  it('renders refs as text when opening is not available (canvas, disabled features)', () => {
    const resolver = createMarkdownRefResolver(model, { elements: false, views: false })
    expect(render('[[cloud.api]] [[view:index]]', resolver)).toBe(
      '<p><span data-likec4-ref="cloud.api" data-likec4-ref-kind="element" data-likec4-ref-state="text">Public &lt;API&gt; &amp; &quot;Co&quot;</span>'
        + ' <span data-likec4-ref="index" data-likec4-ref-kind="view" data-likec4-ref-state="text">Landscape</span></p>',
    )
  })

  it('decodes the target before resolving and keeps it encoded in the output', () => {
    const targets: string[] = []
    const html = resolveMarkdownRefs(markdownToHtml('[[a"b&c]]'), ref => {
      targets.push(ref.target)
      return { state: 'missing', text: null, tooltip: '' }
    })
    expect(targets).toEqual(['a"b&c'])
    expect(html).toBe(
      '<p><span data-likec4-ref="a&#x22;b&#x26;c" data-likec4-ref-kind="element" data-likec4-ref-state="missing">a"b&#x26;c</span></p>',
    )
  })

  it('does not touch html without refs', () => {
    const html = markdownToHtml('[link](https://example.com) `[[a]]`')
    expect(resolveMarkdownRefs(html, interactive)).toBe(html)
  })
})
