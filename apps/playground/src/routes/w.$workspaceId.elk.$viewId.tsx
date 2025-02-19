import { createFileRoute, useRouter } from '@tanstack/react-router'
// import { useWorkspaceState, WorkspaceContextProvider } from '../state'
// import { EditorPanel } from './-workspace/EditorPanel'
// import { Header } from './-workspace/Header'
// import { PlaygroundActorProvider } from '$state/context'
import { ElkDiagram } from '$/experimental/ElkDiagram'
import { usePlayground, usePlaygroundSnapshot } from '$/hooks/usePlayground'
import type { ViewId } from '@likec4/core'
import { LikeC4ModelProvider } from '@likec4/diagram'
import { Box, LoadingOverlay, Notification } from '@mantine/core'
import { IconCheck, IconX } from '@tabler/icons-react'
import { useEffect } from 'react'
import * as css from './styles.css'

export const Route = createFileRoute('/w/$workspaceId/elk/$viewId')({
  component: ELKDiagramPage,
})

function ELKDiagramPage() {
  const router = useRouter()
  const viewId = Route.useParams().viewId as ViewId

  const playground = usePlayground()

  const {
    playgroundState,
    likec4model,
    viewstate,
  } = usePlaygroundSnapshot(c => {
    const viewState = c.context.activeViewId ? c.context.viewStates[c.context.activeViewId] : null
    if (c.value !== 'ready') {
      return {
        playgroundState: c.value,
        likec4model: null,
        viewstate: null,
      }
    }
    return ({
      playgroundState: c.value,
      likec4model: c.context.likec4model,
      viewstate: viewState ?? null,
    })
  })

  useEffect(() => {
    if (playground.getContext().activeViewId !== viewId) {
      playground.changeActiveView(viewId)
    }
  }, [viewId, playgroundState])

  const isInvalid = viewstate?.state === 'error'
  const icon = isInvalid ? <IconX style={{ width: 20, height: 20 }} /> : <IconCheck style={{ width: 20, height: 20 }} />

  if (viewstate?.state === 'success' && likec4model) {
    return (
      <Box
        pos={'relative'}
        w={'100%'}
        h={'100%'}>
        <LikeC4ModelProvider likec4model={likec4model}>
          <ElkDiagram
            diagram={viewstate.diagram}
            computed={viewstate.view}
            onNavigateTo={(nextView, event) => {
              event?.stopPropagation()
              router.navigate({
                from: '/w/$workspaceId/elk/$viewId',
                to: './',
                params: {
                  viewId: nextView,
                },
              })
            }}
          />
        </LikeC4ModelProvider>
      </Box>
    )
  }
  return (
    <Box pos={'relative'} w={'100%'} h={'100%'}>
      {viewstate?.state === 'pending' && (
        <LoadingOverlay visible zIndex={1000} overlayProps={{ radius: 'sm', blur: 2 }} />
      )}
      <Box className={css.stateAlert}>
        <Notification
          icon={icon}
          loading={viewstate?.state === 'pending'}
          color={isInvalid ? 'red' : 'teal'}
          withCloseButton={false}>
          {viewstate?.error ?? 'Loading...'}
        </Notification>
      </Box>
    </Box>
  )
}
