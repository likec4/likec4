import { type DiagramNode, type DiagramView } from '@likec4/core'
import { type ElementIconRenderer, LikeC4Diagram, useUpdateEffect } from '@likec4/diagram'
import Icon from '@likec4/icons/all'
import { Box, Button, Loader, LoadingOverlay, Notification } from '@mantine/core'
import { useDebouncedEffect } from '@react-hookz/web'
import { IconX } from '@tabler/icons-react'
import { useCallback, useRef, useState } from 'react'
import * as css from './App.css'
import { likec4Container, likec4ParsingScreen } from './App.css'
import { extensionApi, getPreviewWindowState, savePreviewWindowState, useMessenger } from './vscode'

const ErrorMessage = ({ error }: { error: string | null }) => (
  <Box className={css.stateAlert}>
    <Notification
      icon={<IconX style={{ width: 20, height: 20 }} />}
      color={'red'}
      withCloseButton={false}>
      {error ?? 'Oops, something went wrong'}
    </Notification>
  </Box>
)

const IconRenderer: ElementIconRenderer = ({ node }) => {
  return <Icon name={(node.icon ?? '') as any} />
}

type RpcState = {
  state: 'loading'
} | {
  state: 'ready'
  // view: DiagramView
} | {
  state: 'error'
  error: string
}

type InternalState = {
  view: DiagramView | null
  nodesDraggable: boolean
  edgesEditable: boolean
}

const App = () => {
  const lastNodeContextMenuRef = useRef<DiagramNode | null>(null)

  function resetLastClickedNd() {
    lastNodeContextMenuRef.current = null
  }

  const [rpcState, setRpcState] = useState<RpcState>({ state: 'loading' })
  const [{ view, edgesEditable, nodesDraggable }, setInternalState] = useState<InternalState>(getPreviewWindowState)

  const updateView = useCallback((view: DiagramView | null) => {
    resetLastClickedNd()
    if (view) {
      savePreviewWindowState({
        view
      })
      setRpcState(s => s.state === 'ready' ? s : { state: 'ready' })
      setInternalState(s => ({ ...s, view }))
    } else {
      setRpcState({ state: 'error', error: 'View not found' })
    }
  }, [])

  useMessenger({
    onDiagramUpdate: updateView,
    onError: error => {
      setRpcState({
        state: 'error',
        error
      })
    },
    onGetHoveredElement: () => {
      return lastNodeContextMenuRef.current?.id ?? null
    }
  })

  useDebouncedEffect(
    () => extensionApi.imReady(),
    [],
    100
  )

  useUpdateEffect(() => {
    extensionApi.updateWebviewState({
      nodesDraggable,
      edgesEditable
    })
  }, [nodesDraggable, edgesEditable])

  if (!view) {
    return (
      <div className={likec4ParsingScreen}>
        {rpcState.state === 'error' && (
          <section>
            <h3>Oops, invalid view</h3>
            <p>
              Failed to parse your model:<br />
              {rpcState.error}
            </p>
          </section>
        )}
        {rpcState.state !== 'error' && (
          <section>
            <p>Parsing your model...</p>
            <Loader />
          </section>
        )}
        <section>
          <p>
            <Button color="gray" onClick={extensionApi.closeMe}>
              Close
            </Button>
          </p>
        </section>
      </div>
    )
  }
  return (
    <>
      <div className={likec4Container} data-vscode-context='{"preventDefaultContextMenuItems": true}'>
        <LoadingOverlay
          visible={rpcState.state === 'loading'}
          zIndex={1000}
          overlayProps={{ blur: 1, backgroundOpacity: 0.1 }} />
        <LikeC4Diagram
          view={view}
          fitViewPadding={0.09}
          readonly={false}
          controls={false}
          nodesDraggable={nodesDraggable}
          experimentalEdgeEditing={edgesEditable}
          enableFocusMode
          enableDynamicViewWalkthrough
          showNavigationButtons
          showElementLinks
          showNotations
          renderIcon={IconRenderer}
          onNavigateTo={(to, event) => {
            resetLastClickedNd()
            extensionApi.goToViewSource(to)
            extensionApi.openView(to)
            event?.stopPropagation()
          }}
          onNodeContextMenu={(element) => {
            lastNodeContextMenuRef.current = element
          }}
          onCanvasContextMenu={event => {
            resetLastClickedNd()
            event.stopPropagation()
            event.preventDefault()
          }}
          onEdgeContextMenu={(edge, event) => {
            resetLastClickedNd()
            event.stopPropagation()
            event.preventDefault()
          }}
          onChange={({ change }) => {
            extensionApi.change(view.id, change)
          }}
          onCanvasClick={() => {
            resetLastClickedNd()
          }}
          onOpenSourceView={() => {
            resetLastClickedNd()
            extensionApi.goToViewSource(view.id)
          }}
          onOpenSourceElement={fqn => {
            resetLastClickedNd()
            extensionApi.goToElement(fqn)
          }}
          onOpenSourceRelation={id => {
            resetLastClickedNd()
            extensionApi.goToRelation(id)
          }}
        />
      </div>
      {rpcState.state === 'error' && <ErrorMessage error={rpcState.error} />}
    </>
  )
}

export default App
