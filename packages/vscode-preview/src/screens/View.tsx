import type { scalar } from '@likec4/core'
import { LikeC4Diagram, LikeC4EditorProvider, LikeC4ModelProvider } from '@likec4/diagram'
import { Button } from '@mantine/core'
import { memo } from 'react'
import { only } from 'remeda'
import { likec4Container, likec4ParsingScreen } from '../App.css'
import { ErrorMessage } from '../QueryErrorBoundary'
import {
  openProjectsScreen,
  setLastClickedNode,
  setLayoutType,
  useComputedModel,
  useDiagramView,
  useLikeC4EditorPort,
} from '../state'
import { ExtensionApi as extensionApi } from '../vscode'

export function ViewScreen() {
  const { error, likec4Model, reset } = useComputedModel()
  const editor = useLikeC4EditorPort()
  if (!likec4Model) {
    return (
      <>
        <section>
          {error && <ErrorMessage error={error} onReset={reset} />}
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
    <LikeC4ModelProvider key={likec4Model.projectId} likec4model={likec4Model}>
      {error && <ErrorMessage error={error} onReset={reset} />}
      <LikeC4EditorProvider editor={editor}>
        <Initialized />
      </LikeC4EditorProvider>
    </LikeC4ModelProvider>
  )
}
const Initialized = memo(() => {
  let {
    projectId,
    view,
    error,
    reset,
  } = useDiagramView()

  if (!view) {
    return (
      <div className={likec4ParsingScreen}>
        {error && <ErrorMessage error={error} onReset={reset} />}
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
          controls
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
          onNavigateTo={(_to, event) => {
            const to = _to as scalar.ViewId
            setLastClickedNode()
            extensionApi.locate({ view: to, projectId })
            extensionApi.navigateTo(to, projectId)
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
              extensionApi.locate({
                projectId,
                view: view.id,
                astPath: edge.astPath,
              })
              return
            }
            const relationId = only(edge.relations)
            if (relationId) {
              extensionApi.locate({
                projectId,
                relation: relationId,
              })
            }
          }}
          onEdgeContextMenu={(edge, event) => {
            setLastClickedNode()
            event.stopPropagation()
            event.preventDefault()
          }}
          onOpenSource={(params) => {
            setLastClickedNode()
            extensionApi.locate({
              projectId,
              ...params,
            })
          }}
          onInitialized={() => {
            extensionApi.locate({
              projectId,
              view: view.id,
            })
          }}
          onLogoClick={openProjectsScreen}
          onLayoutTypeChange={setLayoutType}
        />
      </div>
      {error && <ErrorMessage error={error} onReset={reset} />}
    </>
  )
})
