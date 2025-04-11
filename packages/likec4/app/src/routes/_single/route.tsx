import { IconRendererProvider } from '@likec4/diagram'
import { Box } from '@mantine/core'
import { createFileRoute, Outlet } from '@tanstack/react-router'
import { ErrorBoundary } from 'react-error-boundary'
import { Fallback } from '../../components/Fallback'
import { LikeC4ModelContext } from '../../context/LikeC4ModelContext'
import * as css from './view.css'

export const Route = createFileRoute('/_single')({
  loader: async ({ params }) => {
    return await import('likec4:single-project')
  },
  component: RouteComponent,
})

function RouteComponent() {
  const { $likec4data, IconRenderer } = Route.useLoaderData()

  return (
    <Box className={css.cssViewOutlet}>
      <ErrorBoundary FallbackComponent={Fallback}>
        <LikeC4ModelContext likec4data={$likec4data}>
          <IconRendererProvider value={IconRenderer}>
            <Outlet />
          </IconRendererProvider>
        </LikeC4ModelContext>
      </ErrorBoundary>
    </Box>
  )
}
