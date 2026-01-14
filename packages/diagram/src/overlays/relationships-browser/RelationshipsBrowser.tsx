import { cx } from '@likec4/styles/css'
import { ActionIcon, Group, Tooltip as MantineTooltip } from '@mantine/core'
import { useClipboard, useStateHistory } from '@mantine/hooks'
import { IconAlertTriangle, IconCheck, IconChevronLeft, IconChevronRight, IconLink, IconX } from '@tabler/icons-react'
import { Panel, ReactFlowProvider, useReactFlow, useStoreApi } from '@xyflow/react'
import { shallowEqual } from 'fast-equals'
import { AnimatePresence, LayoutGroup, m } from 'motion/react'
import { memo, useEffect, useRef, useState } from 'react'
import type { SnapshotFrom } from 'xstate'
import { BaseXYFlow } from '../../base/BaseXYFlow'
import { useCallbackRef } from '../../hooks/useCallbackRef'
import type { RelationshipsBrowserTypes } from './_types'
import type { RelationshipsBrowserActorRef } from './actor'
import { CompoundNode, ElementNode, EmptyNode, RelationshipEdge } from './custom'
import {
  RelationshipsBrowserActorContext,
  useRelationshipsBrowser,
  useRelationshipsBrowserState,
} from './hooks'
import { useRelationshipsView } from './layout'
import { SelectElement } from './SelectElement'

const nodeTypes: RelationshipsBrowserTypes.NodeRenderers = {
  element: ElementNode,
  compound: CompoundNode,
  empty: EmptyNode,
}

export const edgeTypes = {
  relationship: RelationshipEdge,
}
export type RelationshipsBrowserProps = {
  actorRef: RelationshipsBrowserActorRef
}

export function RelationshipsBrowser({ actorRef }: RelationshipsBrowserProps) {
  // const actorRef = useDiagramActorState(s => s.children.relationshipsBrowser)
  // if (actorRef == null) {
  //   return null
  // }
  const initialRef = useRef<{
    initialNodes: RelationshipsBrowserTypes.AnyNode[]
    initialEdges: RelationshipsBrowserTypes.Edge[]
  }>(null)

  if (initialRef.current == null) {
    initialRef.current = {
      initialNodes: [],
      initialEdges: [],
    }
  }

  return (
    <RelationshipsBrowserActorContext.Provider value={actorRef}>
      <ReactFlowProvider {...initialRef.current}>
        <LayoutGroup id={actorRef.sessionId} inherit={false}>
          <AnimatePresence>
            <RelationshipsBrowserXYFlow />
          </AnimatePresence>
        </LayoutGroup>
      </ReactFlowProvider>
    </RelationshipsBrowserActorContext.Provider>
  )
}

const selector = (state: SnapshotFrom<RelationshipsBrowserActorRef>) => ({
  isActive: state.hasTag('active'),
  nodes: state.context.xynodes,
  edges: state.context.xyedges,
})
const selectorEq = (a: ReturnType<typeof selector>, b: ReturnType<typeof selector>) =>
  a.isActive === b.isActive &&
  shallowEqual(a.nodes, b.nodes) &&
  shallowEqual(a.edges, b.edges)

const RelationshipsBrowserXYFlow = memo(() => {
  const browser = useRelationshipsBrowser()
  const {
    isActive,
    nodes,
    edges,
  } = useRelationshipsBrowserState(
    selector,
    selectorEq,
  )

  return (
    <BaseXYFlow<RelationshipsBrowserTypes.AnyNode, RelationshipsBrowserTypes.Edge>
      id={browser.rootElementId}
      nodes={nodes}
      edges={edges}
      className={cx(
        isActive ? 'initialized' : 'not-initialized',
        'relationships-browser',
      )}
      nodeTypes={nodeTypes}
      edgeTypes={edgeTypes}
      fitView={false}
      onNodeClick={useCallbackRef((_e, node) => {
        _e.stopPropagation()
        browser.send({ type: 'xyflow.nodeClick', node })
      })}
      onEdgeClick={useCallbackRef((_e, edge) => {
        _e.stopPropagation()
        browser.send({ type: 'xyflow.edgeClick', edge })
      })}
      onPaneClick={useCallbackRef((_e) => {
        _e.stopPropagation()
        browser.send({ type: 'xyflow.paneClick' })
      })}
      onDoubleClick={useCallbackRef((_e) => {
        browser.send({ type: 'xyflow.paneDblClick' })
      })}
      onViewportResize={useCallbackRef(() => {
        browser.send({ type: 'xyflow.resized' })
      })}
      onNodesChange={useCallbackRef((changes) => {
        browser.send({ type: 'xyflow.applyNodeChanges', changes })
      })}
      onEdgesChange={useCallbackRef((changes) => {
        browser.send({ type: 'xyflow.applyEdgeChanges', changes })
      })}
      onEdgeMouseEnter={useCallbackRef((_event, edge) => {
        if (!edge.data.hovered) {
          browser.send({ type: 'xyflow.edgeMouseEnter', edge })
        }
      })}
      onEdgeMouseLeave={useCallbackRef((_event, edge) => {
        if (edge.data.hovered) {
          browser.send({ type: 'xyflow.edgeMouseLeave', edge })
        }
      })}
      onSelectionChange={useCallbackRef((params) => {
        browser.send({ type: 'xyflow.selectionChange', ...params })
      })}
      nodesDraggable={false}
      nodesSelectable
      pannable
      zoomable
    >
      <RelationshipsBrowserInner />
    </BaseXYFlow>
  )
})

const selector2 = (state: SnapshotFrom<RelationshipsBrowserActorRef>) => ({
  subjectId: state.context.subject,
  viewId: state.context.viewId,
  scope: state.context.scope,
  closeable: state.context.closeable,
})

const RelationshipsBrowserInner = memo(() => {
  const browser = useRelationshipsBrowser()
  const {
    subjectId,
    viewId,
    scope,
    closeable,
  } = useRelationshipsBrowserState(selector2)

  const store = useStoreApi<RelationshipsBrowserTypes.AnyNode, RelationshipsBrowserTypes.Edge>()
  const instance = useReactFlow<RelationshipsBrowserTypes.AnyNode, RelationshipsBrowserTypes.Edge>()

  useEffect(() => {
    if (instance.viewportInitialized) {
      browser.send({ type: 'xyflow.init', instance, store })
    }
  }, [store, instance.viewportInitialized, browser])

  const layouted = useRelationshipsView(subjectId, viewId, scope)
  const [historySubjectId, historyOps, { history, current }] = useStateHistory(subjectId)

  useEffect(() => {
    if (historySubjectId !== subjectId) {
      historyOps.set(subjectId)
    }
  }, [subjectId])

  useEffect(() => {
    if (historySubjectId !== subjectId) {
      browser.navigateTo(historySubjectId)
    }
  }, [historySubjectId, browser])

  useEffect(() => {
    browser.updateView(layouted)
  }, [layouted, browser])

  const hasStepBack = current > 0
  const hasStepForward = current + 1 < history.length

  return (
    <>
      <TopLeftPanel
        hasStepBack={hasStepBack}
        hasStepForward={hasStepForward}
        onStepBack={() => historyOps.back()}
        onStepForward={() => historyOps.forward()}
      />
      {closeable && (
        <Panel position="top-right">
          <Group gap={4} wrap={'nowrap'}>
            <CopyLinkButton subjectId={subjectId} />
            <ActionIcon
              variant="default"
              color="gray"
              onClick={(e) => {
                e.stopPropagation()
                browser.close()
              }}>
              <IconX />
            </ActionIcon>
          </Group>
        </Panel>
      )}
    </>
  )
})

type TopLeftPanelProps = {
  hasStepBack: boolean
  hasStepForward: boolean
  onStepBack: () => void
  onStepForward: () => void
}
const TopLeftPanel = ({
  hasStepBack,
  hasStepForward,
  onStepBack,
  onStepForward,
}: TopLeftPanelProps) => {
  return (
    <Panel position="top-left">
      <Group gap={4} wrap={'nowrap'}>
        <AnimatePresence mode="popLayout">
          {hasStepBack && (
            <m.div
              layout
              initial={{ opacity: 0.05, transform: 'translateX(-5px)' }}
              animate={{ opacity: 1, transform: 'translateX(0)' }}
              exit={{
                opacity: 0.05,
                transform: 'translateX(-10px)',
              }}
              key={'back'}>
              <ActionIcon
                variant="default"
                color="gray"
                onClick={e => {
                  e.stopPropagation()
                  onStepBack()
                }}>
                <IconChevronLeft />
              </ActionIcon>
            </m.div>
          )}
          {hasStepForward && (
            <m.div
              layout
              initial={{ opacity: 0.05, transform: 'translateX(5px)' }}
              animate={{ opacity: 1, transform: 'translateX(0)' }}
              exit={{
                opacity: 0,
                transform: 'translateX(5px)',
              }}
              key={'forward'}>
              <ActionIcon
                variant="default"
                color="gray"
                onClick={e => {
                  e.stopPropagation()
                  onStepForward()
                }}>
                <IconChevronRight />
              </ActionIcon>
            </m.div>
          )}
        </AnimatePresence>
        <SelectElement />
      </Group>
    </Panel>
  )
}

/**
 * Props for CopyLinkButton.
 * @property subjectId - Element FQN to include in the URL as `?relationships={subjectId}`
 */
type CopyLinkButtonProps = {
  subjectId: string
}

const Tooltip = MantineTooltip.withProps({
  color: 'dark',
  fz: 'xs',
  openDelay: 400,
  closeDelay: 150,
  label: '',
  children: null,
  offset: 4,
  withinPortal: false,
})

/**
 * Builds a shareable URL with the relationships parameter.
 * Handles both browser history routing and hash-based routing.
 * Preserves base paths when app is hosted under a sub-path.
 */
function buildRelationshipUrl(subjectId: string): string {
  const currentUrl = new URL(window.location.href)

  // Hash-based routing: /#/view/name or /base/path/index.html#/view/name
  if (currentUrl.hash.startsWith('#/')) {
    const hashUrl = new URL(currentUrl.hash.substring(1), currentUrl.origin)
    hashUrl.searchParams.set('relationships', subjectId)

    const cleanPath = hashUrl.pathname.replace(/\/$/, '')

    return `${currentUrl.origin}${currentUrl.pathname}${currentUrl.search}#${cleanPath}${hashUrl.search}`
  }

  // Standard browser history routing
  currentUrl.searchParams.set('relationships', subjectId)
  return currentUrl.href
}

/**
 * Button that copies a direct link to the current relationship view.
 * Shows visual feedback for both success and failure states.
 * Note: Clipboard API requires HTTPS or localhost. This is a browser security restriction, not a code issue.
 */
const CopyLinkButton = ({ subjectId }: CopyLinkButtonProps) => {
  const clipboard = useClipboard({ timeout: 2000 })
  const [copyError, setCopyError] = useState(false)
  const errorTimeoutRef = useRef<number | null>(null)

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation()

    // Clear previous error state
    setCopyError(false)
    if (errorTimeoutRef.current) {
      clearTimeout(errorTimeoutRef.current)
      errorTimeoutRef.current = null
    }

    const url = buildRelationshipUrl(subjectId)

    // Check if we're NOT in a secure context (HTTP on non-localhost)
    // Clipboard API requires HTTPS or localhost
    if (!window.isSecureContext) {
      setCopyError(true)
      errorTimeoutRef.current = window.setTimeout(() => {
        setCopyError(false)
      }, 2000)
      return
    }

    // Call clipboard.copy() - Mantine's hook catches errors internally
    // Errors are exposed via clipboard.error property, not thrown
    clipboard.copy(url)
  }

  // Watch for clipboard errors - Mantine's useClipboard exposes errors via clipboard.error
  useEffect(() => {
    if (clipboard.error) {
      setCopyError(true)
      if (errorTimeoutRef.current) {
        clearTimeout(errorTimeoutRef.current)
      }
      errorTimeoutRef.current = window.setTimeout(() => {
        setCopyError(false)
      }, 2000)
    }
  }, [clipboard.error])

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (errorTimeoutRef.current) {
        clearTimeout(errorTimeoutRef.current)
      }
    }
  }, [])

  // Determine icon and tooltip based on state
  const getButtonState = () => {
    if (clipboard.copied) {
      return {
        icon: <IconCheck />,
        tooltip: 'Link copied!',
      }
    }
    if (copyError) {
      return {
        icon: <IconAlertTriangle />,
        tooltip: 'Copy failed - Clipboard requires HTTPS or localhost',
      }
    }
    return {
      icon: <IconLink />,
      tooltip: 'Copy link to this relationship view',
    }
  }

  const buttonState = getButtonState()

  return (
    <Tooltip label={buttonState.tooltip} withArrow position="top" withinPortal={false}>
      <ActionIcon
        variant="default"
        color="gray"
        onClick={handleCopy}
        aria-label="Copy link to this relationship view"
      >
        {buttonState.icon}
      </ActionIcon>
    </Tooltip>
  )
}
