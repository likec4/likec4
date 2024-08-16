import { type ElementIconRenderer, LikeC4Diagram } from '@likec4/diagram'
import type { LocateParams } from '@likec4/language-server/protocol'
import { Box, LoadingOverlay, Notification } from '@mantine/core'
import { IconCheck, IconLoader, IconX } from '@tabler/icons-react'
import React from 'react'
import { hasAtLeast } from 'remeda'
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

const selector = (s: WorkspaceState) => {
  switch (true) {
    case !!s.diagram && !!s.computedView:
      return {
        state: 'ok' as const,
        message: '',
        diagram: s.diagram
      }
    case !s.initialized || !s.modelFetched:
      return {
        state: 'initializing' as const,
        message: 'Initializing...',
        diagram: null
      }
    case !s.diagram && !s.computedView:
      return {
        state: 'no-views' as const,
        message: 'No views found in model\n(or they are invalid)',
        diagram: null
      }
    case !!s.diagram && !s.computedView && (!s.likeC4Model || !(s.diagram.id in s.likeC4Model.views)):
      return {
        state: 'removed' as const,
        message: `View "${s.diagram.id}" not found in the model\n(removed or invalid)`,
        diagram: s.diagram
      }
    case !!s.diagram && !s.computedView:
      return {
        state: 'compute-failed' as const,
        message: `Failed to compute visible elements for view "${s.diagram.id}"\nCheck console for errors`,
        diagram: s.diagram
      }
    case !s.diagram && !!s.computedView:
      return {
        state: 'layout-failed' as const,
        message: `Failed to layout view "${s.computedView.id}"\nCheck console for errors`,
        diagram: null
      }
    default:
      return {
        state: 'unknown-error' as const,
        message: 'Unknown error ¯\_(ツ)_/¯\ncheck console or try another view',
        diagram: s.diagram
      }
  }
}

export function DiagramPanel() {
  const store = useStoreApi()
  const { state, message, diagram } = useWorkspaceState(selector)

  const isInvalid = state !== 'initializing' && state !== 'ok'
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
            enableFocusMode
            renderIcon={RendererIcon}
            onNavigateTo={id => store.getState().fetchDiagram(id)}
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
          {message && (
            <Box className={css.stateAlert}>
              <Notification
                icon={<IconX style={{ width: 20, height: 20 }} />}
                color="red"
                title="Error"
                withCloseButton={false}>
                {message}
              </Notification>
            </Box>
          )}
        </Box>
      )
    )
  }
  return (
    <Box pos={'relative'} w={'100%'} h={'100%'}>
      {state === 'initializing' && <LoadingOverlay visible zIndex={1000} overlayProps={{ radius: 'sm', blur: 2 }} />}
      <Box className={css.stateAlert}>
        <Notification
          icon={icon}
          loading={state === 'initializing'}
          color={isInvalid ? 'red' : 'teal'}
          withCloseButton={false}>
          {message}
        </Notification>
      </Box>
    </Box>
  )
}
