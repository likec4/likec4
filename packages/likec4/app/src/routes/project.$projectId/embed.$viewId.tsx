import { createFileRoute } from '@tanstack/react-router'
import { EmbedPage } from '../../pages/EmbedPage'

export const Route = createFileRoute('/project/$projectId/embed/$viewId')({
  component: EmbedPage,
})
