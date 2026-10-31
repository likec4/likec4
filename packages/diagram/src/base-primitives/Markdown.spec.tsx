import { Builder } from '@likec4/core/builder'
import { RichText } from '@likec4/core/types'
import { MantineProvider } from '@mantine/core'
import type { ReactNode } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { LikeC4ModelContextProvider } from '../context/LikeC4ModelContext'
import { type MarkdownRefActions, MarkdownRefsProvider } from '../context/MarkdownRefsContext'
import { Markdown, MarkdownRefPreviewCard } from './Markdown'
import { createMarkdownRefResolver } from './markdown-refs'

const model = Builder.specification({
  elements: ['system'],
})
  .model((m, _) =>
    _(m.system('cloud', {
      title: 'Cloud',
      technology: 'AWS',
      icon: 'https://example.com/cloud.svg',
      description: { md: 'Runs on **AWS**, see [[cloud]] and [[view:index]]' },
    }))
  )
  .views((v, _) => _(v.view('index', 'Landscape').with(v.$include('*'))))
  .toLikeC4Model()

const value = RichText.from({ md: 'Uses [[cloud]], see [[view:index]] and [[missing]]' })

const allActions: MarkdownRefActions = {
  openElement: () => {},
  openView: () => {},
}

function render(children: ReactNode) {
  return renderToStaticMarkup(
    <MantineProvider>
      <LikeC4ModelContextProvider value={model}>
        {children}
      </LikeC4ModelContextProvider>
    </MantineProvider>,
  )
}

describe('Markdown refs', () => {
  it('renders focusable links with titles inside MarkdownRefsProvider', () => {
    const html = render(
      <MarkdownRefsProvider value={allActions}>
        <Markdown value={value} />
      </MarkdownRefsProvider>,
    )
    expect(html).toContain(
      '<a data-likec4-ref="cloud" data-likec4-ref-kind="element" data-likec4-ref-state="link" role="link" tabindex="0">Cloud</a>',
    )
    expect(html).toContain(
      '<a data-likec4-ref="index" data-likec4-ref-kind="view" data-likec4-ref-namespace="view" data-likec4-ref-state="link" role="link" tabindex="0">Landscape</a>',
    )
    expect(html).toContain(
      '<span data-likec4-ref="missing" data-likec4-ref-kind="element" data-likec4-ref-state="missing">missing</span>',
    )
  })

  it('renders resolved text without links on the canvas (no provider)', () => {
    const html = render(<Markdown value={value} uselikec4palette />)
    expect(html).toContain(
      '<span data-likec4-ref="cloud" data-likec4-ref-kind="element" data-likec4-ref-state="text">Cloud</span>',
    )
    expect(html).toContain(
      '<span data-likec4-ref="index" data-likec4-ref-kind="view" data-likec4-ref-namespace="view" data-likec4-ref-state="text">Landscape</span>',
    )
    expect(html).not.toContain('tabindex')
    expect(html).not.toContain('role="link"')
  })

  it('renders refs of disabled features as plain text', () => {
    const html = render(
      <MarkdownRefsProvider value={{ openElement: null, openView: allActions.openView }}>
        <Markdown value={value} />
      </MarkdownRefsProvider>,
    )
    expect(html).toContain(
      '<span data-likec4-ref="cloud" data-likec4-ref-kind="element" data-likec4-ref-state="text">Cloud</span>',
    )
    expect(html).toContain(
      '<a data-likec4-ref="index" data-likec4-ref-kind="view" data-likec4-ref-namespace="view" data-likec4-ref-state="link" role="link" tabindex="0">Landscape</a>',
    )
  })

  it('renders fallback text without a model', () => {
    const html = renderToStaticMarkup(
      <MantineProvider>
        <MarkdownRefsProvider value={allActions}>
          <Markdown value={RichText.from({ md: '[[cloud]] [[cloud|Label]]' })} />
        </MarkdownRefsProvider>
      </MantineProvider>,
    )
    expect(html).toContain('data-likec4-ref-state="text">cloud</span>')
    expect(html).toContain('data-likec4-ref-state="text">Label</span>')
  })
})

describe('MarkdownRefPreviewCard', () => {
  const resolver = createMarkdownRefResolver(model, { elements: true, views: true })

  function renderCard(ref: Parameters<typeof resolver>[0], withOpen = true) {
    const resolved = resolver(ref)
    if (resolved.state === 'text') {
      throw new Error('unexpected text ref')
    }
    return render(
      <MarkdownRefsProvider value={allActions}>
        <MarkdownRefPreviewCard resolved={resolved} onOpen={withOpen ? () => {} : undefined} />
      </MarkdownRefsProvider>,
    )
  }

  it('shows element icon, title, kind and technology, description and open button', () => {
    const html = renderCard({ kind: 'element', target: 'cloud', namespace: null, hasLabel: false })
    expect(html).toContain('<img src="https://example.com/cloud.svg" alt="Cloud"/>')
    expect(html).toContain('>Cloud</p>')
    expect(html).toContain('>system · AWS</p>')
    expect(html).toContain('Runs on <strong>AWS</strong>')
    expect(html).toMatch(/<button [^>]*type="button"[^>]*>.*Open details<\/span>/)
  })

  it('has no open button without a handler', () => {
    const html = renderCard({ kind: 'element', target: 'cloud', namespace: null, hasLabel: false }, false)
    expect(html).not.toContain('<button')
  })

  it('renders refs inside the preview as plain text', () => {
    const html = renderCard({ kind: 'element', target: 'cloud', namespace: null, hasLabel: false })
    expect(html).toContain('data-likec4-ref-state="text">Cloud</span>')
    expect(html).toContain('data-likec4-ref-state="text">Landscape</span>')
    expect(html).not.toContain('tabindex')
  })

  it('shows view type icon, title and type', () => {
    const html = renderCard({ kind: 'view', target: 'index', namespace: 'view', hasLabel: false })
    expect(html).toContain('tabler-icon-zoom-scan')
    expect(html).toContain('>Landscape</p>')
    expect(html).toContain('>element view</p>')
    expect(html).toContain('Open view</span>')
  })

  it('shows one line for missing refs', () => {
    const html = renderCard({ kind: 'unknown', target: 'prod', namespace: 'deployment', hasLabel: false })
    expect(html).toContain(`>Unknown link type &#x27;deployment:&#x27;</p>`)
    expect(html).not.toContain('<button')
  })
})
