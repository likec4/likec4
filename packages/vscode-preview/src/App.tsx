import type { scalar } from '@likec4/core'
import { LikeC4Diagram, LikeC4ModelProvider } from '@likec4/diagram'
import { IconRenderer } from '@likec4/icons/all'
import { Button } from '@mantine/core'
import { only } from 'remeda'
import { likec4Container, likec4ParsingScreen } from './App.css'
import { ErrorMessage, QueryErrorBoundary } from './QueryErrorBoundary'
import {
  setLastClickedNode,
  useComputedModel,
  useDiagramView,
  useVscodeAppState,
} from './state'
import { ExtensionApi as extensionApi } from './vscode'

export function App() {
  const { error, likec4Model } = useComputedModel()

  if (!likec4Model) {
    if (error) {
      return <ErrorMessage error={error} />
    }
    return (
      <>
        <section>
          <p>Parsing your model...</p>
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
      {error && <ErrorMessage error={error} />}
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
  } = useDiagramView()

  if (!view) {
    return (
      <div className={likec4ParsingScreen}>
        {error && <ErrorMessage error={error} />}
        <section>
          <p>Parsing your model...</p>
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
        <LikeC4Diagram
          view={view}
          fitViewPadding={{
            top: '70px',
            bottom: '10px',
            left: '60px',
            right: '10px',
          }}
          readonly={false}
          controls
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
      {error && <ErrorMessage error={error} />}
    </>
  )
}
