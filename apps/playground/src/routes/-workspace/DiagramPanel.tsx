import { type ElementIconRenderer, LikeC4Diagram, LikeC4ModelProvider } from '@likec4/diagram'
import type { LocateParams } from '@likec4/language-server/protocol'
import { Box, LoadingOverlay, Notification } from '@mantine/core'
import { IconCheck, IconLoader, IconX } from '@tabler/icons-react'
import { deepEqual } from 'fast-equals'
import React, { memo, useEffect, useMemo, useRef } from 'react'
import { useStoreApi, useWorkspaceState, type WorkspaceState } from '../../state'
import * as css from './styles.css'

const Icons = React.lazy(() => import('@likec4/icons/all'))

const RendererIcon: ElementIconRenderer = ({ node }) => {
  return (
    <React.Suspense fallback={<IconLoader />}>
      <Icons name={(node.icon ?? '') as any} />
    </React.Suspense>
  )
}

// const selector = (s: WorkspaceState) => {
//   switch (true) {
//     case !!s.diagram && !!s.computedView:
//       return {
//         state: 'ok' as const,
//         message: '',
//         diagram: s.diagram
//       }
//     case !s.initialized || !s.modelFetched:
//       return {
//         state: 'initializing' as const,
//         message: 'Initializing...',
//         diagram: null
//       }
//     case !s.diagram && !s.computedView:
//       return {
//         state: 'no-views' as const,
//         message: 'No views found in model\n(or they are invalid)',
//         diagram: null
//       }
//     case !!s.diagram && !s.computedView && (!s.likeC4Model || !(s.diagram.id in s.likeC4Model.views)):
//       return {
//         state: 'removed' as const,
//         message: `View "${s.diagram.id}" not found in the model\n(removed or invalid)`,
//         diagram: s.diagram
//       }
//     case !!s.diagram && !s.computedView:
//       return {
//         state: 'compute-failed' as const,
//         message: `Failed to compute visible elements for view "${s.diagram.id}"\nCheck console for errors`,
//         diagram: s.diagram
//       }
//     case !s.diagram && !!s.computedView:
//       return {
//         state: 'layout-failed' as const,
//         message: `Failed to layout view "${s.computedView.id}"\nCheck console for errors`,
//         diagram: null
//       }
//     default:
//       return {
//         state: 'unknown-error' as const,
//         message: 'Unknown error ¯\_(ツ)_/¯\ncheck console or try another view',
//         diagram: s.diagram
//       }
//   }
// }

export const DiagramPanel = memo(() => {
  const model = useWorkspaceState(s => s.likeC4Model)

  const store = useStoreApi()

  useEffect(() => {
    // If current view is stale or pending, trigger layout update
    return store.subscribe(s => s.diagrams[s.viewId]?.state ?? null, (state) => {
      if (state === 'pending' || state === 'stale') {
        store.getState().layoutView()
      }
    }, {
      fireImmediately: true
    })
  }, [store])

  if (model) {
    return (
      <LikeC4ModelProvider computed={model}>
        <DiagramPanelContent />
      </LikeC4ModelProvider>
    )
  }

  return <DiagramPanelContent />
})

const DiagramPanelContent = memo(() => {
  const store = useStoreApi()
  const { state, error, view } = useWorkspaceState(s =>
    s.diagrams[s.viewId] ?? ({
      state: 'pending' as const,
      view: null,
      error: null
    })
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
      (
        <Box
          pos={'relative'}
          w={'100%'}
          h={'100%'}>
          <LikeC4Diagram
            view={diagram}
            readonly={false}
            controls={false}
            fitView
            fitViewPadding={0.07}
            experimentalEdgeEditing
            nodesSelectable
            nodesDraggable
            showNavigationButtons
            enableDynamicViewWalkthrough
            showNotations
            enableFocusMode
            renderIcon={RendererIcon}
            onNavigateTo={(id, event) => {
              event?.stopPropagation()
              store.getState().openView(id)
            }}
            onChange={ev => store.getState().onChanges(ev)}
            onOpenSourceElement={fqn => {
              showLocation({ element: fqn })
            }}
            onOpenSourceRelation={id => {
              showLocation({ relation: id })
            }}
            onOpenSourceView={() => {
              showLocation({
                view: diagram.id
              })
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
          {error || 'Loading...'}
        </Notification>
      </Box>
    </Box>
  )
})
