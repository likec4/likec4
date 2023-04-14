import type { DiagramProps } from './Diagram'
import { lazy, Suspense } from 'react'

const Diagram = /* @__PURE__ */ lazy(async () => {
  const m = await import('./Diagram')
  return { default: m.Diagram }
})

export const LazyDiagram = (props: DiagramProps) => (
  <Suspense fallback={null}>
    <Diagram {...props} />
  </Suspense>
)
