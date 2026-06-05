import { isAIAvailable } from 'likec4:rpc'
import { lazy, Suspense } from 'react'

const AIChat = /* @__PURE__ */ lazy(() => import('./AIChat'))

/**
 * AI Chat component that is conditionally rendered based on AI availability
 * Uses lazy loading to avoid importing AI components in environments where AI is not available
 */
export const LazyAIChat = /* @__PURE__ */ isAIAvailable ?
  () => (
    <Suspense>
      <AIChat />
    </Suspense>
  ) :
  () => null
