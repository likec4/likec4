import { createFileRoute, Navigate } from '@tanstack/react-router'

export const Route = createFileRoute('/project/$projectId/')({
  component: () => {
    const { projectId } = Route.useParams()
    return (
      <Navigate
        to="/project/$projectId/view/$viewId/"
        replace
        params={{
          projectId,
          viewId: 'index',
        }} />
    )
  },
})
