import { Box } from '@likec4/styles/jsx'
import { useDocumentTitle } from '@mantine/hooks'
import { createFileRoute, redirect } from '@tanstack/react-router'
import { lazy } from 'react'
import { pageTitle } from '../const'

const ProjectsOverviewPage = lazy(async () => {
  const { ProjectsOverviewPage } = await import('../pages/ProjectsOverview')
  return {
    default: ProjectsOverviewPage,
  }
})

export const Route = createFileRoute('/projects')({
  beforeLoad: async ({ context }) => {
    if (context.projects.length < 2) {
      throw redirect({
        to: '/single-index/',
      })
    }
  },
  component: RouteComponent,
  wrapInSuspense: true,
})

function RouteComponent() {
  useDocumentTitle(`Projects - ${pageTitle}`)
  return (
    <Box w={'100%'} h={'100%'} overflow={'hidden'}>
      <ProjectsOverviewPage />
    </Box>
  )
}
