import { IconRendererProvider, LikeC4ProjectsProvider } from '@likec4/diagram'
import { Box } from '@mantine/core'
import { createFileRoute, Outlet } from '@tanstack/react-router'
import { loadModel } from 'likec4:model'
import { projects } from 'likec4:projects'
import { ErrorBoundary } from 'react-error-boundary'
import { Fallback } from '../../components/Fallback'
import { LikeC4ModelContext } from '../../context/LikeC4ModelContext'
import * as css from './view.css'

export const Route = createFileRoute('/_single')({
  staleTime: Infinity,
  beforeLoad: ({}) => ({
    projectId: projects[0].id,
  }),
  loader: async ({ context }) => {
    const projectId = context.projectId
    const [{ $likec4data, $likec4model }, ProjectIcons] = await Promise.all([
      loadModel(projectId),
      import('likec4:icons').then((module) => module.ProjectIcons),
    ])
    return {
      $likec4data,
      $likec4model,
      IconRenderer: ProjectIcons(projectId),
    }
  },
  component: RouteComponent,
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
              to: `/project/$projectId/`,
              params: {
                projectId,
              },
            })}>
          <LikeC4ModelContext
            likec4data={$likec4data}
            likec4model={$likec4model}>
            <IconRendererProvider value={IconRenderer}>
              <Outlet />
            </IconRendererProvider>
          </LikeC4ModelContext>
        </LikeC4ProjectsProvider>
      </ErrorBoundary>
    </Box>
  )
}
