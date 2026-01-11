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

export type { AdhocViewService } from './actor.types'

export function LikeC4AdHocViewEditor({ service }: { service: AdhocViewService }) {
  const id = useId()
  return (
    <Profiler id="LikeC4AdHocViewEditor" onRender={() => {}}>
      <EnsureMantine>
        <FramerMotionConfig>
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
                  <LikeC4AdHocView />
                  <EditorNavigationPanel />
                  <SelectElementOverlay />
                </AdhocEditorActorProvider>
              </RootContainer>
            </TagStylesProvider>
          </DiagramFeatures>
        </FramerMotionConfig>
      </EnsureMantine>
    </Profiler>
  )
}
// interface LikeC4AdHocViewProps {
//   view: LayoutedElementView
// }

function LikeC4AdHocView() {
  const view = useAdhocView()
  return (
    <XYFlowProvider fitView initialNodes={[]} initialEdges={[]}>
      <DiagramActorProvider
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
