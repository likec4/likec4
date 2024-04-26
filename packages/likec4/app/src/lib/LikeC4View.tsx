import { type DiagramView, invariant, type ViewID } from '@likec4/core'
import { LikeC4Diagram } from '@likec4/diagram'
import { MantineProvider } from '@mantine/core'
import ReactDOM from 'react-dom/client'
import { LikeC4Views } from 'virtual:likec4/views'
import { bundledCSSStyleSheet, IbmPlexSans, matchesColorScheme, prefersDark, theme } from './styles'

const defaultHostCss = `:host {
  min-height: 2rem;
}`
const genHostCss = (view: DiagramView, isKeepAspectRatio = true) =>
  isKeepAspectRatio
    ? `:host {
  aspect-ratio: ${Math.ceil(view.width)} / ${Math.ceil(view.height)};
  max-height: min(100vh, ${Math.ceil(1.05 * view.height)}px);
}`
    : defaultHostCss

export class LikeC4View extends HTMLElement {
  static observedAttributes = ['view-id']

  private rootEl: HTMLDivElement
  private shadow: ShadowRoot
  private root: ReactDOM.Root

  private hostCss: CSSStyleSheet
  private lastHostCss = ''

  constructor() {
    super()
    this.shadow = this.attachShadow({ mode: 'open' })
    this.shadow.innerHTML = `${IbmPlexSans}
    <div class="likec4-shadow-root">
      <div class="likec4-react-root"></div>
    </div>`
    this.hostCss = new CSSStyleSheet()
    this.lastHostCss = defaultHostCss
    this.hostCss.replaceSync(this.lastHostCss)

    this.shadow.adoptedStyleSheets = [
      bundledCSSStyleSheet,
      this.hostCss
    ]
    this.rootEl = this.shadow.querySelector('.likec4-shadow-root') as HTMLDivElement
    this.root = ReactDOM.createRoot(this.shadow.querySelector('.likec4-react-root')!)
  }

  connectedCallback() {
    this.render()
  }

  disconnectedCallback() {
    this.root.unmount()
  }

  protected get view(): DiagramView {
    const viewId = this.getAttribute('view-id') ?? 'index'
    let view = LikeC4Views[viewId as ViewID]
    if (!view) {
      console.error(`Invalid view id: ${viewId},\nAvailable: ${Object.keys(LikeC4Views).join(', ')}`)
      view = LikeC4Views['index' as ViewID] ?? Object.values(LikeC4Views)[0]
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

    const hostCss = genHostCss(view, this.isKeepAspectRatio)
    if (hostCss !== this.lastHostCss) {
      this.hostCss.replaceSync(hostCss)
      this.lastHostCss = hostCss
    }

    const colorScheme = matchesColorScheme()

    this.root.render(
      <MantineProvider
        theme={theme}
        defaultColorScheme={prefersDark() ? 'dark' : 'light'}
        {...(colorScheme && { forceColorScheme: colorScheme })}
        getRootElement={() => this.rootEl}
        cssVariablesSelector=".likec4-shadow-root">
        <LikeC4Diagram
          view={view}
          readonly
          pannable={false}
          zoomable={false}
          background={'transparent'}
          fitView
          fitViewPadding={0.05}
          showElementLinks={false}
          controls={false}
          nodesSelectable={false}
          keepAspectRatio={false}
          onCanvasClick={(e) => {
            e.stopPropagation()
            const fs = document.createElement('likec4-browser')
            fs.setAttribute('view-id', view.id)
            document.body.appendChild(fs)
          }}
        />
      </MantineProvider>
    )
  }

  attributeChangedCallback(_name: string) {
    this.render()
  }
}
