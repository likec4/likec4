import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/project/$projectId/')({
  beforeLoad: ({ params }) => {
    throw redirect({
      to: '/project/$projectId/view/$viewId/',
      replace: true,
      params: {
        projectId: params.projectId,
        viewId: 'index',
      },
    })
  },
})
