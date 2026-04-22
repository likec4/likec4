import { createFileRoute, Outlet } from '@tanstack/react-router'
import { Fallback } from '../../components/Fallback'
import { Header } from '../../components/view-page/Header'

export const Route = createFileRoute('/_single/view/$viewId')({
  component: ViewLayout,
  errorComponent: ({ error, reset }) => {
    return <Fallback error={error} resetErrorBoundary={reset} />
  },
})

function ViewLayout() {
  return (
    <>
      <Outlet />
      <Header />
    </>
  )
}
