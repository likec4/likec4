import { createFileRoute, Outlet } from '@tanstack/react-router'

export const Route = createFileRoute('/embed/$viewId')({
  component: EmbedPage
})

function EmbedPage() {
  return (
    <>
      <h1>EmbedPage</h1>
    </>
  )
}
