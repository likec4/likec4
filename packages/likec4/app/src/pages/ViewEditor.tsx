import { LikeC4Diagram } from '@likec4/diagram'
import { useCallbackRef } from '@mantine/hooks'
import { useNavigate } from '@tanstack/react-router'
import { NotFound } from '../components/NotFound'
import { isDevelopment, onViewChangeViaPlugin } from '../const'
import { useCurrentProject, useCurrentView } from '../hooks'

export function ViewEditor() {
  const navigate = useNavigate()
  const projectId = useCurrentProject().id
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

  const onChange = onViewChangeViaPlugin ?? undefined

  return (
    <LikeC4Diagram
      view={view}
      readonly={false}
      zoomable
      pannable
      controls
      nodesDraggable
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
      onChange={onChange && (({ change }) => {
        const event = {
          projectId,
          viewId: view.id,
          change,
        }
        onChange(event)
      })}
      onBurgerMenuClick={() => {
        void navigate({
          to: '/',
        })
      }}
    />
  )
}
