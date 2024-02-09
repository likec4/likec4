import { createFileRoute, Outlet } from '@tanstack/react-router'

export const Route = createFileRoute('/view/$viewId/_as/dot')({
  component: ViewAsDot
})

function ViewAsDot() {
  return (
    <>
      <h1>ViewIndex</h1>
    </>
  )
}
