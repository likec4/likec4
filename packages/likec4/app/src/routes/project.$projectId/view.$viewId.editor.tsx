import { createFileRoute } from '@tanstack/react-router'
import { ViewEditor } from '../../pages/ViewEditor'
import { ViewReact } from '../../pages/ViewReact'

export const Route = createFileRoute('/project/$projectId/view/$viewId/editor')({
  component: ViewEditor,
})
