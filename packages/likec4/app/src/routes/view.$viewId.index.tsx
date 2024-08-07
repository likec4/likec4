import type { ViewID } from '@likec4/core'
import { LikeC4Diagram } from '@likec4/diagram'
import { useCallbackRef } from '@mantine/hooks'
import { createFileRoute, notFound, useRouter } from '@tanstack/react-router'
import { useLikeC4View } from 'virtual:likec4/store'
import { RenderIcon } from '../components/RenderIcon'

export const Route = createFileRoute('/view/$viewId/')({
  component: ViewReact
})

function ViewReact() {
  const router = useRouter()
  const { viewId } = Route.useParams()
  const view = useLikeC4View(viewId)

  const onNavigateTo = useCallbackRef((viewId: ViewID) => {
    router.navigate({
      to: '/view/$viewId',
      params: { viewId },
      search: true
    })
  })

  if (!view) {
    throw notFound()
  }

  return (
    <LikeC4Diagram
      view={view}
      readonly
      controls={false}
      fitViewPadding={0.08}
      showDiagramTitle
      showElementLinks
      showNavigationButtons
      enableDynamicViewWalkthrough
      experimentalEdgeEditing={false}
      renderIcon={RenderIcon}
      onNavigateTo={onNavigateTo}
    />
  )
}
