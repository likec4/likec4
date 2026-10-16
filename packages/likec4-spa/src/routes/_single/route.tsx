import { createFileRoute, notFound, Outlet } from '@tanstack/react-router'
import { loadDiffs } from 'likec4:diffs'
import { loadModel } from 'likec4:model'
import { ErrorComponent } from '../../components/ErrorComponent'
import { ViewOutlet } from '../../components/ViewOutlet'
import { LikeC4IconRendererContext } from '../../context/LikeC4IconRendererContext'
import { LikeC4ModelContext } from '../../context/LikeC4ModelContext'
import { ModelDiffsContext } from '../../context/ModelDiffsContext'

export const Route = createFileRoute('/_single')({
  staleTime: Infinity,
  loader: async ({ context }) => {
    const projectId = context.projectId
    const [data, { $diffs }] = await Promise.all([loadModel(projectId), loadDiffs(projectId)])
    const modelData = data.$likec4data.value
    if (!modelData) {
      throw notFound()
    }
    return {
      $likec4model: data.$likec4model,
      $diffs,
      projectId,
    }
  },
  component: RouteComponent,
  errorComponent: ErrorComponent,
})

function RouteComponent() {
  const { $likec4model, $diffs, projectId } = Route.useLoaderData()
  return (
    <ViewOutlet>
      <LikeC4IconRendererContext projectId={projectId}>
        <LikeC4ModelContext likec4model={$likec4model}>
          <ModelDiffsContext diffs={$diffs}>
            <Outlet />
          </ModelDiffsContext>
        </LikeC4ModelContext>
      </LikeC4IconRendererContext>
    </ViewOutlet>
  )
}
