import type { ProjectId, ViewId } from '@likec4/core/types'
import { ifilter, imap, toArray } from '@likec4/core/utils'
import { computed } from '@likec4/vite-plugin/internal'
import { useStore } from '@nanostores/react'
import { loadModel } from 'likec4:model'
import { use, useMemo } from 'react'
import { isDeepEqual, pipe } from 'remeda'

export interface DriftedView {
  readonly id: ViewId
  readonly title: string
  readonly type: 'element' | 'deployment' | 'dynamic'
}

/**
 * Views of the project whose manual layout drifted from the model.
 * Suspends until the project model is loaded
 */
export function useProjectDrifts(projectId: ProjectId): ReadonlyArray<DriftedView> {
  // loadModel returns a stable promise
  const { $likec4model } = use(loadModel(projectId))

  const $drifts = useMemo(
    () => {
      const result = computed(
        $likec4model,
        (model): DriftedView[] =>
          model.hasManualLayouts()
            ? pipe(
              model.views(),
              ifilter(v => v.hasLayoutDrifts),
              imap(v => ({
                id: v.id,
                title: v.titleOrId,
                type: v._type,
              })),
              toArray(),
            )
            : [],
      )
      result.eq = isDeepEqual
      return result
    },
    [$likec4model],
  )

  return useStore($drifts)
}
