import { usePlayground, usePlaygroundActorRef, usePlaygroundSnapshot } from '$/hooks/usePlayground'
import { useDrawioContextMenu } from '$components/drawio/DrawioContextMenuProvider'
import { ModelDiffPanel } from '$components/model-diff/ModelDiffPanel'
import type { PlaygroundContext } from '$state/types'
import { type CompareViewMode, filterCompareView } from '@likec4/core/compute-view'
import type { DiagramView, scalar, ViewId } from '@likec4/core/types'
import { LikeC4Diagram, LikeC4EditorProvider, LikeC4ModelProvider } from '@likec4/diagram'
import { Box, LoadingOverlay, Notification } from '@mantine/core'
import { IconCheck, IconX } from '@tabler/icons-react'
import { createFileRoute, useRouter } from '@tanstack/react-router'
import { shallowEqual } from 'fast-equals'
import { type PropsWithChildren, Fragment, useEffect, useMemo, useRef } from 'react'
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
    overlay,
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
        overlay: NoOverlay,
      }
    }
    return ({
      workspaceId: c.context.workspaceId,
      playgroundState: c.value,
      likec4model: c.context.likec4model,
      diagram: viewState?.diagram ?? null,
      state: viewState?.state ?? 'pending',
      error: viewState ? viewState.error : null,
      overlay: selectOverlay(c.context),
    })
  }, (a, b) => shallowEqual({ ...a, overlay: null }, { ...b, overlay: null }) && shallowEqual(a.overlay, b.overlay))

  const overlayDiagram = useMemo(
    () => overlay.diagram && overlay.mode ? filterCompareView(overlay.diagram, overlay.mode) : overlay.diagram,
    [overlay.diagram, overlay.mode],
  )

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

  const { openMenu: onCanvasContextMenu } = useDrawioContextMenu()

  const navigateToView = (nextView: ViewId) => {
    void router.navigate({
      viewTransition: false,
      from: '/w/$workspaceId/$viewId',
      to: './',
      params: {
        viewId: nextView,
      },
    })
  }

  // Compare and impact diagrams contain elements that are not in the model: no editing, no model overlays
  const isOverlay = overlayDiagram !== null
  const Editor = isOverlay ? Fragment : LikeC4PlaygroundEditor

  if (_diagram && likec4model) {
    return (
      <Box
        pos={'relative'}
        w={'100%'}
        h={'100%'}>
        <ModelDiffPanel viewId={viewId} onNavigate={navigateToView} />
        <Editor>
          <LikeC4ModelProvider likec4model={likec4model}>
            <LikeC4Diagram
              view={overlayDiagram ?? _diagram}
              controls
              fitView
              fitViewPadding={{
                top: '70px',
                bottom: '32px',
                left: '60px',
                right: '32px',
              }}
              nodesSelectable
              showNavigationButtons
              enableElementDetails={!isOverlay}
              enableDynamicViewWalkthrough={!isOverlay}
              enableRelationshipBrowser={!isOverlay}
              enableRelationshipDetails={!isOverlay}
              enableNotations
              enableElementTags
              enableFocusMode
              enableSearch
              enableCompareWithLatest={false}
              reactFlowProps={{
                // Otherwise reactflow intercepts "Space" key
                panActivationKeyCode: null,
              }}
              onCanvasContextMenu={onCanvasContextMenu}
              onNavigateTo={(nextView, event) => {
                event?.stopPropagation()
                playground.openSources({
                  view: nextView as scalar.ViewId,
                })
                navigateToView(nextView as ViewId)
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
        </Editor>
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

type Overlay = {
  diagram: DiagramView | null
  /**
   * Set for compare views
   */
  mode: CompareViewMode | null
}

const NoOverlay: Overlay = { diagram: null, mode: null }

/**
 * Diagram shown instead of the active view: removal impact, or compare view of the active diff.
 */
function selectOverlay(context: PlaygroundContext): Overlay {
  const { removalImpact, activeDiffId, activeViewId, compareView, compareMode } = context
  if (removalImpact) {
    return { diagram: removalImpact.diagram, mode: null }
  }
  if (
    activeDiffId && compareView?.diagram
    && compareView.diffId === activeDiffId
    && compareView.viewId === activeViewId
  ) {
    return { diagram: compareView.diagram, mode: compareMode }
  }
  return NoOverlay
}

function LikeC4PlaygroundEditor({ children }: PropsWithChildren) {
  const actor = usePlaygroundActorRef()

  return (
    <LikeC4EditorProvider
      editor={{
        fetchView: () => {
          throw new Error('Function not implemented.')
        },
        handleChange: (_, change) => {
          actor.send({
            type: 'workspace.applyViewChanges',
            change,
          })
        },
      }}>
      {children}
    </LikeC4EditorProvider>
  )
}
