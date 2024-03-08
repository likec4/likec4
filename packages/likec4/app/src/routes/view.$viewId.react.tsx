import { createFileRoute, Outlet, useRouter } from '@tanstack/react-router'
import { useAtomValue } from 'jotai'
import { useCallback } from 'react'
import { DiagramNotFound } from '../components'
import { ViewAsReact } from '../pages/view-page/ViewAsReact'

export const Route = createFileRoute('/view/$viewId/react')({
  component: ViewReact
})

function ViewReact() {
  const router = useRouter()
  const { viewAtom, viewId } = Route.useRouteContext()
  const view = useAtomValue(viewAtom)

  const navigateTo = useCallback((node: { navigateTo: string }) => {
    router.navigate({
      to: '/view/$viewId/react',
      params: { viewId: node.navigateTo },
      startTransition: true,
      search: true
    })
  }, [router])

  if (!view) {
    return <DiagramNotFound viewId={viewId} />
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
