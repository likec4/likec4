import { type DiagramView, invariant, type ViewID } from '@likec4/core'
import { LikeC4Diagram } from '@likec4/diagram'
import { MantineProvider } from '@mantine/core'
import ReactDOM from 'react-dom/client'
import { type LikeC4ViewId, LikeC4Views } from 'virtual:likec4/views'
import { ComponentName } from '../src/const'
import { bundledStyles, IbmPlexSans, matchesColorScheme, theme } from './styles'

export class LikeC4View extends HTMLElement {
  static observedAttributes = ['view-id']

  private rootEl: HTMLDivElement
  private shadow: ShadowRoot
  private root: ReactDOM.Root | undefined

  private bundledCSS: CSSStyleSheet | undefined
  private hostCss: CSSStyleSheet | undefined
  private lastHostCss = ''

  constructor() {
    super()
    this.shadow = this.attachShadow({ mode: 'open' })
    this.shadow.innerHTML = `${IbmPlexSans}
    <div class="likec4-shadow-root likec4-view">
      <div class="likec4-react-root"></div>
    </div>`
    this.rootEl = this.shadow.querySelector('.likec4-shadow-root') as HTMLDivElement
  }

  updateHostCss() {
    const view = this.view
    const hostCss = this.isKeepAspectRatio
      ? `:host {
      width: 100%;
      height: auto;
      aspect-ratio: ${Math.ceil(view.width)} / ${Math.ceil(view.height)};
      max-height: ${Math.ceil(1.01 * view.height)}px;
    }`
      : `:host {
      width: 100%;
      height: 100%;
    }`
    if (hostCss !== this.lastHostCss) {
      this.hostCss?.replaceSync(hostCss)
      this.lastHostCss = hostCss
    }
  }

  connectedCallback() {
    this.bundledCSS = new CSSStyleSheet()
    this.bundledCSS.replaceSync(bundledStyles())

    this.lastHostCss = ''
    this.hostCss = new CSSStyleSheet()
    this.updateHostCss()

    this.shadow.adoptedStyleSheets = [
      this.bundledCSS,
      this.hostCss
    ]
    this.render()
  }

  disconnectedCallback() {
    this.root?.unmount()
    this.root = undefined
    this.shadow.adoptedStyleSheets.length = 0
    this.bundledCSS = undefined
    this.hostCss = undefined
  }

  protected get view(): DiagramView {
    const viewId = this.getAttribute('view-id') ?? 'index'
    let view = LikeC4Views[viewId as LikeC4ViewId]
    if (!view) {
      console.error(`Invalid view id: ${viewId},\nAvailable: ${Object.keys(LikeC4Views).join(', ')}`)
      view = LikeC4Views['index' as LikeC4ViewId] ?? Object.values(LikeC4Views)[0]
      invariant(view, `Empty LikeC4Views`)
      console.warn(`LikeC4: Falling back to view: ${view.id}`)
      const fallbackViewId = view.id
      setTimeout(() => this.setAttribute('view-id', fallbackViewId), 50)
    }
    return view
  }

  protected isKeepAspectRatio = true

  protected render() {
    let view = this.view

    this.updateHostCss()

    this.root ??= ReactDOM.createRoot(this.shadow.querySelector('.likec4-react-root')!)

    const colorScheme = matchesColorScheme(this)

    this.root.render(
      <MantineProvider
        theme={theme}
        defaultColorScheme={'auto'}
        {...(colorScheme && { forceColorScheme: colorScheme })}
        getRootElement={() => this.rootEl}
        cssVariablesSelector={'.likec4-shadow-root'}>
        <LikeC4Diagram
          view={view}
          readonly
          pannable={false}
          zoomable={false}
          background={'transparent'}
          fitView
          fitViewPadding={0.012}
          showElementLinks
          controls={false}
          nodesSelectable={false}
          keepAspectRatio={false}
          onNavigateTo={to => {
            this.openBrowser(to)
          }}
          onNodeClick={() => {
            this.openBrowser()
          }}
          onCanvasClick={(e) => {
            e.stopPropagation()
            this.openBrowser()
          }}
        />
      </MantineProvider>
    )
  }

  openBrowser(viewId?: ViewID) {
    const fs = document.createElement(ComponentName.Browser)
    fs.setAttribute('view-id', viewId ?? this.view.id)
    document.body.appendChild(fs)
  }

  attributeChangedCallback(_name: string) {
    if (this.root) {
      this.render()
    }
  }
}
