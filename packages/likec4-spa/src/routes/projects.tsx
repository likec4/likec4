import { Box } from '@likec4/styles/jsx'
import { useDocumentTitle } from '@mantine/hooks'
import { createFileRoute, redirect, stripSearchParams } from '@tanstack/react-router'
import { pageTitle } from 'likec4:app-config'
import { lazy } from 'react'
import { z } from 'zod'

const WorkspaceOverviewPage = lazy(async () => {
  const { WorkspaceOverviewPage } = await import('../pages/WorkspaceOverview')
  return {
    default: WorkspaceOverviewPage,
  }
})

export const Route = createFileRoute('/projects')({
  validateSearch: z.object({
    view: z.enum(['cards', 'table', 'map']).optional().catch('cards'),
  }),
  search: {
    middlewares: [
      stripSearchParams({
        view: 'cards',
      }),
    ],
  },
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
  const view = Route.useSearch({ select: s => s.view ?? 'cards' })
  const navigate = Route.useNavigate()
  return (
    <Box w={'100%'} h={'100%'} overflow={'hidden'}>
      <WorkspaceOverviewPage
        view={view}
        onViewChange={next => {
          void navigate({ search: prev => ({ ...prev, view: next }), replace: true })
        }}
      />
    </Box>
  )
}
