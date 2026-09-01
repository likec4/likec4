/// <reference lib="dom" />
import { LikeC4Model } from '@likec4/core/model'
import type { DiagramView } from '@likec4/core/types'
import { LikeC4Diagram, LikeC4ModelProvider } from '@likec4/diagram'
import { MantineProvider } from '@mantine/core'
import { useApp, useDocumentTheme, useHostStyles } from '@modelcontextprotocol/ext-apps/react'
import { type ErrorInfo, type PropsWithChildren, Component, useState } from 'react'
import { createRoot } from 'react-dom/client'

interface RenderViewResult {
  view: DiagramView
  // Layouted model data, scoped to just this view — see tools/render-view.ts.
  // LikeC4Diagram unconditionally reads model.specification (tag colors), so
  // it needs a real LikeC4Model in a LikeC4ModelProvider, not just the view.
  model: Parameters<typeof LikeC4Model.create>[0]
}

// No error boundary here would mean any render failure (e.g. an unexpected
// LikeC4Diagram runtime requirement) unmounts the whole tree silently — the
// iframe would just go blank with no clue why. Surface it as text instead.
class DiagramErrorBoundary extends Component<PropsWithChildren, { error: Error | null }> {
  override state: { error: Error | null } = { error: null }

  static getDerivedStateFromError(error: Error) {
    return { error }
  }

  override componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('render-view app crashed:', error, info.componentStack)
  }

  override render() {
    if (this.state.error) {
      return (
        <div id="root">
          Failed to render diagram: {this.state.error.message}
        </div>
      )
    }
    return this.props.children
  }
}

function RenderViewApp() {
  const [result, setResult] = useState<RenderViewResult | null>(null)
  const [errorText, setErrorText] = useState<string | null>(null)

  const { app, isConnected, error: connectError } = useApp({
    appInfo: { name: 'LikeC4 Render View', version: '0.0.0' },
    capabilities: {},
    // The SDK's default auto-resize measures content height by temporarily
    // setting documentElement's height to "max-content". Our layout fills
    // the host-given space (html/body/#root are all height:100%), so with no
    // definite ancestor height that percentage chain collapses to 0 — the SDK
    // then reports height:0 to the host, which shrinks the iframe to nothing.
    // This diagram should fill whatever space the host gives it, not dictate
    // a content-driven size, so auto-resize is disabled entirely.
    autoResize: false,
    onAppCreated: (app) => {
      app.ontoolresult = (result) => {
        if (result.isError) {
          const text = result.content?.find((c): c is { type: 'text'; text: string } => c.type === 'text')?.text
          setErrorText(text ?? 'Failed to render view')
          return
        }
        const structured = result.structuredContent as Partial<RenderViewResult> | undefined
        if (structured?.view && structured?.model) {
          setResult({ view: structured.view, model: structured.model })
        }
      }
    },
  })

  useHostStyles(app, app?.getHostContext())
  const theme = useDocumentTheme()

  if (connectError) {
    return <div id="root">Failed to connect to host: {connectError.message}</div>
  }
  if (!isConnected) {
    return <div id="root">Connecting…</div>
  }
  if (errorText) {
    return <div id="root">{errorText}</div>
  }
  if (!result) {
    return <div id="root">Loading view…</div>
  }

  const likec4model = LikeC4Model.create(result.model)

  return (
    <MantineProvider forceColorScheme={theme}>
      <LikeC4ModelProvider likec4model={likec4model}>
        <LikeC4Diagram view={result.view} pannable zoomable fitView controls />
      </LikeC4ModelProvider>
    </MantineProvider>
  )
}

createRoot(document.getElementById('root')!).render(
  <DiagramErrorBoundary>
    <RenderViewApp />
  </DiagramErrorBoundary>,
)
