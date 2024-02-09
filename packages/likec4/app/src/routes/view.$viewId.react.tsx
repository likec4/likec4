import { createFileRoute, Outlet, useRouter } from '@tanstack/react-router'
import { useAtomValue } from 'jotai'
import { useCallback } from 'react'
import { DiagramNotFound } from '../components'
import { ViewAsReact } from '../pages/view-page'

export const Route = createFileRoute('/view/$viewId/react')({
  component: ViewReact
})

function ViewReact() {
  const router = useRouter()
  const { viewAtom, viewId } = Route.useRouteContext()
  const view = useAtomValue(viewAtom)

  const navigateTo = useCallback((node: { navigateTo: string }) => {
    router.navigate({
      to: '/view/$viewId/editor',
      params: { viewId: node.navigateTo },
      startTransition: true
    })
  }, [router])

  if (!view) {
    return <DiagramNotFound viewId={viewId} />
  }

  return <ViewAsReact diagram={view} />
}
