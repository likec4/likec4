import { createFileRoute, Outlet } from '@tanstack/react-router'

export const Route = createFileRoute('/view/$viewId/_as')({
  component: ViewAsLayout
})

function ViewAsLayout() {
  return (
    <>
      <h1>ViewAsLayout</h1>
      <Outlet />
    </>
  )
}
