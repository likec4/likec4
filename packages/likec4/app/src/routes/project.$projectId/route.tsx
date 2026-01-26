import type { ProjectId } from '@likec4/core/types'
import { Button, Container, Stack, Title } from '@mantine/core'
import { createFileRoute, Link, notFound, Outlet, redirect } from '@tanstack/react-router'
import { ErrorBoundary } from 'react-error-boundary'
import { Fallback } from '../../components/Fallback'
import { ViewOutlet } from '../../components/ViewOutlet'
import { LikeC4IconRendererContext } from '../../context/LikeC4IconRendererContext'
import { LikeC4ModelContext } from '../../context/LikeC4ModelContext'

export const Route = createFileRoute('/project/$projectId')({
  staleTime: Infinity,
  beforeLoad: ({ params }) => {
    return {
      projectId: params.projectId as ProjectId,
    }
  },
  loader: async ({ context }) => {
    const projectId = context.projectId
    return await import('likec4:model')
      .then(m => m.loadModel(projectId))
      .catch(err => {
        console.error(err)
        throw notFound()
      })
      .then(likec4model => {
        const data = likec4model.$likec4data.value
        if (!data) {
          throw notFound()
        }
        if (data.projectId !== projectId) {
          throw redirect({
            to: '/project/$projectId/',
            search: true,
            params: {
              projectId: data.projectId,
            },
          })
        }
        return {
          $likec4model: likec4model.$likec4model,
          projectId,
        }
      })
  },
  component: RouteComponent,
  notFoundComponent: () => (
    <ViewOutlet>
      <Container py={'xl'}>
        <Stack align="flex-start">
          <Title>Project not found</Title>
          <Button component={Link} to="/" search size="md">Open overview</Button>
        </Stack>
      </Container>
    </ViewOutlet>
  ),
})

function RouteComponent() {
  const { $likec4model, projectId } = Route.useLoaderData()
  return (
    <ViewOutlet>
      <ErrorBoundary FallbackComponent={Fallback}>
        <LikeC4IconRendererContext projectId={projectId}>
          <LikeC4ModelContext likec4model={$likec4model}>
            <ErrorBoundary FallbackComponent={Fallback}>
              <Outlet />
            </ErrorBoundary>
          </LikeC4ModelContext>
        </LikeC4IconRendererContext>
      </ErrorBoundary>
    </ViewOutlet>
  )
}
