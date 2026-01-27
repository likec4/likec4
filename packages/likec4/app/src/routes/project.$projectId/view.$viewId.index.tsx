import { createFileRoute } from '@tanstack/react-router'
import { isRpcAvailable } from 'likec4:rpc'
import { ViewEditor } from '../../pages/ViewEditor'
import { ViewReact } from '../../pages/ViewReact'

export const Route = createFileRoute('/project/$projectId/view/$viewId/')({
  component: isRpcAvailable ? ViewEditor : ViewReact,
})
