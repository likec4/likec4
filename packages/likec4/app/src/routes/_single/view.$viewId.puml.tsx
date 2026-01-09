import { createFileRoute, notFound } from '@tanstack/react-router'
import { ViewAsPuml } from '../../pages/ViewAsPuml'

export const Route = createFileRoute('/_single/view/$viewId/puml')({
  component: Page,
  staleTime: Infinity,
  loader: async ({ params, context }) => {
    const projectId = context.projectId
    const { viewId } = params
    const { loadPumlSources } = await import('likec4:puml')
    try {
      const { pumlSource } = await loadPumlSources(projectId)
      return {
        source: pumlSource(viewId),
      }
    } catch (error) {
      console.error(error)
      throw notFound()
    }
  },
})

function Page() {
  const { source } = Route.useLoaderData()
  return <ViewAsPuml pumlSource={source} />
}
