import type { ViewId } from '@likec4/core'
import { LikeC4Diagram } from '@likec4/diagram'
import { useCallbackRef, useDocumentTitle } from '@mantine/hooks'
import { useParams, useRouter } from '@tanstack/react-router'
import { NotFound } from '../components/NotFound'
import { SidebarDrawerOps } from '../components/sidebar/state'
import { useCurrentDiagram } from '../hooks'

export function ViewReact() {
  const viewId = useParams({
    select: (params) => params.viewId ?? 'index',
    strict: false,
  })
  const router = useRouter()
  const view = useCurrentDiagram()

  const onNavigateTo = useCallbackRef((viewId: ViewId) => {
    router.buildAndCommitLocation({
      viewTransition: false,
      params: (current: any) => ({
        ...current,
        viewId,
      }),
      search: true,
    })
  })

  const title = view ? (view.title ?? view.id) : `${viewId} not found`
  useDocumentTitle(title + ' - LikeC4')

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
      fitViewPadding={'48px'}
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
