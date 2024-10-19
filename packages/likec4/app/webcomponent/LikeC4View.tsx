import { invariant, type ViewID } from '@likec4/core'
import { LikeC4Diagram, LikeC4ModelProvider } from '@likec4/diagram'
import { MantineProvider } from '@mantine/core'
import { createRoot, type Root } from 'react-dom/client'
import { type DiagramView, likec4model, type LikeC4ViewId, LikeC4Views } from 'virtual:likec4/model'
import { ComponentName } from './const'
import { RenderIcon } from './RenderIcon'
import { bundledStyles, matchesColorScheme, theme } from './styles'

export class LikeC4View extends HTMLElement {
  static observedAttributes = ['view-id', 'interactive']

  private rootEl: HTMLDivElement
  private shadow: ShadowRoot
  private root: Root | undefined

  private bundledCSS: CSSStyleSheet | undefined
  private hostCss: CSSStyleSheet | undefined
  private lastHostCss = ''

  constructor() {
    super()
    this.shadow = this.attachShadow({ mode: 'open' })
    this.shadow.innerHTML = '<div class="likec4-shadow-root likec4-view"><div class="likec4-react-root"></div></div>'
    this.rootEl = this.shadow.querySelector('.likec4-shadow-root') as HTMLDivElement
  }

  updateHostCss() {
    const view = this.view
    const { width, height } = view.bounds
    const isLandscape = width > height
    const hostCss = this.isKeepAspectRatio
      ? `
    :host {
      display: block;
      background-color: transparent;
      box-sizing: border-box;
      border: 0 solid transparent;
      padding: 0;
      ${
        isLandscape ? '' : `
      margin-left: auto;
      margin-right: auto;`
      }
      width: ${isLandscape ? '100%' : 'auto'};
      width: -webkit-fill-available;
      height: ${isLandscape ? 'auto' : '100%'};
      height: -webkit-fill-available;
      ${
        isLandscape ? '' : `
      min-height: 100px;`
      }
      aspect-ratio: ${Math.ceil(width)} / ${Math.ceil(height)};
      max-height: var(--likec4-view-max-height, ${Math.ceil(height * 1.05)}px);
    }`
      : `
    :host {
      display: block;
      background-color: transparent;
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
    if (view) {
      return view
    }

    console.error(`Invalid view id: ${viewId},\nAvailable: ${Object.keys(LikeC4Views).join(', ')}`)
    view = LikeC4Views['index' as LikeC4ViewId] ?? Object.values(LikeC4Views)[0]
    invariant(view, `Empty LikeC4Views`)
    console.warn(`LikeC4: Falling back to view: ${view.id}`)
    const fallbackViewId = view.id
    setTimeout(() => this.setAttribute('view-id', fallbackViewId), 50)
    return view
  }

  protected isKeepAspectRatio = true

  protected render() {
    let view = this.view

    this.updateHostCss()

    this.root ??= createRoot(this.shadow.querySelector('.likec4-react-root')!)

    const colorScheme = matchesColorScheme(this)

    this.root.render(
      <MantineProvider
        theme={theme}
        defaultColorScheme={'auto'}
        {...(colorScheme && { forceColorScheme: colorScheme })}
        getRootElement={() => this.rootEl}
        cssVariablesSelector={'.likec4-shadow-root'}>
        <LikeC4ModelProvider likec4model={likec4model}>
          <LikeC4Diagram
            view={view as any}
            readonly
            pannable={false}
            zoomable={false}
            background={'transparent'}
            fitView
            fitViewPadding={0.01}
            showElementLinks={false}
            showDiagramTitle={false}
            showNavigationButtons={false}
            showRelationshipDetails={false}
            enableDynamicViewWalkthrough={false}
            enableRelationshipsBrowser={false}
            experimentalEdgeEditing={false}
            enableFocusMode={false}
            showNotations={false}
            controls={false}
            nodesSelectable={false}
            keepAspectRatio={false}
            renderIcon={RenderIcon}
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
        </LikeC4ModelProvider>
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
