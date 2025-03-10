import { createFileRoute } from '@tanstack/react-router'
import { ViewReact } from '../../pages/ViewReact'

export const Route = createFileRoute('/_single/view/$viewId/')({
  component: ViewReact,
})
