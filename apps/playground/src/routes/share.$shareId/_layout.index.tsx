import { createFileRoute, Navigate } from '@tanstack/react-router'

export const Route = createFileRoute('/share/$shareId/_layout/')({
  component: ({ params }) => {
    return (
      <Navigate
        to={'/share/$shareId/view/$viewId/'}
        params={{
          ...params,
          viewId: 'index',
        }} />
    )
  },
})
