import { createFileRoute, Outlet } from '@tanstack/react-router'
import { ErrorBoundary } from 'react-error-boundary'
import { Fallback } from '../../components/Fallback'
import { LikeC4IconRendererContext } from '../../context/LikeC4IconRendererContext'
import { LikeC4ModelContext } from '../../context/LikeC4ModelContext'
import * as css from './view.css'

export const Route = createFileRoute('/_single')({
  staleTime: Infinity,
  loader: async ({ context }) => {
    const { loadModel } = await import('likec4:model')
    const projectId = context.projectId
    const { $likec4data, $likec4model } = await loadModel(projectId)
    return {
      $likec4data,
      $likec4model,
      projectId,
    }
  },
  component: RouteComponent,
})

function RouteComponent() {
  const { $likec4data, $likec4model, projectId } = Route.useLoaderData()
  return (
    <div className={css.cssViewOutlet}>
      <ErrorBoundary FallbackComponent={Fallback}>
        <LikeC4IconRendererContext projectId={projectId}>
          <LikeC4ModelContext
            likec4data={$likec4data}
            likec4model={$likec4model}>
            <Outlet />
          </LikeC4ModelContext>
        </LikeC4IconRendererContext>
      </ErrorBoundary>
    </div>
  )
}
