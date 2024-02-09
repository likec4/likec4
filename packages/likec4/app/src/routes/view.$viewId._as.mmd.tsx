import { createFileRoute, Outlet } from '@tanstack/react-router'

export const Route = createFileRoute('/view/$viewId/_as/mmd')({
  component: ViewAsMmd
})

function ViewAsMmd() {
  return (
    <>
      <h1>ViewIndex: mmd</h1>
    </>
  )
}
