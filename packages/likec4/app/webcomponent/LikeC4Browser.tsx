import { invariant } from '@likec4/core'
import { LikeC4Diagram } from '@likec4/diagram'
import { MantineProvider, ModalBody, ModalCloseButton, ModalContent, ModalRoot } from '@mantine/core'
import ReactDOM from 'react-dom/client'
import { type DiagramView, type LikeC4ViewId, LikeC4Views } from 'virtual:likec4/views'
import { bundledStyles, matchesColorScheme, theme } from './styles'

// type MiscellaneousProps = {
//   focusTrap: HTMLElement
//   onEscape: () => void
// }
// const Miscellaneous = ({
//   focusTrap,
//   onEscape
// }: MiscellaneousProps) => {
//   const trap = useFocusTrap()

//   useEffect(() => {
//     trap(focusTrap)
//   }, [focusTrap])

//   useHotkeys([
//     ['s', (e) => {
//       console.log('s', e)
//     }],
//     ['escape', (e) => {
//       onEscape()
//     }]
//   ])
//   return null
// }

// const genHostCss = (viewId: string) => `
// :host-context(likec4-browser[view-id="${viewId}"]) {
//   position: fixed;
//   inset: 0;
//   z-index: 9999;
// }`

export class LikeC4Browser extends HTMLElement {
  static observedAttributes = ['view-id']

  private shadowRootEl: HTMLDivElement
  private shadow: ShadowRoot
  private root: ReactDOM.Root | undefined

  private bundledCSS: CSSStyleSheet | undefined
  private hostCss: CSSStyleSheet | undefined

  private lastHostCss = ''

  constructor() {
    super()
    this.shadow = this.attachShadow({ mode: 'open' })
    this.shadow.innerHTML = '<div class="likec4-shadow-root likec4-browser"><div class="likec4-react-root"></div></div>'
    this.shadowRootEl = this.shadow.querySelector('.likec4-shadow-root') as HTMLDivElement
  }

  updateHostCss() {
    const hostCss = `
    :host {
      position: fixed;
      top: 0;
      left: 0;
      padding: 0;
      margin: 0;
      border: 0 solid transparent;
      box-sizing: border-box;
      z-index: 9999;
      width: 100dvw;
      height: 100dvh;
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
    const id = this.getAttribute('view-id') || 'index'
    let view = LikeC4Views[id as LikeC4ViewId]
    if (view) {
      return view
    }

    console.error(`Invalid view id: ${id},\nAvailable: ${Object.keys(LikeC4Views).join(', ')}`)
    view = LikeC4Views['index' as LikeC4ViewId] ?? Object.values(LikeC4Views)[0]
    invariant(view, `Empty LikeC4Views`)
    console.warn(`LikeC4: Falling back to view: ${view.id}`)
    const fallbackViewId = view.id
    setTimeout(() => this.setAttribute('view-id', fallbackViewId), 50)
    return view
  }

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
        getRootElement={() => this.shadowRootEl}
        cssVariablesSelector={'.likec4-shadow-root'}>
        <ModalRoot
          keepMounted
          opened
          lockScroll={false}
          fullScreen
          withinPortal={false}
          onClose={() => this.close()}>
          <ModalContent>
            <ModalCloseButton />
            <ModalBody w={'100%'} h={'100%'} p={0}>
              <LikeC4Diagram
                view={view as any}
                readonly
                pannable
                zoomable
                fitView
                fitViewPadding={0.08}
                showElementLinks
                showDiagramTitle
                controls={false}
                nodesSelectable={false}
                nodesDraggable={false}
                keepAspectRatio={false}
                onNavigateTo={to => {
                  this.setAttribute('view-id', to)
                }}
              />
            </ModalBody>
          </ModalContent>
        </ModalRoot>
      </MantineProvider>
    )
  }

  close() {
    this.parentElement?.removeChild(this)
  }

  attributeChangedCallback(_name: string) {
    if (this.root) {
      this.render()
    }
  }
}
