import type { ViewID } from '@likec4/core'
import { LikeC4Diagram } from '@likec4/diagram'
import { useCallbackRef } from '@mantine/hooks'
import { createFileRoute, notFound, useRouter } from '@tanstack/react-router'
import { useLikeC4View } from 'virtual:likec4/store'
import { RenderIcon } from '../components/RenderIcon'
import { SidebarDrawerOps } from '../components/sidebar/Drawer'
import { isDevelopment, withOverviewGraph } from '../const'

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
      enableDynamicViewWalkthrough
      experimentalEdgeEditing={false}
      showNotations={isDevelopment || hasNotations}
      enableFocusMode={true}
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
