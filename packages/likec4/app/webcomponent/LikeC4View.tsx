import {
  type LikeC4ViewProps,
  LikeC4ModelProvider,
  LikeC4View as GenericLikeC4View,
} from 'likec4/react'
import { type Root, createRoot } from 'react-dom/client'
import { Icons } from 'virtual:likec4/icons'
import { likeC4Model } from 'virtual:likec4/model'

type IconRendererProps = {
  node: {
    id: string
    title: string
    icon?: string | null | undefined
  }
}

const RenderIcon = ({ node }: IconRendererProps) => {
  const IconComponent = Icons[node.icon ?? '']
  return IconComponent ? <IconComponent /> : null
}

function ReactLikeC4View(props: LikeC4ViewProps<string, string, string>) {
  return (
    <LikeC4ModelProvider likec4model={likeC4Model}>
      <GenericLikeC4View
        renderIcon={RenderIcon}
        {...props} />
    </LikeC4ModelProvider>
  )
}

export class LikeC4View extends HTMLElement {
  static observedAttributes = ['view-id', 'browser']

  private rootEl: HTMLDivElement | undefined
  private shadow: ShadowRoot
  private root: Root | undefined

  private hostCss: CSSStyleSheet | undefined
  private lastHostCss = ''

  constructor() {
    super()
    this.shadow = this.attachShadow({ mode: 'open', delegatesFocus: true })
    // this.shadow.innerHTML = '<div class="likec4-shadow-root"></div>'
  }

  updateHostCss() {
    const hostCss = `
    :host {
      display: block;
      position: relative;
      background-color: transparent;
      width: 100%;
      height: 100%;
      box-sizing: border-box;
      overflow: hidden;
      border: 0px solid transparent;
      padding: 0;
    }`
    if (hostCss !== this.lastHostCss) {
      this.hostCss?.replaceSync(hostCss)
      this.lastHostCss = hostCss
    }
  }

  connectedCallback() {
    this.lastHostCss = ''
    this.hostCss = new CSSStyleSheet()
    this.updateHostCss()

    this.shadow.adoptedStyleSheets = [
      this.hostCss,
    ]
    this.render()
  }

  disconnectedCallback() {
    this.root?.unmount()
    this.root = undefined
    this.shadow.adoptedStyleSheets.length = 0
    this.hostCss = undefined
  }

  // protected get view(): DiagramView {
  //   const viewId = this.getAttribute('view-id') ?? 'index'
  //   let view = LikeC4Views[viewId as LikeC4ViewId]
  //   if (view) {
  //     return view
  //   }

  //   console.error(`Invalid view id: ${viewId},\nAvailable: ${Object.keys(LikeC4Views).join(', ')}`)
  //   view = LikeC4Views['index' as LikeC4ViewId] ?? Object.values(LikeC4Views)[0]
  //   invariant(view, `Empty LikeC4Views`)
  //   console.warn(`LikeC4: Falling back to view: ${view.id}`)
  //   const fallbackViewId = view.id
  //   setTimeout(() => this.setAttribute('view-id', fallbackViewId), 50)
  //   return view
  // }

  protected render() {
    const viewId = this.getAttribute('view-id') ?? 'index'
    const browserAttr = this.getAttribute('browser') ?? 'true'

    const browser = browserAttr !== 'false'

    this.updateHostCss()

    // this.rootEl ??= this.shadow.querySelector('.likec4-shadow-root') as HTMLDivElement
    this.root ??= createRoot(this.shadow)

    this.root.render(
      <ReactLikeC4View viewId={viewId} browser={browser} />,
    )
  }

  // openBrowser(viewId?: ViewId) {
  //   const fs = document.createElement(ComponentName.Browser)
  //   fs.setAttribute('view-id', viewId ?? this.view.id)
  //   document.body.appendChild(fs)
  // }

  attributeChangedCallback(_name: string) {
    if (this.root) {
      this.render()
    }
  }
}
