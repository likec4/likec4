import { LikeC4Diagram } from '@likec4/diagram'
import { useCallbackRef, useDocumentTitle } from '@mantine/hooks'
import { useNavigate } from '@tanstack/react-router'
import { NotFound } from '../components/NotFound'
import { SidebarDrawerOps } from '../components/sidebar/state'
import { pageTitle } from '../const'
import { useCurrentDiagram } from '../hooks'

export function ViewReact() {
  const navigate = useNavigate()
  const view = useCurrentDiagram()

  const onNavigateTo = useCallbackRef((viewId: string) => {
    navigate({
      to: './',
      viewTransition: false,
      params: (current) => ({
        ...current,
        viewId,
      }),
      search: true,
    })
  })

  const title = view ? (view.title ?? view.id) : `View not found`
  console.log(pageTitle)
  useDocumentTitle(`${title} - ${pageTitle}`)

  if (!view) {
    return <NotFound />
  }

  const notations = view.notation?.nodes ?? []
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
      enableElementTags
      experimentalEdgeEditing={false}
      showNotations={hasNotations}
      nodesDraggable={false}
      nodesSelectable
      onNavigateTo={onNavigateTo}
      onBurgerMenuClick={SidebarDrawerOps.open}
    />
  )
}
