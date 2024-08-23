import type { ViewID } from '@likec4/core'
import { type ChangeEvent, LikeC4Diagram } from '@likec4/diagram'
import { useCallbackRef } from '@mantine/hooks'
import { createFileRoute, notFound, useRouter } from '@tanstack/react-router'
import { useLikeC4View } from 'virtual:likec4/store'
import { RenderIcon } from '../components/RenderIcon'
import { SidebarDrawerOps } from '../components/sidebar/Drawer'
import { withOverviewGraph } from '../const'

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

  if (!view) {
    throw notFound()
  }

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
      showElementLinks
      showNavigationButtons
      enableDynamicViewWalkthrough
      enableFocusMode={false}
      onNavigateTo={onNavigateTo}
      renderIcon={RenderIcon}
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
