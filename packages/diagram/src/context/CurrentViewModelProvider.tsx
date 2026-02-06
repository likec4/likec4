import type { PropsWithChildren } from 'react'
import { useCurrentViewId } from '../hooks/useCurrentView'
import { CurrentViewModelContext, useOptionalLikeC4Model } from './LikeC4ModelContext'

export function CurrentViewModelProvider({ children }: PropsWithChildren) {
  {/* Important - we use "viewId" from actor context, not from props */}
  const viewId = useCurrentViewId()
  const likec4model = useOptionalLikeC4Model()
  const viewmodel = likec4model?.findView(viewId) ?? null
  return (
    <CurrentViewModelContext value={viewmodel}>
      {children}
    </CurrentViewModelContext>
  )
}
