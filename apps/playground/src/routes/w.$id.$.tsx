import type { ViewId } from '@likec4/core'
import { type ElementIconRenderer, LikeC4Diagram } from '@likec4/diagram'
import type { LocateParams } from '@likec4/language-server/protocol'
import { Box, LoadingOverlay, Notification } from '@mantine/core'
import { IconCheck, IconLoader, IconX } from '@tabler/icons-react'
import { createFileRoute, useRouter } from '@tanstack/react-router'
import { lazy, useCallback, useEffect, useRef } from 'react'
import React from 'react'
import { useStoreApi, useWorkspaceState } from '../state/use-workspace'
import * as css from './w.$id.css'

export const Route = createFileRoute('/w/$id/$')({
  component: WorkspaceDiagramPage
})

const Icons = lazy(() => import('@likec4/icons/all'))

const RendererIcon: ElementIconRenderer = ({ node }) => {
  return (
    <React.Suspense fallback={<IconLoader />}>
      <Icons name={(node.icon ?? '') as any} />
    </React.Suspense>
  )
}

export function WorkspaceDiagramPage() {
  const router = useRouter()
  const { id, _splat } = Route.useParams()
  const viewId = (_splat || 'index') as ViewId

  const store = useStoreApi()

  useEffect(() => {
    store.setState({ viewId: viewId as ViewId })
    // If current view is stale or pending, trigger layout update
    return store.subscribe(s => s.diagrams[viewId]?.state ?? null, (state) => {
      if (state === 'pending' || state === 'stale') {
        store.getState().layoutView(viewId)
      }
    }, {
      fireImmediately: true
    })
  }, [store, viewId])

  const { state, error, view } = useWorkspaceState(
    useCallback(s =>
      s.diagrams[viewId] ?? ({
        state: 'pending' as const,
        view: null,
        error: null
      }), [viewId])
  )

  const prevViewRef = useRef(view)
  // if view is not null - save it as previous
  // (it might be null when we navigate to the pending diagram, and we want to show last valid view)
  if (view) {
    prevViewRef.current = view
  }
  const diagram = view ?? prevViewRef.current

  const isInvalid = state === 'error'
  const icon = isInvalid ? <IconX style={{ width: 20, height: 20 }} /> : <IconCheck style={{ width: 20, height: 20 }} />

  const showLocation = (location: LocateParams) => {
    store.getState().showLocation(location)
  }

  if (diagram) {
    return (
      <Box
        pos={'relative'}
        w={'100%'}
        h={'100%'}>
        <LikeC4Diagram
          view={diagram}
          readonly={false}
          controls
          fitView
          fitViewPadding={0.07}
          experimentalEdgeEditing
          nodesSelectable
          nodesDraggable
          showNavigationButtons
          enableElementDetails
          enableDynamicViewWalkthrough
          enableRelationshipBrowser
          enableRelationshipDetails
          showNotations
          enableFocusMode
          enableSearch
          renderIcon={RendererIcon}
          onNavigateTo={(nextView, event) => {
            event?.stopPropagation()
            router.navigate({
              to: '/w/$id/$/',
              params: {
                id,
                _splat: nextView
              }
            })
            showLocation({
              view: nextView
            })
          }}
          onChange={ev => store.getState().onChanges(ev)}
          onOpenSource={params => {
            showLocation(params)
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
      </Box>
    )
  }
  return (
    <Box pos={'relative'} w={'100%'} h={'100%'}>
      {state === 'pending' && <LoadingOverlay visible zIndex={1000} overlayProps={{ radius: 'sm', blur: 2 }} />}
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
