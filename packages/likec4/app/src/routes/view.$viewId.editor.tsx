import type { ViewID } from '@likec4/core'
import { type ChangeEvent, LikeC4Diagram } from '@likec4/diagram'
import { useCallbackRef } from '@mantine/hooks'
import { createFileRoute, notFound, useRouter } from '@tanstack/react-router'
import { DEV } from 'esm-env'
import { useLikeC4View } from 'virtual:likec4/store'
import { RenderIcon } from '../components/RenderIcon'

export const Route = createFileRoute('/view/$viewId/editor')({
  component: ViewEditor
})

function ViewEditor() {
  const router = useRouter()
  const { viewId } = Route.useParams()
  const view = useLikeC4View(viewId)

  const onNavigateTo = useCallbackRef((viewId: ViewID) => {
    router.navigate({
      to: '/view/$viewId/editor',
      params: { viewId },
      startTransition: true,
      search: true
    })
  })

  const onChange = useCallbackRef((event: ChangeEvent) => {
    console.log('onChange', event)
  })

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
      showDiagramTitle
      showElementLinks
      showNavigationButtons
      enableDynamicViewWalkthrough
      onNavigateTo={onNavigateTo}
      renderIcon={RenderIcon}
      {...(DEV && { onChange })}
    />
  )
}
