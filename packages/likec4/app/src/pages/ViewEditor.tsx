import { LikeC4Diagram, LikeC4EditorProvider } from '@likec4/diagram'
import { useCallbackRef } from '@mantine/hooks'
import { useNavigate } from '@tanstack/react-router'
import { NotFound } from '../components/NotFound'
import { isDevelopment, onViewChangeViaPlugin } from '../const'
import { useLikeC4ModelAtom } from '../context/safeCtx'
import { useCurrentProject, useCurrentView } from '../hooks'

export function ViewEditor() {
  const navigate = useNavigate()
  const projectId = useCurrentProject().id
  const [view, setLayoutType] = useCurrentView()
  const $likec4model = useLikeC4ModelAtom()

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
    <LikeC4EditorProvider
      editor={{
        fetchView: (id, layout) => {
          const model = $likec4model.get().view(id)
          return layout === 'auto' ? model.$view : model.$layouted
        },
        handleChange: (viewId, change) => {
          const event = {
            projectId,
            viewId,
            change,
          }
          onChange?.(event)
        },
      }}>
      <LikeC4Diagram
        view={view}
        zoomable
        pannable
        controls
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
        onLogoClick={() => {
          void navigate({
            to: '/',
          })
        }}
      />
    </LikeC4EditorProvider>
  )
}
