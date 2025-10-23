import { LikeC4Diagram } from '@likec4/diagram'
import { useCallbackRef } from '@mantine/hooks'
import { useNavigate } from '@tanstack/react-router'
import { NotFound } from '../components/NotFound'
import { isDevelopment } from '../const'
import { useCurrentView } from '../hooks'

export function ViewEditor() {
  const navigate = useNavigate()
  const [view, setLayoutType] = useCurrentView()

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

  if (!view) {
    return <NotFound />
  }

  const notations = view.notation?.nodes ?? []
  const hasNotations = notations.length > 0

  return (
    <LikeC4Diagram
      view={view}
      readonly={false}
      zoomable
      pannable
      controls
      nodesDraggable
      experimentalEdgeEditing
      fitViewPadding={{
        top: '70px',
        bottom: '32px',
        left: '50px',
        right: '32px',
      }}
      showNavigationButtons
      enableNotations={isDevelopment || hasNotations}
      enableSearch
      enableDynamicViewWalkthrough
      enableFocusMode
      enableElementDetails
      enableRelationshipDetails
      enableRelationshipBrowser
      enableElementTags
      enableCompareWithLatest
      onNavigateTo={onNavigateTo}
      onLayoutTypeChange={setLayoutType}
      onChange={(e) => console.log(e)}
      onBurgerMenuClick={() => {
        void navigate({
          to: '/',
        })
      }}
    />
  )
}
