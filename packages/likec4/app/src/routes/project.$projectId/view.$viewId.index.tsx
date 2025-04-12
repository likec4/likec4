import { createFileRoute } from '@tanstack/react-router'
import { ViewReact } from '../../pages/ViewReact'

export const Route = createFileRoute('/project/$projectId/view/$viewId/')({
  component: ViewReact,
})
