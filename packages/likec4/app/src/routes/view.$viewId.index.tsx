import type { ViewId } from '@likec4/core'
import { LikeC4DiagramV2, useLikeC4DiagramView } from '@likec4/diagram'
import { useCallbackRef } from '@mantine/hooks'
import { createFileRoute, notFound, useRouter } from '@tanstack/react-router'
import { RenderIcon } from '../components/RenderIcon'
import { SidebarDrawerOps } from '../components/sidebar/state'
import { isDevelopment, withOverviewGraph } from '../const'

export const Route = createFileRoute('/view/$viewId/')({
  component: ViewReact,
})

function ViewReact() {
  const router = useRouter()
  const { viewId } = Route.useParams()
  const view = useLikeC4DiagramView(viewId)

  const onNavigateTo = useCallbackRef((viewId: ViewId) => {
    router.navigate({
      to: '/view/$viewId',
      params: { viewId },
      search: true,
    })
  })

  if (!view) {
    throw notFound()
  }

  const notations = view.notation?.elements ?? []
  const hasNotations = notations.length > 0

  return (
    <LikeC4DiagramV2
      view={view}
      readonly={false}
      zoomable
      pannable
      controls
      fitViewPadding={0.1}
      showDiagramTitle
      showNavigationButtons
      enableFocusMode
      enableDynamicViewWalkthrough
      enableElementDetails
      enableRelationshipDetails
      enableRelationshipBrowser
      experimentalEdgeEditing
      showNotations={isDevelopment || hasNotations}
      // nodesSelectable
      renderIcon={RenderIcon}
      onNavigateTo={onNavigateTo}
      onBurgerMenuClick={withOverviewGraph
        ? () => {
          router.navigate({
            to: '/',
            search: true,
          })
        }
        : SidebarDrawerOps.open}
    />
  )
}
