import { createFileRoute, Navigate } from '@tanstack/react-router'

export const Route = createFileRoute('/w/$workspaceId/')({
  component: () => {
    return <Navigate from="/w/$workspaceId/" to="$viewId/" params={{ viewId: 'index' }} />
  },
})
