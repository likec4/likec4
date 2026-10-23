import type { ViewId } from '@likec4/core/types'
import { LikeC4ModelProvider, useLikeC4Model } from '@likec4/diagram'
import { type PropsWithChildren, useMemo } from 'react'
import { compareLookupModel } from './compare-model'
import { useCompareView } from './ModelDiffPanel'
import { useModelDiffState } from './state'

/**
 * While a diff is selected, detail popups read the model that matches the compare view.
 */
export function CompareModelProvider({ viewId, children }: PropsWithChildren<{ viewId: ViewId }>) {
  const before = useLikeC4Model()
  const compareView = useCompareView(viewId)
  const { diffId, mode } = useModelDiffState()
  const model = useMemo(
    () => compareView && diffId ? compareLookupModel(before, { diffId, mode, view: compareView }) : before,
    [before, compareView, diffId, mode],
  )
  return <LikeC4ModelProvider likec4model={model}>{children}</LikeC4ModelProvider>
}
