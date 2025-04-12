import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/share/$shareId/')({
  beforeLoad: ({ params }) => {
    throw redirect({
      to: '/share/$shareId/view/$viewId/',
      params: {
        shareId: params.shareId,
        viewId: 'index',
      },
      replace: true,
    })
  },
})
