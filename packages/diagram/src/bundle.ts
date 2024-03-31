// dprint-ignore
// import '@xyflow/react/dist/style.css'
// import './index.css'

import { useIsomorphicLayoutEffect } from "@react-hookz/web"

// export { LikeC4Diagram } from './LikeC4Diagram'
// export { StaticLikeC4Diagram } from './StaticLikeC4Diagram'
// export { EmbeddedLikeC4Diagram } from './EmbeddedLikeC4Diagram'

// export type * from './xyflow/types'
// export type * from './LikeC4Diagram.props'
// export type * from './LikeC4Diagram'
// export type * from './StaticLikeC4Diagram'
// export type * from './EmbeddedLikeC4Diagram'

// import { useIsomorphicLayoutEffect } from "@react-hookz/web"

export function Styles(): string {
  // @ts-expect-error replaced by vite-plugin
  return SHADOW_STYLE
}

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
      style.innerHTML = Styles()
      style.setAttribute('data-likec4-styles', '')
      document.head.appendChild(style)
      hasStyleSheet = () => true
    }
  }, [])
}
