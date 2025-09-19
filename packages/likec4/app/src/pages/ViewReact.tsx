import { LikeC4Diagram, useDiagramContext, useLikeC4Model, useUpdateEffect } from '@likec4/diagram'
import { useCallbackRef, useDocumentTitle } from '@mantine/hooks'
import { useNavigate, useRouter, useSearch } from '@tanstack/react-router'
import { NotFound } from '../components/NotFound'
import { pageTitle as defaultPageTitle } from '../const'
import { useCurrentDiagram } from '../hooks'

export function ViewReact() {
  const navigate = useNavigate()
  const view = useCurrentDiagram()
  const model = useLikeC4Model()
  const { dynamic } = useSearch({
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
      dynamicViewVariant={dynamic}
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
    >
      <DiagramListener />
    </LikeC4Diagram>
  )
}

function DiagramListener() {
  const router = useRouter()
  const dynamicViewVariant = useDiagramContext(c => c.dynamicViewVariant)

  useUpdateEffect(() => {
    const search = router.latestLocation.search.dynamic ?? 'diagram'
    if (search !== dynamicViewVariant) {
      router.buildAndCommitLocation({
        search: (current?: any) => ({
          ...current,
          dynamic: dynamicViewVariant,
        }),
      })
    }
  }, [dynamicViewVariant])

  return null
}
