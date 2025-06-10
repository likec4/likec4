import { IconRendererProvider } from '@likec4/diagram'
import { Box } from '@mantine/core'
import { createFileRoute, Outlet } from '@tanstack/react-router'
import { $likec4data, $likec4model, IconRenderer } from 'likec4:single-project'
import { ErrorBoundary } from 'react-error-boundary'
import { Fallback } from '../../components/Fallback'
import { LikeC4ModelContext } from '../../context/LikeC4ModelContext'
import * as css from './view.css'

export const Route = createFileRoute('/_single')({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <Box className={css.cssViewOutlet}>
      <ErrorBoundary FallbackComponent={Fallback}>
        <LikeC4ModelContext
          likec4data={$likec4data}
          likec4model={$likec4model}>
          <IconRendererProvider value={IconRenderer}>
            <Outlet />
          </IconRendererProvider>
        </LikeC4ModelContext>
      </ErrorBoundary>
    </Box>
  )
}
