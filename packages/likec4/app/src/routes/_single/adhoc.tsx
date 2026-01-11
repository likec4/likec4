import { createFileRoute } from '@tanstack/react-router'
import { AdHocViewEditor } from '../../pages/AdHocViewEditor'

export const Route = createFileRoute('/_single/adhoc')({
  component: Page,
})

function Page() {
  const { projectId } = Route.useRouteContext()
  return <AdHocViewEditor projectId={projectId} />
}
