import { createFileRoute, Navigate, useParams } from '@tanstack/react-router'

export const Route = createFileRoute('/w/$id/')({
  component: () => {
    const { id } = Route.useParams()
    return (
      <Navigate
        to="/w/$id/$/"
        params={{
          id,
          _splat: 'index'
        }} />
    )
  }
})
