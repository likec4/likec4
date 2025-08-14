import type { ProjectId } from '@likec4/core/types'
import { Box, Button, Container, Stack, Title } from '@mantine/core'
import { createFileRoute, Link, notFound, Outlet } from '@tanstack/react-router'
import { ErrorBoundary } from 'react-error-boundary'
import { Fallback } from '../../components/Fallback'
import { LikeC4IconRendererContext } from '../../context/LikeC4IconRendererContext'
import { LikeC4ModelContext } from '../../context/LikeC4ModelContext'
import * as css from '../_single/view.css'

export const Route = createFileRoute('/project/$projectId')({
  staleTime: Infinity,
  beforeLoad: ({ params }) => {
    return {
      projectId: params.projectId as ProjectId,
    }
  },
  loader: async ({ context }) => {
    const { loadModel } = await import('likec4:model')
    const projectId = context.projectId
    try {
      const { $likec4data, $likec4model } = await loadModel(projectId)
      return {
        $likec4data,
        $likec4model,
        projectId,
      }
    } catch (err) {
      console.error(err)
      throw notFound()
    }
  },
  component: RouteComponent,
  notFoundComponent: () => (
    <Box className={css.cssViewOutlet}>
      <Container py={'xl'}>
        <Stack align="flex-start">
          <Title>Project not found</Title>
          <Button component={Link} to="/" search size="md">Open overview</Button>
        </Stack>
      </Container>
    </Box>
  ),
})

function RouteComponent() {
  const navigate = Route.useNavigate()
  const { $likec4data, $likec4model, projectId } = Route.useLoaderData()

  return (
    <Box className={css.cssViewOutlet}>
      <ErrorBoundary FallbackComponent={Fallback}>
        <LikeC4IconRendererContext projectId={projectId}>
          <LikeC4ModelContext likec4data={$likec4data} likec4model={$likec4model}>
            <Outlet />
          </LikeC4ModelContext>
        </LikeC4IconRendererContext>
      </ErrorBoundary>
    </Box>
  )
}
