import type { ViewId } from '@likec4/core/types'
import { createFileRoute } from '@tanstack/react-router'
import { LikeC4ViewContext } from '../../context/LikeC4ViewContext'
import { EmbedPage } from '../../pages/EmbedPage'

export const Route = createFileRoute('/project/$projectId/embed/$viewId')({
  component: EmbedRoute,
})

function EmbedRoute() {
  const { viewId } = Route.useParams()
  return (
    <LikeC4ViewContext viewId={viewId as ViewId}>
      <EmbedPage />
    </LikeC4ViewContext>
  )
}
