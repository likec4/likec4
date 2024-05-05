import { createLazyFileRoute, notFound, useRouter } from '@tanstack/react-router'

import { useCallback } from 'react'
import { useLikeC4View } from '../data'
import { ViewAsReact } from '../pages/view-page/ViewAsReact'

export const Route = createLazyFileRoute('/view/$viewId/react-legacy')({
  component: ViewReactLegacy
})

function ViewReactLegacy() {
  const router = useRouter()
  const { viewId } = Route.useParams()
  const view = useLikeC4View(viewId)

  const navigateTo = useCallback((node: { navigateTo: string }) => {
    router.navigate({
      to: '/view/$viewId/react-legacy',
      params: { viewId: node.navigateTo },
      startTransition: true,
      search: true
    })
  }, [router])

  if (!view) {
    throw notFound()
  }

  return (
    <ViewAsReact
      diagram={view}
      onNodeClick={(node) => {
        if (node.navigateTo) {
          navigateTo({ navigateTo: node.navigateTo })
        }
      }}
    />
  )
}
