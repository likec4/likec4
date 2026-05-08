import { lazy, Suspense } from 'react'

const LazyAIChat = lazy(() => import('./AIChat'))

export function AIChat() {
  return (
    <Suspense>
      <LazyAIChat />
    </Suspense>
  )
}

export { SemanticLayoutLog } from './SemanticLayoutLog'
