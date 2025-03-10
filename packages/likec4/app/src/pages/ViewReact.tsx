import type { ViewId } from '@likec4/core'
import { LikeC4Diagram } from '@likec4/diagram'
import { useCallbackRef } from '@mantine/hooks'
import { Navigate, notFound, useRouter } from '@tanstack/react-router'
import { NotFound } from '../components/NotFound'
import { SidebarDrawerOps } from '../components/sidebar/state'
import { useCurrentDiagram } from '../hooks'

export function ViewReact() {
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
      readonly
      zoomable
      pannable
      controls
      fitViewPadding={0.12}
      showDiagramTitle
      showNavigationButtons
      enableFocusMode
      enableDynamicViewWalkthrough
      enableElementDetails
      enableRelationshipDetails
      enableRelationshipBrowser
      experimentalEdgeEditing={false}
      showNotations={hasNotations}
      nodesDraggable={false}
      nodesSelectable
      onNavigateTo={onNavigateTo}
      onBurgerMenuClick={SidebarDrawerOps.open}
    />
  )
}
