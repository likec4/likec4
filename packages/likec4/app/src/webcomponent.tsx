import { LikeC4View as ReactLikeC4View } from 'likec4:react'
import { type Root, createRoot } from 'react-dom/client'
import { ComponentName } from './const'

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

  attributeChangedCallback(_name: string) {
    if (this.root) {
      this.render()
    }
  }
}

customElements.define(ComponentName.View, LikeC4View)
