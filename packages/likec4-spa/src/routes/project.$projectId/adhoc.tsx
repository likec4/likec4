import { createFileRoute, redirect } from '@tanstack/react-router'
import { isRpcAvailable } from 'likec4:rpc'
import { AdHocViewEditor } from '../../pages/AdHocViewEditor'

export const Route = createFileRoute('/project/$projectId/adhoc')({
  beforeLoad: ({ params }) => {
    if (!isRpcAvailable) {
      throw redirect({
        to: '/project/$projectId/',
        params: {
          projectId: params.projectId,
        },
      })
    }
  },
  component: Page,
})

function Page() {
  const { projectId } = Route.useRouteContext()
  return <AdHocViewEditor projectId={projectId} />
}
