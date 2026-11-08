import { createFileRoute, Outlet } from '@tanstack/react-router'
import { ErrorComponent } from '../../components/ErrorComponent'
import { NotFound } from '../../components/NotFound'
import { Header } from '../../components/view-page/Header'

export const Route = createFileRoute('/project/$projectId/view/$viewId')({
  component: ViewLayout,
  errorComponent: ErrorComponent,
  notFoundComponent: () => <NotFound />,
})

function ViewLayout() {
  return (
    <>
      <Outlet />
      <Header />
    </>
  )
}
