import { api } from '$/api'
import { type LayoutedLikeC4Model, LikeC4Model } from '@likec4/core'
import { LikeC4ModelProvider } from '@likec4/diagram'
import { createFileRoute, Navigate, Outlet } from '@tanstack/react-router'
import { useMemo } from 'react'

export const Route = createFileRoute('/share/$shareId/_layout')({
  component: RouteComponent,
  loader: async ({ params: param }) => await api.share.get({ param }),
  notFoundComponent: () => {
    const { shareId } = Route.useParams()
    return (
      <Navigate
        to={'/share/$shareId/not-found/'}
        params={{ shareId }} />
    )
  },
})

function RouteComponent() {
  const sharedPlayground = Route.useLoaderData()
  const likec4model = useMemo(() => LikeC4Model.create(sharedPlayground.model as LayoutedLikeC4Model), [
    sharedPlayground.model,
  ])
  return (
    <LikeC4ModelProvider likec4model={likec4model}>
      <Outlet />
    </LikeC4ModelProvider>
  )
}
