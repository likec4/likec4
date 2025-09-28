import { createFileRoute, useRouter } from '@tanstack/react-router'
// import { useWorkspaceState, WorkspaceContextProvider } from '../state'
// import { EditorPanel } from './-workspace/EditorPanel'
// import { Header } from './-workspace/Header'
// import { PlaygroundActorProvider } from '$state/context'
import { usePlayground, usePlaygroundSnapshot } from '$/hooks/usePlayground'
import { IconRenderer } from '$components/IconRenderer'
import type { scalar, ViewId } from '@likec4/core/types'
import { LikeC4Diagram, LikeC4ModelProvider } from '@likec4/diagram'
import { Box, LoadingOverlay, Notification } from '@mantine/core'
import { IconCheck, IconX } from '@tabler/icons-react'
import { useEffect, useRef } from 'react'
import { only } from 'remeda'
import * as css from '../styles.css'

export const Route = createFileRoute('/w/$workspaceId/$viewId')({
  component: WorkspaceDiagramPage,
})

function WorkspaceDiagramPage() {
  const router = useRouter()
  const viewId = Route.useParams().viewId as ViewId

  const playground = usePlayground()

  const {
    workspaceId,
    playgroundState,
    likec4model,
    diagram,
    state,
    error,
  } = usePlaygroundSnapshot(c => {
    const viewState = c.context.activeViewId ? c.context.viewStates[c.context.activeViewId] : null
    if (c.value !== 'ready') {
      return {
        workspaceId: c.context.workspaceId,
        playgroundState: c.value,
        likec4model: null,
        diagram: null,
        state: 'pending' as const,
        error: null,
      }
    }
    return ({
      workspaceId: c.context.workspaceId,
      playgroundState: c.value,
      likec4model: c.context.likec4model,
      diagram: viewState?.diagram ?? null,
      state: viewState?.state ?? 'pending',
      error: viewState ? viewState.error : null,
    })
  })

  useEffect(() => {
    if (playground.getContext().activeViewId !== viewId) {
      playground.changeActiveView(viewId)
    }
  }, [viewId, playgroundState])

  const prevViewRef = useRef({
    workspaceId,
    diagram: diagram ?? null,
  })

  let _diagram = diagram
  // if view is not null - save it as previous
  // (it might be null when we navigate to the pending diagram, and we want to show last valid view)
  if (_diagram) {
    prevViewRef.current.diagram = diagram
    prevViewRef.current.workspaceId = workspaceId
  } else {
    // we show last valid view, if it was for the same workspace
    if (prevViewRef.current.workspaceId === workspaceId) {
      _diagram = prevViewRef.current.diagram
    }
  }

  const isInvalid = state === 'error'
  const icon = isInvalid ? <IconX style={{ width: 20, height: 20 }} /> : <IconCheck style={{ width: 20, height: 20 }} />

  // const showLocation = (location: LocateParams) => {
  //   store.getState().showLocation(location)
  // }

  if (_diagram && likec4model) {
    return (
      <Box
        pos={'relative'}
        w={'100%'}
        h={'100%'}>
        <LikeC4ModelProvider likec4model={likec4model}>
          <LikeC4Diagram
            view={_diagram}
            readonly={false}
            controls
            fitView
            fitViewPadding={{
              top: '70px',
              bottom: '10px',
              left: '60px',
              right: '10px',
            }}
            experimentalEdgeEditing
            nodesSelectable
            nodesDraggable
            showNavigationButtons
            enableElementDetails
            enableDynamicViewWalkthrough
            enableRelationshipBrowser
            enableRelationshipDetails
            showNotations
            enableElementTags
            enableFocusMode
            enableSearch
            reactFlowProps={{
              // Otherwise reactflow intercepts "Space" key
              panActivationKeyCode: null,
            }}
            renderIcon={IconRenderer}
            onNavigateTo={(nextView, event) => {
              event?.stopPropagation()
              playground.openSources({
                view: nextView as scalar.ViewId,
              })
              router.navigate({
                viewTransition: false,
                from: '/w/$workspaceId/$viewId',
                to: './',
                params: {
                  viewId: nextView,
                },
              })
            }}
            onEdgeClick={(edge, event) => {
              event?.stopPropagation()
              if (_diagram._type === 'dynamic' && edge.astPath) {
                playground.openSources({
                  view: _diagram.id,
                  astPath: edge.astPath,
                })
                return
              }
              const relationId = only(edge.relations)
              if (relationId) {
                playground.openSources({
                  relation: relationId,
                })
              }
            }}
            onChange={ev => {
              playground.applyViewChanges(ev.change)
            }}
            onOpenSource={params => {
              playground.openSources(params)
            }}
          />
          {error && (
            <Box className={css.stateAlert}>
              <Notification
                icon={<IconX style={{ width: 20, height: 20 }} />}
                color="red"
                title="Error"
                withCloseButton={false}>
                {error}
              </Notification>
            </Box>
          )}
        </LikeC4ModelProvider>
      </Box>
    )
  }
  return (
    <Box pos={'relative'} w={'100%'} h={'100%'}>
      {state === 'pending' && <LoadingOverlay visible zIndex={10} overlayProps={{ radius: 'sm', blur: 2 }} />}
      <Box className={css.stateAlert}>
        <Notification
          icon={icon}
          loading={state === 'pending'}
          color={isInvalid ? 'red' : 'teal'}
          withCloseButton={false}>
          {error ?? 'Loading...'}
        </Notification>
      </Box>
    </Box>
  )
}
