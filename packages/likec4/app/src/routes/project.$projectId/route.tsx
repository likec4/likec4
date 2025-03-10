import { IconRendererProvider } from '@likec4/diagram'
import { Box } from '@mantine/core'
import { createFileRoute, Outlet } from '@tanstack/react-router'
import { ErrorBoundary } from 'react-error-boundary'
import { ProjectIcons } from 'virtual:likec4/icons'
import { loadModel } from 'virtual:likec4/model'
import { Fallback } from '../../components/Fallback'
import { LikeC4ModelContext } from '../../context/LikeC4ModelContext'
import * as css from '../_single/view.css'

export const Route = createFileRoute('/project/$projectId')({
  loader: async ({ params }) => {
    const { $likec4data } = await loadModel(params.projectId)
    return {
      $likec4data,
      IconRenderer: ProjectIcons(params.projectId),
    }
  },
  component: RouteComponent,
})

function RouteComponent() {
  const { $likec4data, IconRenderer } = Route.useLoaderData()

  return (
    <LikeC4ModelContext likec4data={$likec4data}>
      <Box className={css.cssViewOutlet}>
        <ErrorBoundary FallbackComponent={Fallback}>
          <IconRendererProvider value={IconRenderer}>
            <Outlet />
          </IconRendererProvider>
        </ErrorBoundary>
      </Box>
    </LikeC4ModelContext>
  )
}
