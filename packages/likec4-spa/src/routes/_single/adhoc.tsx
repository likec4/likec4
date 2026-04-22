import { createFileRoute, redirect } from '@tanstack/react-router'
import { isRpcAvailable } from 'likec4:rpc'
import { AdHocViewEditor } from '../../pages/AdHocViewEditor'

export const Route = createFileRoute('/_single/adhoc')({
  beforeLoad: () => {
    if (!isRpcAvailable) {
      throw redirect({
        to: '/single-index/',
      })
    }
  },
  component: Page,
})

function Page() {
  const { projectId } = Route.useRouteContext()
  return <AdHocViewEditor projectId={projectId} />
}
