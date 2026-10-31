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
        m.component('api', {
          title: 'Public <API> & "Co"',
          technology: 'REST',
          summary: { md: 'Public **API**' },
        }),
      ),
    )
  )
  .views((v, _) =>
    _(
      v.view('index', { title: 'Landscape', description: 'Overview' }).with(v.$include('*')),
      v.view('untitled').with(v.$include('*')),
    )
  )
  .toLikeC4Model()

const interactive = createMarkdownRefResolver(model, { elements: true, views: true })

function render(md: string, resolver = interactive) {
  return resolveMarkdownRefs(markdownToHtml(md), resolver)
}

describe('createMarkdownRefResolver', () => {
  it('resolves element title, with a preview', () => {
    const resolved = interactive({ kind: 'element', target: 'cloud.api', namespace: null, hasLabel: false })
    expect(resolved).toMatchObject({
      state: 'link',
      kind: 'element',
      fqn: 'cloud.api',
      text: 'Public <API> & "Co"',
      preview: {
        title: 'Public <API> & "Co"',
        meta: 'component · REST',
      },
    })
    expect(resolved.state === 'link' && resolved.preview.body.md).toBe('Public **API**')
    expect(interactive({ kind: 'element', target: 'cloud', namespace: null, hasLabel: false })).toMatchObject({
      preview: { title: 'Cloud', meta: 'system' },
    })
  })

  it('resolves view title, or id if untitled', () => {
    expect(interactive({ kind: 'view', target: 'index', namespace: 'view', hasLabel: false })).toMatchObject({
      state: 'link',
      kind: 'view',
      viewId: 'index',
      text: 'Landscape',
      preview: { title: 'Landscape', meta: 'element view' },
    })
    expect(interactive({ kind: 'view', target: 'index', namespace: 'view', hasLabel: false })).toHaveProperty(
      'preview.body.text',
      'Overview',
    )
    expect(interactive({ kind: 'view', target: 'untitled', namespace: 'view', hasLabel: false })).toMatchObject({
      state: 'link',
      text: 'untitled',
    })
  })

  it('reports missing targets and unknown namespaces', () => {
    expect(interactive({ kind: 'element', target: 'cloud.db', namespace: null, hasLabel: false })).toEqual({
      state: 'missing',
      text: null,
      message: `Element 'cloud.db' not found`,
    })
    expect(interactive({ kind: 'view', target: 'nope', namespace: 'view', hasLabel: false })).toEqual({
      state: 'missing',
      text: null,
      message: `View 'nope' not found`,
    })
    expect(interactive({ kind: 'unknown', target: 'prod', namespace: 'deployment', hasLabel: false })).toEqual({
      state: 'missing',
      text: null,
      message: `Unknown link type 'deployment:'`,
    })
  })

  it('resolves to plain text when opening is not available', () => {
    const resolver = createMarkdownRefResolver(model, { elements: false, views: true })
    expect(resolver({ kind: 'element', target: 'cloud', namespace: null, hasLabel: false })).toMatchObject({
      state: 'text',
      text: 'Cloud',
    })
    expect(resolver({ kind: 'view', target: 'index', namespace: 'view', hasLabel: false })).toMatchObject({
      state: 'link',
    })
  })

  it('keeps targets without a model', () => {
    const resolver = createMarkdownRefResolver(null, { elements: true, views: true })
    expect(resolver({ kind: 'element', target: 'cloud', namespace: null, hasLabel: false })).toMatchObject({
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
      '<p>See <a data-likec4-ref="index" data-likec4-ref-kind="view" data-likec4-ref-namespace="view" data-likec4-ref-state="link" role="link" tabindex="0">Landscape</a></p>',
    )
  })

  it('renders missing targets and unknown namespaces as dimmed text with the fallback', () => {
    expect(render('[[cloud.db]] [[view:nope|Nope]] [[deployment:prod]]')).toBe(
      '<p><span data-likec4-ref="cloud.db" data-likec4-ref-kind="element" data-likec4-ref-state="missing">cloud.db</span>'
        + ' <span data-likec4-ref="nope" data-likec4-ref-kind="view" data-likec4-ref-namespace="view" data-likec4-ref-label data-likec4-ref-state="missing">Nope</span>'
        + ' <span data-likec4-ref="prod" data-likec4-ref-kind="unknown" data-likec4-ref-namespace="deployment" data-likec4-ref-state="missing">prod</span></p>',
    )
  })

  it('renders refs as text when opening is not available (canvas, disabled features)', () => {
    const resolver = createMarkdownRefResolver(model, { elements: false, views: false })
    expect(render('[[cloud.api]] [[view:index]]', resolver)).toBe(
      '<p><span data-likec4-ref="cloud.api" data-likec4-ref-kind="element" data-likec4-ref-state="text">Public &lt;API&gt; &amp; &quot;Co&quot;</span>'
        + ' <span data-likec4-ref="index" data-likec4-ref-kind="view" data-likec4-ref-namespace="view" data-likec4-ref-state="text">Landscape</span></p>',
    )
  })

  it('passes the decoded namespace of unknown refs to the resolver', () => {
    const refs: Array<{ namespace: string | null; kind: string }> = []
    const html = resolveMarkdownRefs(markdownToHtml('[[a"b:c]] [[view:index]] [[cloud]]'), ref => {
      refs.push({ namespace: ref.namespace, kind: ref.kind })
      return { state: 'missing', text: null, message: '' }
    })
    expect(refs).toEqual([
      { namespace: 'a"b', kind: 'unknown' },
      { namespace: 'view', kind: 'view' },
      { namespace: null, kind: 'element' },
    ])
    expect(html).toContain('data-likec4-ref-namespace="a&#x22;b" data-likec4-ref-state="missing">c</span>')
    expect(render('[[deployment:prod|Prod]]')).toContain(
      'data-likec4-ref-namespace="deployment" data-likec4-ref-label data-likec4-ref-state="missing">Prod</span>',
    )
  })

  it('decodes the target before resolving and keeps it encoded in the output', () => {
    const targets: string[] = []
    const html = resolveMarkdownRefs(markdownToHtml('[[a"b&c]]'), ref => {
      targets.push(ref.target)
      return { state: 'missing', text: null, message: '' }
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
