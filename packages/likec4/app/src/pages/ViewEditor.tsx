import { LikeC4Diagram } from '@likec4/diagram'
import { useCallbackRef } from '@mantine/hooks'
import { useRouter } from '@tanstack/react-router'
import { NotFound } from '../components/NotFound'
import { isDevelopment } from '../const'
import { useCurrentDiagram } from '../hooks'

export function ViewEditor() {
  const router = useRouter()
  const view = useCurrentDiagram()

  const onNavigateTo = useCallbackRef((viewId: string) => {
    const loc = router.buildLocation({
      to: '.',
      params: (current: any) => ({
        ...current,
        viewId,
      }),
      search: true,
    })
    void router.commitLocation(loc)
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
      showNotations={isDevelopment || hasNotations}
      enableSearch
      enableDynamicViewWalkthrough
      enableFocusMode
      enableElementDetails
      enableRelationshipDetails
      enableRelationshipBrowser
      enableElementTags
      onNavigateTo={onNavigateTo}
      onChange={(e) => console.log(e)}
      onBurgerMenuClick={() => {
        void router.navigate({
          to: '/',
        })
      }}
    />
  )
}
