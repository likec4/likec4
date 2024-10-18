import { type ElementIconRenderer, LikeC4Diagram } from '@likec4/diagram'
import Icon from '@likec4/icons/all'
import { Box, Button, Loader, LoadingOverlay, Notification } from '@mantine/core'
import { useDebouncedValue } from '@mantine/hooks'
import { IconX } from '@tabler/icons-react'
import * as css from './App.css'
import { likec4Container, likec4ParsingScreen } from './App.css'
import { changeViewId, setLastClickedNode, useLikeC4View, useVscodeAppState } from './state'
import { ExtensionApi as extensionApi } from './vscode'

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

export default function App() {
  const [{
    nodesDraggable,
    edgesEditable
  }] = useVscodeAppState()

  const {
    state,
    view,
    error
  } = useLikeC4View()

  // Debounce loading state to prevent flickering
  const [isLoading] = useDebouncedValue(state === 'pending' || state === 'stale', 100)

  if (!view) {
    return (
      <div className={likec4ParsingScreen}>
        {state === 'error' && (
          <section>
            <h3>Oops, invalid view</h3>
            <p>
              Failed to parse your model:<br />
              {error ?? 'Unknown error'}
            </p>
          </section>
        )}
        {state !== 'error' && (
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
          visible={isLoading}
          zIndex={1000}
          overlayProps={{ blur: 1, backgroundOpacity: 0.1 }} />
        <LikeC4Diagram
          view={view}
          fitViewPadding={0.09}
          readonly={false}
          controls
          nodesDraggable={nodesDraggable}
          experimentalEdgeEditing={edgesEditable}
          enableFocusMode
          enableDynamicViewWalkthrough
          enableRelationshipsBrowser
          showNavigationButtons
          showElementLinks
          showNotations
          showRelationshipDetails
          showDiagramTitle
          renderIcon={IconRenderer}
          onNavigateTo={(to, event) => {
            setLastClickedNode()
            extensionApi.goToViewSource(to)
            extensionApi.navigateTo(to)
            changeViewId(to)
            event?.stopPropagation()
          }}
          onNodeContextMenu={(element) => {
            setLastClickedNode(element)
          }}
          onCanvasContextMenu={event => {
            setLastClickedNode()
            event.stopPropagation()
            event.preventDefault()
          }}
          onEdgeContextMenu={(edge, event) => {
            setLastClickedNode()
            event.stopPropagation()
            event.preventDefault()
          }}
          onChange={({ change }) => {
            extensionApi.change(view.id, change)
          }}
          onOpenSourceView={() => {
            setLastClickedNode()
            extensionApi.goToViewSource(view.id)
          }}
          onOpenSourceElement={fqn => {
            setLastClickedNode()
            extensionApi.goToElement(fqn)
          }}
          onOpenSourceRelation={id => {
            setLastClickedNode()
            extensionApi.goToRelation(id)
          }}
        />
      </div>
      {error && <ErrorMessage error={error} />}
    </>
  )
}
