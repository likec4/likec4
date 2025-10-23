import { LikeC4Diagram, useDiagramContext, useLikeC4Model, useUpdateEffect } from '@likec4/diagram'
import { useCallbackRef, useDocumentTitle } from '@mantine/hooks'
import { useNavigate, useRouter, useSearch } from '@tanstack/react-router'
import { NotFound } from '../components/NotFound'
import { pageTitle as defaultPageTitle } from '../const'
import { useCurrentView } from '../hooks'

export function ViewReact() {
  const navigate = useNavigate()
  const [view, setLayoutType] = useCurrentView()
  const model = useLikeC4Model()
  const { dynamic } = useSearch({
    from: '__root__',
  })

  const onNavigateTo = useCallbackRef((viewId: string) => {
    void navigate({
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
      controls
      fitViewPadding={{
        top: '70px',
        bottom: '32px',
        left: '32px',
        right: '32px',
      }}
      showNavigationButtons
      enableSearch
      enableFocusMode
      enableDynamicViewWalkthrough
      dynamicViewVariant={dynamic}
      enableElementDetails
      enableRelationshipDetails
      enableRelationshipBrowser
      enableElementTags
      enableCompareWithLatest
      experimentalEdgeEditing={false}
      enableNotations={hasNotations}
      nodesDraggable={false}
      nodesSelectable
      onNavigateTo={onNavigateTo}
      onLayoutTypeChange={setLayoutType}
      onBurgerMenuClick={() => {
        void navigate({
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
      void router.buildAndCommitLocation({
        search: (current?: any) => ({
          ...current,
          dynamic: dynamicViewVariant,
        }),
        viewTransition: false,
      })
    }
  }, [dynamicViewVariant])

  return null
}
