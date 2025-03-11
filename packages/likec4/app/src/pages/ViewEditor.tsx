import type { ViewId } from '@likec4/core'
import { LikeC4Diagram } from '@likec4/diagram'
import { useCallbackRef } from '@mantine/hooks'
import { notFound, useRouter } from '@tanstack/react-router'
import { NotFound } from '../components/NotFound'
import { SidebarDrawerOps } from '../components/sidebar/state'
import { isDevelopment, withOverviewGraph } from '../const'
import { useCurrentDiagram } from '../hooks'

export function ViewEditor() {
  const router = useRouter()
  const view = useCurrentDiagram()

  const onNavigateTo = useCallbackRef((viewId: ViewId) => {
    const loc = router.buildLocation({
      to: '.',
      params: (current: any) => ({
        ...current,
        viewId,
      }),
      search: true,
    })
    router.commitLocation(loc)
  })

  if (!view) {
    return <NotFound />
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
      onChange={(e) => console.log(e)}
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
