import { describe, expect, it } from 'vitest'
import { Builder } from '../../builder'
import { RichText } from '../../types'

const description = {
  md: 'Calls [[cloud.api]], [[cloud.api|the API]], see [[view:index]], [[cloud.missing]] and [[deployment:prod]]',
}

function buildModel(apiTitle: string) {
  const builder = Builder.specification({
    elements: ['el'],
    deployments: ['node'],
  })
  const {
    model: { el, model, rel },
    deployment: { node, instanceOf, deployment },
    views: { views, view, $include, $rules },
  } = builder.helpers()
  return builder
    .with(
      model(
        el('cloud', { title: 'Cloud' }),
        el('cloud.api', { title: apiTitle }),
        el('cloud.ui', {
          title: 'UI',
          summary: { md: 'Uses [[cloud.api]]' },
          description,
        }),
        el('plain', { description: { md: 'No refs, **bold**' } }),
        rel('cloud.ui', 'cloud.api', { description: { md: 'Over [[cloud.api]]' } }),
      ),
      deployment(
        node('prod').with(
          instanceOf('ui', 'cloud.ui'),
        ),
      ),
      views(
        view(
          'index',
          { title: 'Landscape', description: { md: 'Shows [[cloud.ui]]' } },
          $rules(
            $include('cloud.ui'),
            $include('cloud.api'),
          ),
        ),
      ),
    )
    .toLikeC4Model()
}

describe('Markdown refs in the model', () => {
  const m = buildModel('API')

  it('resolves element and view titles in text', () => {
    expect(m.element('cloud.ui').description.text).toBe(
      'Calls API, the API, see Landscape, cloud.missing and prod',
    )
  })

  it('resolves titles in html, keeping the anchor attributes', () => {
    const html = m.element('cloud.ui').description.html
    expect(html).toContain('<a data-likec4-ref="cloud.api" data-likec4-ref-kind="element">API</a>')
    // label wins
    expect(html).toContain(
      '<a data-likec4-ref="cloud.api" data-likec4-ref-kind="element" data-likec4-ref-label>the API</a>',
    )
    expect(html).toContain(
      '<a data-likec4-ref="index" data-likec4-ref-kind="view" data-likec4-ref-namespace="view">Landscape</a>',
    )
    // missing target and unknown namespace keep the fallback
    expect(html).toContain('<a data-likec4-ref="cloud.missing" data-likec4-ref-kind="element">cloud.missing</a>')
    expect(html).toContain(
      '<a data-likec4-ref="prod" data-likec4-ref-kind="unknown" data-likec4-ref-namespace="deployment">prod</a>',
    )
  })

  it('keeps md and source unchanged', () => {
    const desc = m.element('cloud.ui').description
    expect(desc.md).toBe(description.md)
    expect(desc.$source).toEqual(description)
    expect(desc.isMarkdown).toBe(true)
    expect(desc.nonEmpty).toBe(true)
    expect(desc).toBeInstanceOf(RichText)
  })

  it('is memoized on the model object', () => {
    const el = m.element('cloud.ui')
    expect(el.description).toBe(el.description)
    expect(el.description.text).toBe(el.description.text)
  })

  it('equals the plain RichText with the same source', () => {
    const desc = m.element('cloud.ui').description
    expect(desc.equals(RichText.from(description))).toBe(true)
    expect(RichText.from(description).equals(desc)).toBe(true)
    expect(desc).not.toBe(RichText.from(description))
  })

  it('does not change hasSummary', () => {
    expect(m.element('cloud.ui').hasSummary).toBe(true)
    expect(m.element('cloud.ui').summary.text).toBe('Uses API')

    const b = Builder.specification({ elements: ['el'] })
    const { model: { el, model } } = b.helpers()
    const m2 = b
      .with(model(
        el('a', { title: 'A' }),
        el('b', { summary: { md: 'See [[a]]' }, description: { md: 'See [[a]]' } }),
      ))
      .toLikeC4Model()
    expect(m2.element('b').summary).not.toBe(m2.element('b').description)
    expect(m2.element('b').hasSummary).toBe(false)
  })

  it('returns the shared cached instance for markdown without refs', () => {
    expect(m.element('plain').description).toBe(RichText.from({ md: 'No refs, **bold**' }))
  })

  it('resolves refs in relations, views, nodes, edges and deployments', () => {
    const [relation] = [...m.element('cloud.ui').outgoing()]
    expect(relation!.description.text).toBe('Over API')

    const view = m.view('index')
    expect(view.description.text).toBe('Shows UI')

    // nodes show the summary
    const node = view.findNode('cloud.ui')!
    expect(node.description.text).toBe('Uses API')
    const [edge] = [...node.outgoing()]
    expect(edge!.description.text).toBe('Over API')

    const instance = m.deployment.instance('prod.ui')
    expect(instance.description.text).toBe('Calls API, the API, see Landscape, cloud.missing and prod')
    expect(instance.summary.text).toBe('Uses API')
  })

  it('does not share resolved instances between models', () => {
    const other = buildModel('Gateway')
    expect(other.element('cloud.ui').description.text).toBe(
      'Calls Gateway, the API, see Landscape, cloud.missing and prod',
    )
    expect(m.element('cloud.ui').description.text).toBe(
      'Calls API, the API, see Landscape, cloud.missing and prod',
    )
    // global cache is not polluted
    expect(RichText.from(description).text).toBe(
      'Calls cloud.api, the API, see index, cloud.missing and prod',
    )
  })
})

describe('LikeC4Model.resolveMarkdownRef', () => {
  const m = buildModel('API')
  const ref = (kind: 'element' | 'view' | 'unknown', target: string, namespace: string | null = null) => ({
    kind,
    namespace,
    target,
    label: null,
    range: { start: 0, end: 0 },
    targetRange: { start: 0, end: 0 },
  })

  it('resolves elements and views', () => {
    expect(m.resolveMarkdownRef(ref('element', 'cloud.api'))).toBe('API')
    expect(m.resolveMarkdownRef(ref('view', 'index', 'view'))).toBe('Landscape')
  })

  it('returns null for missing targets and unknown namespaces', () => {
    expect(m.resolveMarkdownRef(ref('element', 'cloud.missing'))).toBeNull()
    expect(m.resolveMarkdownRef(ref('view', 'missing', 'view'))).toBeNull()
    expect(m.resolveMarkdownRef(ref('unknown', 'prod', 'deployment'))).toBeNull()
  })

  it('is bound to the model', () => {
    const { resolveMarkdownRef } = m
    expect(resolveMarkdownRef(ref('element', 'cloud.api'))).toBe('API')
  })
})
