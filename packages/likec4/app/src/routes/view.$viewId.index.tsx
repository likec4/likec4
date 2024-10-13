import type { ViewID } from '@likec4/core'
import { LikeC4Diagram, useLikeC4DiagramView } from '@likec4/diagram'
import { useCallbackRef } from '@mantine/hooks'
import { createFileRoute, notFound, useRouter } from '@tanstack/react-router'
import { RenderIcon } from '../components/RenderIcon'
import { SidebarDrawerOps } from '../components/sidebar/state'
import { isDevelopment, withOverviewGraph } from '../const'

export const Route = createFileRoute('/view/$viewId/')({
  component: ViewReact
})

function ViewReact() {
  const router = useRouter()
  const { viewId } = Route.useParams()
  const view = useLikeC4DiagramView(viewId)

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

  const notations = view.notation?.elements ?? []
  const hasNotations = notations.length > 0

  return (
    <LikeC4Diagram
      view={view}
      readonly
      zoomable
      pannable
      controls={false}
      fitViewPadding={0.08}
      showDiagramTitle
      showElementLinks
      showNavigationButtons
      enableFocusMode
      enableDynamicViewWalkthrough
      enableRelationshipsBrowser
      experimentalEdgeEditing={false}
      showNotations={isDevelopment || hasNotations}
      nodesDraggable={false}
      nodesSelectable={false}
      renderIcon={RenderIcon}
      onNavigateTo={onNavigateTo}
      onBurgerMenuClick={withOverviewGraph
        ? () => {
          router.navigate({
            to: '/',
            search: true
          })
        }
        : SidebarDrawerOps.open}
    />
  )
}
