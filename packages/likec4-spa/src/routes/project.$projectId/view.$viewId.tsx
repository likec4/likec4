import type { ViewId } from '@likec4/core/types'
import { createFileRoute, Outlet } from '@tanstack/react-router'
import { ErrorComponent } from '../../components/ErrorComponent'
import { NotFound } from '../../components/NotFound'
import { Header } from '../../components/view-page/Header'
import { LikeC4ViewContext } from '../../context/LikeC4ViewContext'

export const Route = createFileRoute('/project/$projectId/view/$viewId')({
  component: ViewLayout,
  errorComponent: ErrorComponent,
  notFoundComponent: () => <NotFound />,
})

function ViewLayout() {
  const { viewId } = Route.useParams()
  return (
    <LikeC4ViewContext viewId={viewId as ViewId}>
      <Outlet />
      <Header />
    </LikeC4ViewContext>
  )
}
