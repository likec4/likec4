import { createFileRoute, redirect } from '@tanstack/react-router'
import { isRpcAvailable } from 'likec4:rpc'
import { AdHocViewEditor } from '../../pages/editor'

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
  wrapInSuspense: true,
  component: Page,
})

function Page() {
  const { projectId } = Route.useRouteContext()
  return <AdHocViewEditor projectId={projectId} />
}
