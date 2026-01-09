import { createFileRoute, notFound } from '@tanstack/react-router'
import { ViewAsMmd } from '../../pages/ViewAsMmd'

export const Route = createFileRoute('/project/$projectId/view/$viewId/mmd')({
  component: Page,
  staleTime: Infinity,
  loader: async ({ params, context }) => {
    const projectId = context.projectId
    const { viewId } = params
    const { loadMmdSources } = await import('likec4:mmd')
    try {
      const { mmdSource } = await loadMmdSources(projectId)
      return {
        source: mmdSource(viewId),
      }
    } catch (error) {
      console.error(error)
      throw notFound()
    }
  },
})

function Page() {
  const { viewId } = Route.useParams()
  const { source } = Route.useLoaderData()
  return <ViewAsMmd viewId={viewId} mmdSource={source} />
}
