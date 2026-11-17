import { LikeC4Model } from '@likec4/core/model'
import type { LayoutedLikeC4ModelData, ViewId } from '@likec4/core/types'
import { LikeC4ModelProvider, LikeC4View, pickViewBounds } from '@likec4/diagram'
import { type CSSProperties, type ReactNode, useEffect, useLayoutEffect } from 'react'
import { flushSync } from 'react-dom'
import { createRoot } from 'react-dom/client'
import type { HostData, HostOptions, ModelData } from '../../markdown-protocol.ts'
import { HostManager, markReady, readJson, unmarkReady } from './hosts.ts'

type Scheme = 'light' | 'dark'

interface ModelEntry {
  readonly hash: string
  readonly model: LikeC4Model.Layouted
  readonly trimmed: boolean
}

const models = new Map<string, ModelEntry>()

function vscodeScheme(): Scheme {
  const classes = document.body.classList
  if (
    classes.contains('vscode-dark')
    || (classes.contains('vscode-high-contrast') && !classes.contains('vscode-high-contrast-light'))
  ) {
    return 'dark'
  }
  return 'light'
}

function modelFor(id: string): ModelEntry | null {
  const el = document.getElementById(id)?.querySelector(':scope > script[type="application/json"]') ?? null
  if (!el) {
    return null
  }
  const cached = models.get(id)
  const head = el.textContent?.slice(0, 200) ?? ''
  if (cached && head.includes(JSON.stringify(cached.hash))) {
    return cached
  }
  const data = readJson<ModelData>(el)
  if (!data?.model) {
    return null
  }
  try {
    const entry: ModelEntry = {
      hash: data.hash,
      model: LikeC4Model.create(data.model as LayoutedLikeC4ModelData),
      trimmed: data.trimmed,
    }
    models.set(id, entry)
    return entry
  } catch (err) {
    console.error('[likec4] invalid markdown preview model data', err)
    return null
  }
}

const REACT_FLOW_PROPS = {
  zoomOnScroll: false,
  panOnScroll: false,
  preventScrolling: false,
} as const

const PAD = 16
const MIN_HEIGHT = 160

const noticeBoxStyle: CSSProperties = {
  fontFamily: 'var(--vscode-font-family, sans-serif)',
  fontSize: '13px',
  padding: '8px 12px',
  borderRadius: '4px',
  margin: '0 0 6px 0',
}

function Notice({ kind, children }: { kind: 'error' | 'warning' | 'info'; children: ReactNode }) {
  const color = kind === 'error'
    ? 'var(--vscode-editorError-foreground, #f14c4c)'
    : kind === 'warning'
    ? 'var(--vscode-editorWarning-foreground, #cca700)'
    : 'var(--vscode-descriptionForeground, #888)'
  return (
    <div
      role={kind === 'error' ? 'alert' : 'status'}
      data-likec4-notice={kind}
      style={{
        ...noticeBoxStyle,
        borderLeft: `3px solid ${color}`,
        background: 'var(--vscode-textBlockQuote-background, rgba(127, 127, 127, 0.1))',
        color: 'var(--vscode-foreground, inherit)',
      }}
    >
      {children}
    </div>
  )
}

interface HostProps {
  readonly host: Element
  readonly opts: HostOptions
  readonly data: HostData
  readonly model: ModelEntry | null
  readonly scheme: Scheme
}

function Diagram({ host, opts, data, model, scheme }: HostProps & { readonly model: ModelEntry }) {
  useLayoutEffect(() => {
    if (host.querySelector(':scope > svg.likec4-static')) {
      unmarkReady(host)
    } else {
      markReady(host)
    }
  }, [host])

  const browser = opts.browser && !data.trimmed
  const view = model.model.findView(opts.viewId as ViewId)
  const bounds = view?.isLayouted() ? pickViewBounds(view.$layouted, opts.variant) : null
  const size: CSSProperties = bounds
    ? {
      width: `min(100%, ${Math.ceil(bounds.width + 2 * PAD)}px)`,
      aspectRatio: `${Math.ceil(bounds.width + 2 * PAD)} / ${Math.ceil(bounds.height + 2 * PAD)}`,
      maxHeight: `${opts.maxHeight}px`,
      minHeight: `${Math.min(MIN_HEIGHT, opts.maxHeight)}px`,
      margin: '0 auto',
    }
    : { height: `${opts.maxHeight}px` }

  const extraViewProps = {
    onInitialized: () => {
      markReady(host)
    },
  } as Record<string, unknown>

  return (
    <div>
      {data.state === 'stale' && <Notice kind="warning">Showing the last valid version. {data.message}</Notice>}
      {data.trimmed && opts.browser && (
        <Notice kind="info">The LikeC4 model is too large to embed completely; navigation is disabled.</Notice>
      )}
      <div style={size} data-likec4-frame>
        <LikeC4ModelProvider likec4model={model.model}>
          <LikeC4View
            injectFontCss={false}
            keepAspectRatio={false}
            viewId={opts.viewId as ViewId}
            colorScheme={scheme}
            browser={browser}
            pannable={opts.panZoom}
            zoomable={opts.panZoom}
            dynamicViewVariant={opts.variant}
            reactFlowProps={REACT_FLOW_PROPS}
            fitView
            {...extraViewProps}
          />
        </LikeC4ModelProvider>
      </div>
    </div>
  )
}

function Ready({ host }: { host: Element }) {
  useEffect(() => {
    markReady(host)
  }, [host])
  return null
}

function HostView(props: HostProps) {
  const { data, model, opts, host } = props

  useEffect(() => {
    const delay = host.querySelector(':scope > svg.likec4-static') ? 15000 : 3000
    const timer = setTimeout(() => {
      markReady(host)
    }, delay)
    return () => {
      clearTimeout(timer)
    }
  }, [host])

  if (data.state === 'loading') {
    return (
      <>
        <Ready host={host} />
        <Notice kind="info">Loading LikeC4 view…</Notice>
      </>
    )
  }
  if (data.state === 'error') {
    return (
      <>
        <Ready host={host} />
        <Notice kind="error">{data.message ?? 'LikeC4 view error'}</Notice>
      </>
    )
  }
  if (!model) {
    return (
      <>
        <Ready host={host} />
        <Notice kind="error">LikeC4 model data is missing.</Notice>
      </>
    )
  }
  if (!model.model.findView(opts.viewId as ViewId)) {
    return (
      <>
        <Ready host={host} />
        <Notice kind="error">View &quot;{opts.viewId}&quot; not found.</Notice>
      </>
    )
  }
  return <Diagram {...props} model={model} />
}

let currentScheme: Scheme = 'light'

const FALLBACK_OPTS: HostOptions = {
  project: '',
  viewId: '',
  model: '',
  browser: false,
  variant: 'diagram',
  scheme: 'auto',
  maxHeight: 500,
  panZoom: false,
}

function schemeOf(opts: HostOptions | null): Scheme {
  if (opts?.scheme === 'light' || opts?.scheme === 'dark') {
    return opts.scheme
  }
  return currentScheme
}

const manager = new HostManager<ModelEntry>(document, {
  createRoot: (container) => createRoot(container),
  model: (id) => modelFor(id),
  extraKey: ({ opts }) => schemeOf(opts),
  view: ({ host, opts, data, model }) => (
    <HostView host={host} opts={opts ?? FALLBACK_OPTS} data={data} model={model} scheme={schemeOf(opts)} />
  ),
})

function scan(force = false): void {
  manager.scan(force)
  for (const id of models.keys()) {
    if (!document.getElementById(id)) {
      models.delete(id)
    }
  }
}

export function start(): void {
  currentScheme = vscodeScheme()
  flushSync(() => {
    scan()
  })

  new MutationObserver(() => {
    const next = vscodeScheme()
    if (next !== currentScheme) {
      currentScheme = next
      scan(true)
    }
  }).observe(document.body, { attributes: true, attributeFilter: ['class'] })

  window.addEventListener('vscode.markdown.updateContent', () => {
    scan()
  })
}
