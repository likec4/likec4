import { createFileRoute, notFound } from '@tanstack/react-router'
import { ViewAsDot } from '../../pages/ViewAsDot'

export const Route = createFileRoute('/project/$projectId/view/$viewId/dot')({
  component: Page,
  staleTime: Infinity,
  loader: async ({ params, context }) => {
    const projectId = context.projectId
    const { viewId } = params
    const { loadDotSources } = await import('likec4:dot')
    try {
      const { dotSource, svgSource } = await loadDotSources(projectId)
      const dot = dotSource(viewId)
      const dotSvg = svgSource(viewId)
      return {
        dot,
        dotSvg,
      }
    } catch (error) {
      console.error(error)
      throw notFound()
    }
  },
})

function Page() {
  const { dot, dotSvg } = Route.useLoaderData()
  return <ViewAsDot dot={dot} dotSvg={dotSvg} />
}
