import { lazy, Suspense } from 'react'

const AIChat = lazy(() => import('./AIChat'))

export function LazyAIChat() {
  return (
    <Suspense>
      <AIChat />
    </Suspense>
  )
}
