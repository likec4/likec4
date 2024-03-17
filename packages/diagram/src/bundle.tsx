import '@mantine/core/styles.css'
import '@xyflow/react/dist/style.css'

import { MantineProvider } from '@mantine/core'
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { LikeC4Diagram } from './LikeC4Diagram'
import type { LikeC4DiagramEventHandlers, LikeC4DiagramProps } from './LikeC4Diagram.props'

export * from './LikeC4Diagram'
export * from './LikeC4View'

export type * from './LikeC4Diagram.props'
export type * from './xyflow/types'

export const Styles: string =
  // @ts-expect-error invalid typings ReactFlow
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
