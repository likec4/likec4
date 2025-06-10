import { createFileRoute } from '@tanstack/react-router'
import { ViewEditor } from '../../pages/ViewEditor'

export const Route = createFileRoute('/project/$projectId/view/$viewId/editor')({
  component: ViewEditor,
})
