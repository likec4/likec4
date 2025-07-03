import { type PropsWithChildren, useEffect, useState } from 'react'
import { CurrentViewModelContext } from './LikeC4ModelContext'
import { useLikeC4Model } from './useLikeC4Model'

export type CurrentViewModelProviderProps = PropsWithChildren<{
  viewId: string
}>

/**
 * Ensures LikeC4Model context
 */
export function CurrentViewModelProvider({
  children,
  viewId,
}: CurrentViewModelProviderProps) {
  const likec4model = useLikeC4Model()
  const [viewmodel, setViewmodel] = useState(() => likec4model.findView(viewId))

  useEffect(() => {
    setViewmodel(likec4model.findView(viewId))
  }, [likec4model, viewId])

  if (!viewmodel) {
    throw new Error(`View "${viewId}" not found`)
  }
  if (!viewmodel.isDiagram()) {
    throw new Error(`View "${viewId}" is not diagram`)
  }
  return (
    <CurrentViewModelContext.Provider value={viewmodel}>
      {children}
    </CurrentViewModelContext.Provider>
  )
}
