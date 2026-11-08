import type { ProjectId } from '@likec4/core/types'
import { Button, Container, Stack, Title } from '@mantine/core'
import { createFileRoute, Link, notFound, Outlet, redirect } from '@tanstack/react-router'
import { loadDiffs } from 'likec4:diffs'
import { loadModel } from 'likec4:model'
import { z } from 'zod'
import { ErrorComponent } from '../../components/ErrorComponent'
import { ViewOutlet } from '../../components/ViewOutlet'
import { LikeC4IconRendererContext } from '../../context/LikeC4IconRendererContext'
import { LikeC4ModelContext } from '../../context/LikeC4ModelContext'
import { ModelDiffsContext } from '../../context/ModelDiffsContext'

export const Route = createFileRoute('/project/$projectId')({
  staleTime: Infinity,
  params: z.object({
    projectId: z.string().transform((v) => v as ProjectId),
  }),
  beforeLoad: ({ params }) => ({
    projectId: params.projectId,
  }),
  loader: async ({ params }) => {
    const projectId = params.projectId
    const [likec4model, { $diffs }] = await Promise.all([
      loadModel(projectId).catch((error) => {
        console.error(`Failed to load model for project ${projectId}`, error)
        throw notFound()
      }),
      loadDiffs(projectId),
    ])
    const data = likec4model.$likec4data.value
    if (!data) {
      throw notFound()
    }
    if (data.projectId !== projectId) {
      throw redirect({
        to: '/project/$projectId/',
        search: true,
        params: {
          projectId: data.projectId as ProjectId,
        },
      })
    }
    return {
      $likec4model: likec4model.$likec4model,
      $diffs,
      projectId,
    }
  },
  component: RouteComponent,
  errorComponent: ErrorComponent,
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
