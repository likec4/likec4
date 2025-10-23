import type { scalar } from '@likec4/core'
import type { LikeC4Model } from '@likec4/core/model'
import { LikeC4Diagram, LikeC4ModelProvider } from '@likec4/diagram'
import { Button } from '@mantine/core'
import { only } from 'remeda'
import { likec4Container, likec4ParsingScreen } from './App.css'
import { IconRenderer } from './IconRenderer'
import { ErrorMessage, QueryErrorBoundary } from './QueryErrorBoundary'
import {
  setLastClickedNode,
  setLayoutType,
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
        <Initialized likec4Model={likec4Model} />
      </QueryErrorBoundary>
    </LikeC4ModelProvider>
  )
}

function Initialized({ likec4Model }: { likec4Model: LikeC4Model }) {
  const [{
    nodesDraggable,
    edgesEditable,
  }] = useVscodeAppState()

  let {
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
            bottom: '30px',
            left: '60px',
            right: '30px',
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
          enableRelationshipDetails
          enableCompareWithLatest
          showNavigationButtons
          enableNotations
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
            if (view._type === 'dynamic' && edge.astPath) {
              extensionApi.locate({ view: view.id, astPath: edge.astPath })
              return
            }
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
          onLayoutTypeChange={setLayoutType}
        />
      </div>
      {error && <ErrorMessage error={error} />}
    </>
  )
}
