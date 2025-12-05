import { createFileRoute } from '@tanstack/react-router'
import { isHotEnabled } from '../../const'
import { ViewEditor } from '../../pages/ViewEditor'
import { ViewReact } from '../../pages/ViewReact'

export const Route = createFileRoute('/project/$projectId/view/$viewId/')({
  component: isHotEnabled ? ViewEditor : ViewReact,
})
