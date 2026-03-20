import { createFileRoute, redirect } from '@tanstack/react-router'
import { isRpcAvailable } from 'likec4:rpc'
import { AdHocViewEditor } from '../../pages/editor'

export const Route = createFileRoute('/_single/adhoc')({
  beforeLoad: () => {
    if (!isRpcAvailable) {
      throw redirect({
        to: '/single-index/',
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
