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
    router.commitLocation(loc)
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
      controls="next"
      nodesDraggable
      experimentalEdgeEditing
      fitViewPadding={{
        top: '70px',
        bottom: '10px',
        left: '50px',
        right: '10px',
      }}
      showDiagramTitle
      showNavigationButtons
      showNotations={isDevelopment || hasNotations}
      enableDynamicViewWalkthrough
      enableFocusMode
      enableElementDetails
      enableRelationshipDetails
      enableRelationshipBrowser
      enableElementTags
      onNavigateTo={onNavigateTo}
      onChange={(e) => console.log(e)}
      onBurgerMenuClick={() => {
        router.navigate({
          to: '/',
        })
      }}
    />
  )
}
