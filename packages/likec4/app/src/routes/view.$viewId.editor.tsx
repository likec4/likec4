import { LikeC4ViewEditor } from '@likec4/diagram'
import { Box } from '@radix-ui/themes'
import { createFileRoute, Outlet, useRouter } from '@tanstack/react-router'
import { useAtomValue } from 'jotai'
import { useCallback } from 'react'
import { DiagramNotFound } from '../components'

export const Route = createFileRoute('/view/$viewId/editor')({
  component: ViewEditor
})

function ViewEditor() {
  const router = useRouter()
  const { viewAtom, viewId } = Route.useRouteContext()
  const view = useAtomValue(viewAtom)

  const navigateTo = useCallback((node: { navigateTo: string }) => {
    router.navigate({
      to: '/view/$viewId/editor',
      params: { viewId: node.navigateTo },
      startTransition: true,
      search: true
    })
  }, [router])

  if (!view) {
    return <DiagramNotFound viewId={viewId} />
  }

  return (
    <Box
      position={'absolute'}
      style={{ top: 50, left: 0, width: '100vw', height: 'calc(100vh - 50px)' }}
    >
      <LikeC4ViewEditor
        view={view}
        onNavigateTo={navigateTo}
        controls={false}
        nodesDraggable={false}
      />
    </Box>
  )
}
