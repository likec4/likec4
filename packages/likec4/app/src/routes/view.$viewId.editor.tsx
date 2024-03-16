import { LikeC4Diagram, type OnNavigateTo } from '@likec4/diagram'
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

  if (!view) {
    return <DiagramNotFound viewId={viewId} />
  }

  return (
    <LikeC4Diagram
      view={view}
      onNavigateTo={({ element }) => {
        router.navigate({
          to: '/view/$viewId/editor',
          params: { viewId: element.navigateTo },
          startTransition: true,
          search: true
        })
      }}
      onChange={event => {
        console.log('onChange', event)
      }}
      controls={false}
      // nodesDraggable={false}
    />
  )
}
