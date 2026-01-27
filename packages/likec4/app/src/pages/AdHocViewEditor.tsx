import type { ProjectId } from '@likec4/core/types'
import { LikeC4AdHocViewEditor } from '@likec4/diagram'
import { likec4rpc } from 'likec4:rpc'

export function AdHocViewEditor({ projectId }: { projectId: ProjectId }) {
  return (
    <LikeC4AdHocViewEditor
      service={{
        process: async ({ predicates }) => {
          const view = await likec4rpc.calcAdhocView({ projectId, predicates })
          return {
            view,
          }
        },
      }} />
  )
}
