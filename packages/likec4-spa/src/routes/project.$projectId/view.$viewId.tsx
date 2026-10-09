import { createFileRoute, Outlet } from '@tanstack/react-router'
import { Header } from '../../components/view-page/Header'

export const Route = createFileRoute('/project/$projectId/view/$viewId')({
  component: ViewLayout,
})

function ViewLayout() {
  return (
    <>
      <Outlet />
      <Header />
    </>
  )
}
