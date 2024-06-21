import { LikeC4Diagram } from '@likec4/diagram'
import { createFileRoute, notFound, useRouter } from '@tanstack/react-router'
import { DEV } from 'esm-env'
import { useLikeC4View } from '../data'

export const Route = createFileRoute('/view/$viewId/editor')({
  component: ViewEditor
})

function ViewEditor() {
  const router = useRouter()
  const { viewId } = Route.useParams()
  const view = useLikeC4View(viewId)

  if (!view) {
    throw notFound()
  }

  return (
    <LikeC4Diagram
      view={view}
      readonly={false}
      nodesDraggable
      experimentalEdgeEditing
      fitViewPadding={0.08}
      onNavigateTo={viewId => {
        router.navigate({
          to: '/view/$viewId/editor',
          params: { viewId },
          startTransition: true,
          search: true
        })
      }}
      {...(DEV && {
        onChange: event => {
          console.log('onChange', event)
        }
      })}
    />
  )
}
