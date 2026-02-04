import { ReactFlowProvider as XYFlowProvider } from '@xyflow/react'
import { Profiler } from 'react'
import { FitViewPaddings } from '../base/const'
import { RootContainer } from '../components/RootContainer'
import { DiagramFeatures } from '../context/DiagramFeatures'
import { EnsureMantine } from '../context/EnsureMantine'
import { FramerMotionConfig } from '../context/FramerMotionConfig'
import { TagStylesProvider } from '../context/TagStylesContext'
import { useId } from '../hooks/useId'
import { LikeC4DiagramXYFlow } from '../likec4diagram/DiagramXYFlow'
import { DiagramActorProvider } from '../likec4diagram/state/DiagramActorProvider'
import { LikeC4Styles } from '../LikeC4Styles'
import type { AdhocViewService } from './actor.types'
import { AdhocEditorActorProvider } from './ActorProvider'
import { EditorNavigationPanel } from './EditorNavigationPanel'
import { useAdhocView } from './hooks'
import { SelectElementOverlay } from './SelectElementOverlay'

const noop = () => {}

export function LikeC4AdHocViewEditor({ service }: { service: AdhocViewService }) {
  const id = useId()
  return (
    <EnsureMantine>
      <FramerMotionConfig>
        <Profiler id="LikeC4AdHocViewEditor" onRender={noop}>
          <DiagramFeatures
            features={{
              enableFitView: true,
              enableEditor: false,
              enableReadOnly: true,
              enableFocusMode: false,
              enableNavigateTo: false,
              enableElementDetails: false,
              enableRelationshipDetails: false,
              enableRelationshipBrowser: false,
              enableSearch: false,
              enableNavigationButtons: false,
              enableDynamicViewWalkthrough: false,
              enableNotations: false,
              enableVscode: false,
              enableControls: false,
              enableElementTags: false,
              enableCompareWithLatest: false,
            }}
          >
            <LikeC4Styles id={id} />
            <TagStylesProvider rootSelector={`#${id}`}>
              <RootContainer id={id}>
                <AdhocEditorActorProvider service={service}>
                  <LikeC4AdHocView id={id} />
                  <EditorNavigationPanel />
                  <SelectElementOverlay />
                </AdhocEditorActorProvider>
              </RootContainer>
            </TagStylesProvider>
          </DiagramFeatures>
        </Profiler>
      </FramerMotionConfig>
    </EnsureMantine>
  )
}
// interface LikeC4AdHocViewProps {
//   view: LayoutedElementView
// }

function LikeC4AdHocView({ id }: { id: string }) {
  const view = useAdhocView()
  return (
    <XYFlowProvider fitView initialNodes={[]} initialEdges={[]}>
      <DiagramActorProvider
        id={id}
        view={view}
        zoomable
        pannable
        fitViewPadding={FitViewPaddings.withControls}
        nodesDraggable={false}
        nodesSelectable
      >
        <LikeC4DiagramXYFlow />
      </DiagramActorProvider>
    </XYFlowProvider>
  )
}
