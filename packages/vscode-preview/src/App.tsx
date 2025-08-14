import type { scalar } from '@likec4/core'
import { LikeC4Diagram, LikeC4ModelProvider } from '@likec4/diagram'
import { IconRenderer } from '@likec4/icons/all'
import { Box, Button, Group, Loader, LoadingOverlay, Notification, Text } from '@mantine/core'
import { useDebouncedValue } from '@mantine/hooks'
import { IconX } from '@tabler/icons-react'
import { useQueryErrorResetBoundary } from '@tanstack/react-query'
import { only } from 'remeda'
import { likec4Container, likec4ParsingScreen, stateAlert } from './App.css'
import { QueryErrorBoundary } from './QueryErrorBoundary'
import {
  setLastClickedNode,
  useComputedModel,
  useDiagramView,
  useVscodeAppState,
} from './state'
import { ExtensionApi as extensionApi } from './vscode'

const ErrorMessage = ({ error }: { error: string | null }) => {
  const { reset } = useQueryErrorResetBoundary()
  return (
    <Box className={stateAlert}>
      <Notification
        icon={<IconX style={{ width: 20, height: 20 }} />}
        styles={{
          icon: {
            alignSelf: 'flex-start',
          },
        }}
        color={'red'}
        title={'Oops, something went wrong'}
        withCloseButton={false}>
        <Text
          style={{
            whiteSpace: 'preserve-breaks',
          }}>
          {error ?? 'Unknown error'}
        </Text>
        <Group gap={'xs'} mt="sm">
          <Button color="gray" variant="light" onClick={() => reset()}>Refresh</Button>
          <Button color="gray" variant="subtle" onClick={extensionApi.closeMe}>Close</Button>
        </Group>
      </Notification>
    </Box>
  )
}

export default function App() {
  const { error, likec4Model } = useComputedModel()

  if (!likec4Model) {
    return (
      <>
        {error && <ErrorMessage error={error.message} />}
        <section>
          <p>Parsing your model...</p>
          <Loader />
          <p>
            <Button color="gray" onClick={extensionApi.closeMe}>
              Close
            </Button>
          </p>
        </section>
      </>
    )
  }

  return (
    <LikeC4ModelProvider likec4model={likec4Model}>
      {error && <ErrorMessage error={error.message} />}
      <QueryErrorBoundary>
        <Initialized />
      </QueryErrorBoundary>
    </LikeC4ModelProvider>
  )
}

function Initialized() {
  const [{
    nodesDraggable,
    edgesEditable,
  }] = useVscodeAppState()

  const {
    view,
    error,
    isFetching,
  } = useDiagramView()

  // Debounce loading state to prevent flickering
  const [isLoading] = useDebouncedValue(isFetching, 250)

  if (!view) {
    return (
      <div className={likec4ParsingScreen}>
        {error && <ErrorMessage error={error.message} />}
        <Loader />
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
          fitViewPadding={{
            top: '70px',
            bottom: '10px',
            left: '60px',
            right: '10px',
          }}
          readonly={false}
          controls="next"
          nodesDraggable={nodesDraggable}
          experimentalEdgeEditing={edgesEditable}
          enableFocusMode
          enableDynamicViewWalkthrough
          enableElementDetails
          enableRelationshipBrowser
          enableElementTags
          enableSearch
          showNavigationButtons
          showNotations
          enableRelationshipDetails
          showDiagramTitle={false}
          renderIcon={IconRenderer}
          onNavigateTo={(_to, event) => {
            const to = _to as scalar.ViewId
            setLastClickedNode()
            extensionApi.locate({ view: to })
            extensionApi.navigateTo(to)
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
          onEdgeClick={(edge) => {
            const relationId = only(edge.relations)
            if (relationId) {
              extensionApi.locate({ relation: relationId })
            }
          }}
          onEdgeContextMenu={(edge, event) => {
            setLastClickedNode()
            event.stopPropagation()
            event.preventDefault()
          }}
          onChange={({ change }) => {
            extensionApi.change(view.id, change)
          }}
          onOpenSource={(params) => {
            setLastClickedNode()
            extensionApi.locate(params)
          }}
        />
      </div>
      {error && <ErrorMessage error={error.message} />}
    </>
  )
}
