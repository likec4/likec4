import { Builder } from '@likec4/core/builder'
import { RichText } from '@likec4/core/types'
import { MantineProvider } from '@mantine/core'
import type { ReactNode } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { LikeC4ModelContextProvider } from '../context/LikeC4ModelContext'
import { type MarkdownRefActions, MarkdownRefsProvider } from '../context/MarkdownRefsContext'
import { Markdown } from './Markdown'

const model = Builder.specification({
  elements: ['system'],
})
  .model((m, _) => _(m.system('cloud', 'Cloud')))
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
      '<a data-likec4-ref="index" data-likec4-ref-kind="view" data-likec4-ref-state="link" role="link" tabindex="0">Landscape</a>',
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
      '<span data-likec4-ref="index" data-likec4-ref-kind="view" data-likec4-ref-state="text">Landscape</span>',
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
      '<a data-likec4-ref="index" data-likec4-ref-kind="view" data-likec4-ref-state="link" role="link" tabindex="0">Landscape</a>',
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
