import { createFileRoute, Outlet } from '@tanstack/react-router'
import { loadModel } from 'likec4:model'
import { ErrorBoundary } from 'react-error-boundary'
import { Fallback } from '../../components/Fallback'
import { ViewOutlet } from '../../components/ViewOutlet'
import { LikeC4IconRendererContext } from '../../context/LikeC4IconRendererContext'
import { LikeC4ModelContext } from '../../context/LikeC4ModelContext'

export const Route = createFileRoute('/_single')({
  staleTime: Infinity,
  loaderDeps() {
    return []
  },
  loader: async ({ context }) => {
    const projectId = context.projectId
    const data = await loadModel(projectId)
    return {
      $likec4model: data.$likec4model,
      projectId,
    }
  },
  component: RouteComponent,
})

function RouteComponent() {
  const { $likec4model, projectId } = Route.useLoaderData()
  return (
    <ViewOutlet>
      <ErrorBoundary FallbackComponent={Fallback}>
        <LikeC4IconRendererContext projectId={projectId}>
          <LikeC4ModelContext likec4model={$likec4model}>
            <Outlet />
          </LikeC4ModelContext>
        </LikeC4IconRendererContext>
      </ErrorBoundary>
    </ViewOutlet>
  )
}
