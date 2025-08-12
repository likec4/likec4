import { IconRendererProvider, LikeC4ProjectsProvider } from '@likec4/diagram'
import { Box, Button, Container, Stack, Title } from '@mantine/core'
import { createFileRoute, Link, notFound, Outlet } from '@tanstack/react-router'
import { loadModel } from 'likec4:model'
import { projects } from 'likec4:projects'
import { ErrorBoundary } from 'react-error-boundary'
import { Fallback } from '../../components/Fallback'
import { LikeC4ModelContext } from '../../context/LikeC4ModelContext'
import * as css from '../_single/view.css'

export const Route = createFileRoute('/project/$projectId')({
  staleTime: Infinity,
  loader: async ({ params }) => {
    if (!projects.some(project => project.id === params.projectId)) {
      throw notFound()
    }
    const [{ $likec4data, $likec4model }, ProjectIcons] = await Promise.all([
      loadModel(params.projectId),
      import('likec4:icons').then((module) => module.ProjectIcons),
    ])
    return {
      $likec4data,
      $likec4model,
      IconRenderer: ProjectIcons(params.projectId),
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
  const { $likec4data, $likec4model, IconRenderer } = Route.useLoaderData()

  return (
    <Box className={css.cssViewOutlet}>
      <ErrorBoundary FallbackComponent={Fallback}>
        <LikeC4ProjectsProvider
          projects={projects}
          onProjectChange={projectId =>
            navigate({
              to: `./`,
              params: {
                projectId,
              },
            })}>
          <LikeC4ModelContext likec4data={$likec4data} likec4model={$likec4model}>
            <IconRendererProvider value={IconRenderer}>
              <Outlet />
            </IconRendererProvider>
          </LikeC4ModelContext>
        </LikeC4ProjectsProvider>
      </ErrorBoundary>
    </Box>
  )
}
