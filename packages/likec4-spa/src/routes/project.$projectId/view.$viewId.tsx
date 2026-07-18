import { createFileRoute, Outlet } from '@tanstack/react-router'
import { ErrorComponent } from '../../components/ErrorComponent'
import { Header } from '../../components/view-page/Header'
export const Route = createFileRoute('/project/$projectId/view/$viewId')({
  component: ViewLayout,
  errorComponent: ErrorComponent,
})

function ViewLayout() {
  return (
    <>
      <Outlet />
      <Header />
    </>
  )
}
