import { LikeC4Diagram, useLikeC4Model } from '@likec4/diagram'
import { useCallbackRef, useDocumentTitle } from '@mantine/hooks'
import { useNavigate, useSearch } from '@tanstack/react-router'
import { NotFound } from '../components/NotFound'
import { pageTitle as defaultPageTitle } from '../const'
import { useCurrentDiagram } from '../hooks'

export function ViewReact() {
  const navigate = useNavigate()
  const view = useCurrentDiagram()
  const model = useLikeC4Model()
  const { dynamicVariant } = useSearch({
    from: '__root__',
  })

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
  const pageTitle = model.project.title ?? defaultPageTitle
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
      controls="next"
      fitViewPadding={{
        top: '70px',
        bottom: '16px',
        left: '16px',
        right: '16px',
      }}
      showDiagramTitle
      showNavigationButtons
      enableFocusMode
      enableDynamicViewWalkthrough
      dynamicViewVariant={dynamicVariant}
      enableElementDetails
      enableRelationshipDetails
      enableRelationshipBrowser
      enableElementTags
      experimentalEdgeEditing={false}
      showNotations={hasNotations}
      nodesDraggable={false}
      nodesSelectable
      onNavigateTo={onNavigateTo}
      onBurgerMenuClick={() => {
        navigate({
          to: '/',
        })
      }}
    />
  )
}
