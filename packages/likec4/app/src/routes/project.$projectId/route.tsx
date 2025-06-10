import { IconRendererProvider } from '@likec4/diagram'
import { Box } from '@mantine/core'
import { createFileRoute, Outlet } from '@tanstack/react-router'
import { ProjectIcons } from 'likec4:icons'
import { loadModel } from 'likec4:model'
import { ErrorBoundary } from 'react-error-boundary'
import { Fallback } from '../../components/Fallback'
import { LikeC4ModelContext } from '../../context/LikeC4ModelContext'
import * as css from '../_single/view.css'

export const Route = createFileRoute('/project/$projectId')({
  staleTime: Infinity,
  loader: async ({ params }) => {
    const { $likec4data, $likec4model } = await loadModel(params.projectId)
    return {
      $likec4data,
      $likec4model,
      IconRenderer: ProjectIcons(params.projectId),
    }
  },
  component: RouteComponent,
})

function RouteComponent() {
  const { $likec4data, $likec4model, IconRenderer } = Route.useLoaderData()

  return (
    <Box className={css.cssViewOutlet}>
      <ErrorBoundary FallbackComponent={Fallback}>
        <LikeC4ModelContext likec4data={$likec4data} likec4model={$likec4model}>
          <IconRendererProvider value={IconRenderer}>
            <Outlet />
          </IconRendererProvider>
        </LikeC4ModelContext>
      </ErrorBoundary>
    </Box>
  )
}
