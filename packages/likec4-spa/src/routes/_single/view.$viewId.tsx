import { createFileRoute, Outlet } from '@tanstack/react-router'
import { ErrorComponent } from '../../components/ErrorComponent'
import { Header } from '../../components/view-page/Header'

export const Route = createFileRoute('/_single/view/$viewId')({
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
