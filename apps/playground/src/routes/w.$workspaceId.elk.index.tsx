import { createFileRoute, Navigate } from '@tanstack/react-router'

export const Route = createFileRoute('/w/$workspaceId/elk/')({
  component: () => {
    return <Navigate from="/w/$workspaceId/elk" to="$viewId/" params={{ viewId: 'index' }} />
  },
})
