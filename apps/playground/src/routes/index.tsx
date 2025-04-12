import { createFileRoute, Navigate } from '@tanstack/react-router'

// export const Route = createFileRoute('/')({
//   component: IndexRoute,
// })

export const Route = createFileRoute('/')({
  component: () => {
    return <Navigate to="/w/$workspaceId/" params={{ workspaceId: 'tutorial' }} />
  },
})
