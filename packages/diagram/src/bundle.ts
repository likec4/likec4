import { useIsomorphicLayoutEffect } from '@react-hookz/web'
import '@xyflow/react/dist/style.css'
import './index.css'

export type * from './EmbeddedLikeC4Diagram'
export type * from './LikeC4Diagram'
export type * from './LikeC4Diagram.props'
export type * from './StaticLikeC4Diagram'
export type * from './xyflow/types'

export * from './EmbeddedLikeC4Diagram'
export * from './LikeC4Diagram'
export * from './StaticLikeC4Diagram'

export const Styles: string =
  // @ts-expect-error replaced by vite-plugin
  SHADOW_STYLE

// //
// type Props = LikeC4DiagramProps & LikeC4DiagramEventHandlers
// export function LikeC4DiagramShadow(props: Props) {
//   // const ref = useRef<HTMLDivElement>(null)
//   // const [shadowRoot, setShadowRoot] = useState<ShadowRoot | null>(null)
//   // const rootRef = useRef<HTMLDivElement>()

//   // useLayoutEffect(() => {
//   //   if (!ref.current || ref.current.shadowRoot) {
//   //     return
//   //   }
//   //   const shadow = ref.current.attachShadow({ mode: 'open' })
//   //   setShadowRoot(shadowRoot)
//   //   shadow.innerHTML = `<style type="text/css">${Styles}</style>`
//   //   const renderIn = document.createElement('div')
//   //   // append the renderIn element inside the shadow
//   //   shadow.appendChild(renderIn)
//   //   rootRef.current = renderIn
//   //   return () => {
//   //     // rootRef.current = undefined
//   //   }
//   // }, [])

//   // return <div ref={ref}>{rootRef.current && createPortal(<LikeC4Diagram {...props} />, rootRef.current)}</div>
//   return (
//     <template>
//       <style type="text/css">{`
//       :host {
//         display: block;
//         width: 100%;
//         height: 100%;
//       }
//       `}</style>
//       <style type="text/css">{Styles}</style>
//       <MantineProvider>
//         <LikeC4Diagram {...props} />
//       </MantineProvider>
//     </template>
//   )
// }

let hasStyleSheet = () => {
  for (const sheet of document.styleSheets) {
    const node = sheet.ownerNode
    if (node && 'hasAttribute' in node && node.hasAttribute('data-likec4-styles')) {
      return true
    }
  }
  return false
}

export function useInjectStyles() {
  useIsomorphicLayoutEffect(() => {
    if (!hasStyleSheet()) {
      const style = document.createElement('style')
      style.innerHTML = Styles
      style.setAttribute('data-likec4-styles', '')
      document.head.appendChild(style)
      hasStyleSheet = () => true
    }
  }, [])
}
