// import { LikeC4Diagram, type OnNavigateTo } from '@likec4/diagram'
import { LikeC4Diagram } from '@likec4/diagram'
import { createFileRoute, useRouter } from '@tanstack/react-router'
import { useAtomValue } from 'jotai'
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
