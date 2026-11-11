import { Builder } from '@likec4/core/builder'
import { RichText } from '@likec4/core/types'
import { MantineProvider } from '@mantine/core'
import { atom } from 'nanostores'
import type { ReactNode } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'
import { type EnabledFeatures, DiagramFeatures } from '../../context/DiagramFeatures'
import { LikeC4ModelContextProvider } from '../../context/LikeC4ModelContext'
import { type RootContainerContextType, RootContainerContextProvider } from '../../context/RootContainerContext'
import { createMarkdownRefResolver } from './markdown-refs'
import { MarkdownRefPreviewCard, MarkdownWithRefs } from './MarkdownWithRefs'
import { useMarkdownRefsInteractivity } from './useMarkdownRefsInteractivity'

vi.mock('../../hooks/useDiagram', async importOriginal => ({
  ...await importOriginal<typeof import('../../hooks/useDiagram')>(),
  useDiagram: () => ({}),
}))

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

const allFeatures: Partial<EnabledFeatures> = {
  enableElementDetails: true,
  enableNavigateTo: true,
}

const rootContainer: RootContainerContextType = {
  id: 'root',
  selector: '#root',
  ref: { current: null },
  $panning: atom(false),
  reducedGraphics: false,
}

function renderWithoutModel(children: ReactNode) {
  return renderToStaticMarkup(
    <MantineProvider>
      <RootContainerContextProvider value={rootContainer}>
        {children}
      </RootContainerContextProvider>
    </MantineProvider>,
  )
}

function render(children: ReactNode) {
  return renderWithoutModel(
    <LikeC4ModelContextProvider value={model}>
      {children}
    </LikeC4ModelContextProvider>,
  )
}

describe('Markdown refs', () => {
  it('renders focusable links with titles when element details and navigation are enabled', () => {
    const html = render(
      <DiagramFeatures overrides={allFeatures}>
        <MarkdownWithRefs value={value} />
      </DiagramFeatures>,
    )
    expect(html).toContain(
      '<a data-likec4-ref="cloud" data-likec4-ref-kind="element" data-likec4-ref-state="link" role="link" tabindex="0">Cloud</a>',
    )
    expect(html).toContain(
      '<a data-likec4-ref="index" data-likec4-ref-kind="view" data-likec4-ref-namespace="view" data-likec4-ref-view-type="element" data-likec4-ref-state="link" role="link" tabindex="0">Landscape</a>',
    )
    expect(html).toContain(
      '<span data-likec4-ref="missing" data-likec4-ref-kind="element" data-likec4-ref-state="missing">missing</span>',
    )
  })

  it('renders resolved text without links when the features are disabled', () => {
    const html = render(<MarkdownWithRefs value={value} uselikec4palette />)
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
      <DiagramFeatures overrides={{ enableElementDetails: false, enableNavigateTo: true }}>
        <MarkdownWithRefs value={value} />
      </DiagramFeatures>,
    )
    expect(html).toContain(
      '<span data-likec4-ref="cloud" data-likec4-ref-kind="element" data-likec4-ref-state="text">Cloud</span>',
    )
    expect(html).toContain(
      '<a data-likec4-ref="index" data-likec4-ref-kind="view" data-likec4-ref-namespace="view" data-likec4-ref-view-type="element" data-likec4-ref-state="link" role="link" tabindex="0">Landscape</a>',
    )
  })

  it('renders fallback text without a model', () => {
    const html = renderWithoutModel(
      <DiagramFeatures overrides={allFeatures}>
        <MarkdownWithRefs value={RichText.from({ md: '[[cloud]] [[cloud|Label]]' })} />
      </DiagramFeatures>,
    )
    expect(html).toContain('data-likec4-ref-state="text">cloud</span>')
    expect(html).toContain('data-likec4-ref-state="text">Label</span>')
  })
})

describe('MarkdownRefPreviewCard', () => {
  const resolver = createMarkdownRefResolver(model, { elements: true, views: true })

  // The card reads the active ref only, the anchor element is not used (no DOM in this environment)
  const anchor = {} as HTMLElement

  function ActivePreviewCard({ resolved }: { resolved: Exclude<ReturnType<typeof resolver>, { state: 'text' }> }) {
    const interactivity = useMarkdownRefsInteractivity(null, resolver)
    interactivity.$active.set({ element: anchor, resolved, opened: true })
    return <MarkdownRefPreviewCard interactivity={interactivity} />
  }

  function renderCard(ref: Parameters<typeof resolver>[0]) {
    const resolved = resolver(ref)
    if (resolved.state === 'text') {
      throw new Error('unexpected text ref')
    }
    return render(<ActivePreviewCard resolved={resolved} />)
  }

  it('renders nothing without an active ref', () => {
    function InactivePreviewCard() {
      const interactivity = useMarkdownRefsInteractivity(null, resolver)
      return <MarkdownRefPreviewCard interactivity={interactivity} />
    }
    expect(render(<InactivePreviewCard />)).not.toContain('Open')
  })

  it('shows element icon, title, id and technology, description and open button', () => {
    const html = renderCard({ kind: 'element', target: 'cloud', namespace: null, hasLabel: false })
    expect(html).toContain('<img src="https://example.com/cloud.svg" alt="Cloud"/>')
    expect(html).toContain('>Cloud</p>')
    expect(html).toContain('>cloud · AWS</')
    expect(html).toContain('Runs on <strong>AWS</strong>')
    expect(html).toMatch(/<button [^>]*type="button"[^>]*>.*Open details<\/span>/)
  })

  it('renders refs inside the preview as non-interactive text', () => {
    const html = renderCard({ kind: 'element', target: 'cloud', namespace: null, hasLabel: false })
    expect(html).toContain('data-likec4-ref-kind="element">Cloud</a>')
    expect(html).toContain('data-likec4-ref-kind="view" data-likec4-ref-namespace="view">Landscape</a>')
    expect(html).not.toContain('data-likec4-ref-state="link"')
    expect(html).not.toContain('tabindex')
  })

  it('shows view type icon, title and type', () => {
    const html = renderCard({ kind: 'view', target: 'index', namespace: 'view', hasLabel: false })
    expect(html).toContain('tabler-icon-zoom-scan')
    expect(html).toContain('>Landscape</p>')
    expect(html).toContain('>element view</')
    expect(html).toContain('Open view</span>')
  })

  it('shows one line for missing refs', () => {
    const html = renderCard({ kind: 'unknown', target: 'prod', namespace: 'deployment', hasLabel: false })
    expect(html).toContain(`>Unknown link type &#x27;deployment:&#x27;</p>`)
    expect(html).not.toContain('<button')
  })
})
