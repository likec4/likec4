import { createFileRoute, notFound } from '@tanstack/react-router'
import { ViewAsD2 } from '../../pages/ViewAsD2'

export const Route = createFileRoute('/project/$projectId/view/$viewId/d2')({
  component: Page,
  staleTime: Infinity,
  loader: async ({ context, params }) => {
    const projectId = context.projectId
    const { viewId } = params
    const { loadD2Sources } = await import('likec4:d2')
    try {
      const { d2Source } = await loadD2Sources(projectId)
      return {
        source: d2Source(viewId),
      }
    } catch (error) {
      console.error(error)
      throw notFound()
    }
  },
})

function Page() {
  const { source } = Route.useLoaderData()
  return <ViewAsD2 d2Source={source} />
}
