import type { DiagramView } from '@likec4/core/types'
import type { DiagramBrowserProps } from './Browser'
import { lazy, Suspense } from 'react'

const DiagramBrowser = /* @__PURE__ */ lazy(async () => {
  const m = await import('./Browser')
  return { default: m.DiagramBrowser }
})

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const LazyDiagramBrowser = <Views extends Record<any, DiagramView>>(props: DiagramBrowserProps<Views>) => (
  <Suspense fallback={null}>
    <DiagramBrowser {...props} />
  </Suspense>
)
