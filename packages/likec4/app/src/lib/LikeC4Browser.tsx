import { type DiagramView, invariant, type ViewID } from '@likec4/core'
import { LikeC4Diagram } from '@likec4/diagram'
import { Box, CloseButton, MantineProvider } from '@mantine/core'
import ReactDOM from 'react-dom/client'
import { LikeC4Views } from 'virtual:likec4/views'
import { bundledCSSStyleSheet, IbmPlexSans, prefersDark, theme } from './styles'

export class LikeC4Browser extends HTMLElement {
  static observedAttributes = ['view-id']

  private rootEl: HTMLDivElement
  private shadow: ShadowRoot
  private root: ReactDOM.Root

  private hostCss: CSSStyleSheet

  constructor() {
    super()
    this.shadow = this.attachShadow({ mode: 'open' })
    this.shadow.innerHTML = `${IbmPlexSans}
    <div class="likec4-shadow-root likec4-browser">
      <div class="likec4-react-root"></div>
    </div>`
    this.hostCss = new CSSStyleSheet()
    this.hostCss.replaceSync(`
      :host {
        position:fixed;
        inset:0;
      }
    `)

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

  protected render() {
    let view = this.view

    this.root.render(
      <MantineProvider
        theme={theme}
        {...(prefersDark() && { forceColorScheme: 'dark' })}
        getRootElement={() => this.rootEl}
        cssVariablesSelector=".likec4-shadow-root">
        <LikeC4Diagram
          view={view}
          readonly
          pannable
          zoomable
          fitViewPadding={0.08}
          controls={false}
          nodesSelectable={false}
          nodesDraggable={false}
          keepAspectRatio={false}
          onNavigateTo={({ element, event }) => {
            event.stopPropagation()
            this.setAttribute('view-id', element.navigateTo)
          }}
        />
        <Box p={'md'} pos={'absolute'} top={0} right={0}>
          <CloseButton
            size="lg"
            onClick={(e) => {
              e.stopPropagation()
              this.parentElement?.removeChild(this)
            }}
          />
        </Box>
      </MantineProvider>
    )
  }

  attributeChangedCallback(_name: string) {
    this.render()
  }
}
