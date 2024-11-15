import type { ViewID } from '@likec4/core'
import { LikeC4Diagram, useLikeC4DiagramView } from '@likec4/diagram'
import { useCallbackRef } from '@mantine/hooks'
import { createFileRoute, notFound, useRouter } from '@tanstack/react-router'
import { RenderIcon } from '../components/RenderIcon'
import { SidebarDrawerOps } from '../components/sidebar/state'
import { isDevelopment, withOverviewGraph } from '../const'

export const Route = createFileRoute('/view/$viewId/editor')({
  component: ViewEditor
})

function ViewEditor() {
  const router = useRouter()
  const { viewId } = Route.useParams()
  const view = useLikeC4DiagramView(viewId)

  const onNavigateTo = useCallbackRef((viewId: ViewID) => {
    router.navigate({
      to: '/view/$viewId/editor',
      params: { viewId },
      startTransition: true,
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
      readonly={false}
      zoomable
      pannable
      nodesDraggable
      experimentalEdgeEditing
      fitViewPadding={0.08}
      showDiagramTitle
      showNavigationButtons
      showNotations={isDevelopment || hasNotations}
      enableDynamicViewWalkthrough
      enableFocusMode={false}
      enableElementDetails
      enableRelationshipDetails
      enableRelationshipBrowser
      onNavigateTo={onNavigateTo}
      renderIcon={RenderIcon}
      onChange={(e) => console.log(e)}
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
