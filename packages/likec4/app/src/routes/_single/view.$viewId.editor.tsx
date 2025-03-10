import { createFileRoute } from '@tanstack/react-router'
import { ViewEditor } from '../../pages/ViewEditor'

export const Route = createFileRoute('/_single/view/$viewId/editor')({
  component: ViewEditor,
})
