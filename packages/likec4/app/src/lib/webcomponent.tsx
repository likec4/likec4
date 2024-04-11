import '@mantine/core/styles.css'
import '@xyflow/react/dist/style.css'
import './shadow.css'

import { type DiagramView, invariant, type ViewID } from '@likec4/core'
import { LikeC4Diagram } from '@likec4/diagram'
import { createTheme, MantineProvider } from '@mantine/core'
import ReactDOM from 'react-dom/client'
import { LikeC4Views } from 'virtual:likec4/views'

// @ts-expect-error replaced by vite-plugin
const BundledStyles: string = SHADOW_STYLE

const sheet = new CSSStyleSheet()
sheet.replaceSync(
  BundledStyles
    .replaceAll('body{', '.likec4-shadow-root{')
    .replaceAll(':root', '.likec4-shadow-root')
)

const theme = createTheme({
  primaryColor: 'indigo',
  cursorType: 'pointer',
  defaultRadius: 'sm',
  headings: {
    fontWeight: '500',
    sizes: {
      h1: {
        // fontSize: '2rem',
        fontWeight: '600'
      },
      h2: {
        // fontSize: '1.85rem',
      }
    }
  }
})

const defaultHostCss = `:host {
  min-height: 2rem;
}`
const genHostCss = (view: DiagramView, isKeepAspectRatio = true) =>
  isKeepAspectRatio
    ? `:host {
  aspect-ratio: ${Math.ceil(view.width)} / ${Math.ceil(view.height)};
  max-height: ${Math.ceil(1.05 * view.height)}px;
}`
    : defaultHostCss

class LikeC4View extends HTMLElement {
  static observedAttributes = ['view-id']

  private rootEl: HTMLDivElement
  private shadow: ShadowRoot
  private root: ReactDOM.Root

  private hostCss: CSSStyleSheet
  private lastHostCss = ''

  constructor() {
    super()
    this.shadow = this.attachShadow({ mode: 'open' })
    this.shadow.innerHTML = `
    <div class="likec4-shadow-root">
      <div class="likec4-react-root"></div>
    </div>`
    this.hostCss = new CSSStyleSheet()
    this.lastHostCss = defaultHostCss
    this.hostCss.replaceSync(this.lastHostCss)

    this.shadow.adoptedStyleSheets = [
      sheet,
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

  protected get isKeepAspectRatio(): boolean {
    const attr = this.getAttributeNode('keep-aspect-ratio')
    if (!attr) return false
    return (attr.value.trim() || 'true').toLowerCase() === 'true'
  }

  protected render() {
    let view = this.view

    const hostCss = genHostCss(view, this.isKeepAspectRatio)
    if (hostCss !== this.lastHostCss) {
      this.hostCss.replaceSync(hostCss)
      this.lastHostCss = hostCss
    }

    let prefersDark = false
    try {
      prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    } catch (e) {
      // ignore
    }

    this.root.render(
      <MantineProvider
        theme={theme}
        {...(prefersDark && { forceColorScheme: 'dark' })}
        getRootElement={() => this.rootEl}
        cssVariablesSelector=".likec4-shadow-root">
        <LikeC4Diagram
          view={view}
          readonly
          pannable
          zoomable
          background={'solid'}
          fitViewPadding={0.05}
          controls={false}
          nodesSelectable={false}
          nodesDraggable={false}
          keepAspectRatio={false}
          onNavigateTo={({ element, event }) => {
            event.stopPropagation()
            this.setAttribute('view-id', element.navigateTo)
            // const fs = document.createElement('likec4-view')
            // fs.setAttribute('view', element.navigateTo)
            // document.body.appendChild(fs)
          }}
        />
        {/* <StaticLikeC4Diagram view={LikeC4Views['index' as ViewID]!} background={'dots'} /> */}
      </MantineProvider>
    )
  }

  attributeChangedCallback(_name: string) {
    this.render()
  }
}

customElements.define('likec4-view', LikeC4View)

// customElements.define('likec4-view-fullscreen', LikeC4View)
