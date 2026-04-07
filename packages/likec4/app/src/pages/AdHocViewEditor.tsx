import type { ProjectId } from '@likec4/core/types'
import { likec4rpc } from 'likec4:rpc'
import { lazy, Suspense } from 'react'

const AdHocViewEditorImpl = lazy(async () => {
  const { LikeC4AdHocViewEditor } = await import('@likec4/diagram/adhoc-editor')
  return { default: LikeC4AdHocViewEditor }
})

export function AdHocViewEditor({ projectId }: { projectId: ProjectId }) {
  return (
    <Suspense>
      <AdHocViewEditorImpl
        service={{
          process: async ({ predicates }) => {
            const view = await likec4rpc.calcAdhocView({ projectId, predicates })
            return {
              view,
            }
          },
        }} />
    </Suspense>
  )
}
